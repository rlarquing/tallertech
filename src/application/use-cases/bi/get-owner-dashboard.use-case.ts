// ============================================================
// Get Owner Dashboard Use Case - BI across all owner's workshops
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type {
  SaleRepository,
  RepairRepository,
  ProductRepository,
  ExpenseRepository,
  CustomerRepository,
  WorkshopRepository,
} from '@/domain/repositories'
import type { SessionPort } from '@/application/ports'
import type { OwnerDashboard, WorkshopBI } from '@/application/dtos'
import { ValidationError } from '@/domain/errors'
import type { RepairOrder, Expense as ExpenseEntity } from '@/domain/entities'

export class GetOwnerDashboardUseCase {
  constructor(
    private workshopRepository: WorkshopRepository,
    private saleRepository: SaleRepository,
    private repairRepository: RepairRepository,
    private productRepository: ProductRepository,
    private expenseRepository: ExpenseRepository,
    private customerRepository: CustomerRepository,
    private sessionPort: SessionPort,
  ) {}

  async execute(_request?: Record<string, never>, sessionRequest?: Request): Promise<OwnerDashboard> {
    // 1. Authenticate
    const user = sessionRequest
      ? await this.sessionPort.getSessionUser(sessionRequest)
      : null
    if (!user) {
      throw new ValidationError('No autenticado')
    }

    // 2. Get all workshops for this user
    const workshopsWithRole = await this.workshopRepository.findByUserId(user.id)

    // 3. Calculate date ranges
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)

    // 4. Build BI for each workshop
    const workshopBIList: WorkshopBI[] = []

    for (const ws of workshopsWithRole) {
      const workshopId = ws.id

      // Get sales stats
      const salesStats = await this.saleRepository.getSalesStats(monthStart, now, workshopId)
      const salesStats30Days = await this.saleRepository.getSalesStats(thirtyDaysAgo, now, workshopId)

      // Get expenses
      const expensesByCategory = await this.expenseRepository.getByCategory(monthStart, now, workshopId)
      const expensesLast30 = await this.expenseRepository.findByDateRange(thirtyDaysAgo, now, workshopId)

      // Get repairs
      const allRepairs = await this.repairRepository.findMany({ take: 1000, workshopId })
      const repairsByStatus: Record<string, number> = {}
      let pendingRepairs = 0
      let completedRepairsToday = 0
      for (const repair of allRepairs.data) {
        const r = repair as unknown as RepairOrder
        repairsByStatus[r.status] = (repairsByStatus[r.status] || 0) + 1
        if (['received', 'diagnosing', 'waiting_parts', 'repairing'].includes(r.status)) {
          pendingRepairs++
        }
        if (r.completedAt && new Date(r.completedAt) >= today) {
          completedRepairsToday++
        }
      }

      // Get products
      const allProducts = await this.productRepository.findMany({ take: 1000, workshopId })
      const lowStockProducts = await this.productRepository.findLowStock()

      // Get customers
      const allCustomers = await this.customerRepository.findMany({ take: 1, workshopId })

      // Calculate total expenses
      let totalExpenses = 0
      for (const e of expensesByCategory) {
        totalExpenses += e.total
      }

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

      const topProducts = salesStats30Days.byDay.slice(0, 10).map((d) => ({
        name: d.date,
        total: d.total,
        quantity: d.count,
      }))

      const salesByPaymentMethod = Object.entries(salesStats.byPaymentMethod).map(
        ([method, total]) => ({ method, total, count: 0 }),
      )

      workshopBIList.push({
        workshopId,
        workshopName: ws.name,
        period: monthStart.toISOString().split('T')[0] + ' - ' + now.toISOString().split('T')[0],
        totalRevenue: salesStats.totalRevenue,
        totalExpenses,
        netProfit: salesStats.totalRevenue - totalExpenses,
        salesCount: salesStats.totalSales,
        repairsCount: allRepairs.total,
        customersCount: allCustomers.total,
        productsCount: allProducts.total,
        lowStockCount: lowStockProducts.length,
        pendingRepairsCount: pendingRepairs,
        completedRepairsToday,
        revenueChart,
        topProducts,
        expensesByCategory: expensesByCategory.map((e) => ({
          category: e.category,
          total: e.total,
        })),
        salesByPaymentMethod,
        repairsByStatus,
      })
    }

    // 5. Aggregate totals across workshops
    const totalRevenue = workshopBIList.reduce((sum, w) => sum + w.totalRevenue, 0)
    const totalExpenses = workshopBIList.reduce((sum, w) => sum + w.totalExpenses, 0)

    return {
      totalWorkshops: workshopsWithRole.length,
      totalRevenue,
      totalExpenses,
      totalNetProfit: totalRevenue - totalExpenses,
      workshops: workshopBIList,
    }
  }
}
