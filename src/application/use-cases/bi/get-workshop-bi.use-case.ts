// ============================================================
// Get Workshop BI Use Case
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
import type { WorkshopBI } from '@/application/dtos'
import { EntityNotFoundError, ValidationError, AuthorizationError } from '@/domain/errors'
import type { RepairOrder, Expense as ExpenseEntity } from '@/domain/entities'

export class GetWorkshopBIUseCase {
  constructor(
    private workshopRepository: WorkshopRepository,
    private saleRepository: SaleRepository,
    private repairRepository: RepairRepository,
    private productRepository: ProductRepository,
    private expenseRepository: ExpenseRepository,
    private customerRepository: CustomerRepository,
    private sessionPort: SessionPort,
  ) {}

  async execute(workshopId: string, sessionRequest?: Request): Promise<WorkshopBI> {
    // 1. Authenticate
    const user = sessionRequest
      ? await this.sessionPort.getSessionUser(sessionRequest)
      : null
    if (!user) {
      throw new ValidationError('No autenticado')
    }

    // 2. Check workshop exists and user has access
    const workshop = await this.workshopRepository.findById(workshopId)
    if (!workshop) {
      throw new EntityNotFoundError('Taller', workshopId)
    }
    const role = await this.workshopRepository.getMemberRole(workshopId, user.id)
    if (!role) {
      throw new AuthorizationError('No tienes acceso a este taller')
    }

    // 3. Calculate date ranges
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)

    // 4. Get sales stats for this workshop
    const salesStats = await this.saleRepository.getSalesStats(monthStart, now, workshopId)
    const salesStats30Days = await this.saleRepository.getSalesStats(thirtyDaysAgo, now, workshopId)

    // 5. Get expenses
    const expensesByCategory = await this.expenseRepository.getByCategory(monthStart, now, workshopId)
    const expensesLast30 = await this.expenseRepository.findByDateRange(thirtyDaysAgo, now, workshopId)

    // 6. Get repairs
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

    // 7. Get products
    const allProducts = await this.productRepository.findMany({ take: 1000, workshopId })
    const lowStockProducts = await this.productRepository.findLowStock()

    // 8. Get customers count
    const allCustomers = await this.customerRepository.findMany({ take: 1, workshopId })

    // 9. Calculate total expenses
    let totalExpenses = 0
    for (const e of expensesByCategory) {
      totalExpenses += e.total
    }

    // 10. Build revenue chart
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

    // 11. Top products from sales
    const topProducts = salesStats30Days.byDay.slice(0, 10).map((d) => ({
      name: d.date,
      total: d.total,
      quantity: d.count,
    }))

    // 12. Sales by payment method
    const salesByPaymentMethod = Object.entries(salesStats.byPaymentMethod).map(
      ([method, total]) => ({ method, total, count: 0 }),
    )

    // 13. Build BI response
    return {
      workshopId,
      workshopName: workshop.name,
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
    }
  }
}
