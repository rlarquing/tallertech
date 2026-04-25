// ============================================================
// Get Dashboard Use Case - Aggregate all dashboard data
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type {
  SaleRepository,
  RepairRepository,
  ProductRepository,
  ExpenseRepository,
  CustomerRepository,
} from '@/domain/repositories'
import type { SessionPort } from '@/application/ports'
import type { DashboardRequest } from '@/application/dtos'
import type { DashboardData, RepairOrder, Expense as ExpenseEntity, Product, Sale } from '@/domain/entities'
import { ValidationError } from '@/domain/errors'

export class GetDashboardUseCase {
  constructor(
    private saleRepository: SaleRepository,
    private repairRepository: RepairRepository,
    private productRepository: ProductRepository,
    private expenseRepository: ExpenseRepository,
    private customerRepository: CustomerRepository,
    private sessionPort: SessionPort,
  ) {}

  async execute(_request?: DashboardRequest, sessionRequest?: Request): Promise<DashboardData> {
    // 1. Authenticate
    const user = sessionRequest
      ? await this.sessionPort.getSessionUser(sessionRequest)
      : null
    if (!user) {
      throw new ValidationError('No autenticado')
    }

    // 2. Calculate date ranges
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const weekStart = new Date(today)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // 3. Get sales stats
    const salesStatsMonth = await this.saleRepository.getSalesStats(monthStart, now)
    const salesStatsWeek = await this.saleRepository.getSalesStats(weekStart, now)
    const salesStatsToday = await this.saleRepository.getSalesStats(today, now)
    const salesStatsYesterday = await this.saleRepository.getSalesStats(yesterday, today)

    // 4. Get repairs by status
    const allRepairs = await this.repairRepository.findMany({ take: 1000 })
    const repairsByStatus: Record<string, number> = {
      received: 0,
      diagnosing: 0,
      waiting_parts: 0,
      repairing: 0,
      ready: 0,
      delivered: 0,
      cancelled: 0,
    }
    let pendingRepairs = 0
    let completedRepairsToday = 0
    for (const repair of allRepairs.data) {
      const r = repair as unknown as RepairOrder
      if (r.status in repairsByStatus) {
        repairsByStatus[r.status]++
      }
      if (['received', 'diagnosing', 'waiting_parts', 'repairing'].includes(r.status)) {
        pendingRepairs++
      }
      if (['ready', 'delivered'].includes(r.status)) {
        if (r.completedAt && new Date(r.completedAt) >= today) {
          completedRepairsToday++
        }
      }
    }

    // 5. Get low stock products
    const lowStockProducts = await this.productRepository.findLowStock()

    // 6. Get top selling products from sales stats
    const topProducts = salesStatsMonth.byDay.slice(0, 10).map((d) => ({
      name: d.date,
      total: d.total,
      quantity: d.count,
    }))

    // 7. Get revenue chart data (last 30 days)
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
    const salesStats30Days = await this.saleRepository.getSalesStats(thirtyDaysAgo, now)

    const expensesByCategory = await this.expenseRepository.getByCategory(monthStart, now)

    // 8. Get expenses for last 30 days
    const expensesLast30 = await this.expenseRepository.findByDateRange(thirtyDaysAgo, now)

    // Build revenue chart
    const revenueByDate: Record<string, number> = {}
    const expensesByDate: Record<string, number> = {}
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo)
      d.setDate(d.getDate() + i)
      const key = d.toISOString().split('T')[0]
      revenueByDate[key] = 0
      expensesByDate[key] = 0
    }

    for (const entry of salesStats30Days.byDay) {
      if (revenueByDate[entry.date] !== undefined) {
        revenueByDate[entry.date] += entry.total
      }
    }

    for (const expense of expensesLast30) {
      const e = expense as unknown as ExpenseEntity
      const key = e.date.toISOString().split('T')[0]
      if (expensesByDate[key] !== undefined) {
        expensesByDate[key] += e.amount
      }
    }

    const revenueChart = Object.entries(revenueByDate).map(([date, revenue]) => ({
      date,
      revenue,
      expenses: expensesByDate[date] || 0,
    }))

    // 9. Get total customers and products
    const allCustomers = await this.customerRepository.findMany({ take: 1 })
    const allProducts = await this.productRepository.findMany({ take: 1 })

    // 10. Get recent sales
    const recentSalesResult = await this.saleRepository.findMany({
      take: 5,
    })

    // 11. Get recent repairs
    const recentRepairsResult = await this.repairRepository.findMany({
      take: 5,
    })

    // 12. Build and return dashboard data
    return {
      salesToday: {
        total: salesStatsToday.totalRevenue,
        count: salesStatsToday.totalSales,
      },
      salesYesterday: {
        total: salesStatsYesterday.totalRevenue,
      },
      salesWeek: {
        total: salesStatsWeek.totalRevenue,
        count: salesStatsWeek.totalSales,
      },
      salesMonth: {
        total: salesStatsMonth.totalRevenue,
        count: salesStatsMonth.totalSales,
      },
      repairsByStatus,
      lowStockCount: lowStockProducts.filter((p: Product) => p.quantity <= p.minStock).length,
      topProducts,
      revenueChart,
      expensesByCategory: expensesByCategory.map((e) => ({
        category: e.category,
        total: e.total,
      })),
      totalCustomers: allCustomers.total,
      totalProducts: allProducts.total,
      pendingRepairs,
      completedRepairsToday,
      recentSales: recentSalesResult.data.map((s: Sale) => ({
        id: s.id,
        code: s.code,
        total: s.total,
        paymentMethod: s.paymentMethod,
        createdAt: String(s.createdAt),
        customer: s.customer ?? null,
      })),
      recentRepairs: recentRepairsResult.data.map((r: RepairOrder) => ({
        id: r.id,
        code: r.code,
        device: r.device,
        status: r.status,
        totalCost: r.totalCost,
        createdAt: String(r.createdAt),
        customer: r.customer ?? null,
      })),
    }
  }
}
