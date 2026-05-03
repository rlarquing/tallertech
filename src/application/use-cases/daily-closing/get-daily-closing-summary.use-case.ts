// ============================================================
// Get Daily Closing Summary Use Case
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { SaleRepository, RepairRepository, ExpenseRepository } from '@/domain/repositories'
import type { SessionPort } from '@/application/ports'
import type { DailyClosingSummary } from '@/application/dtos'
import { ValidationError } from '@/domain/errors'

export class GetDailyClosingSummaryUseCase {
  constructor(
    private saleRepository: SaleRepository,
    private repairRepository: RepairRepository,
    private expenseRepository: ExpenseRepository,
    private sessionPort: SessionPort,
  ) {}

  async execute(
    params: {
      workshopId: string
      date: string
      userId?: string
    },
    sessionRequest?: Request,
  ): Promise<DailyClosingSummary> {
    // 1. Authenticate
    const user = sessionRequest
      ? await this.sessionPort.getSessionUser(sessionRequest)
      : null
    if (!user) {
      throw new ValidationError('No autenticado')
    }

    // 2. Validate
    if (!params.workshopId) {
      throw new ValidationError('El taller es requerido')
    }
    if (!params.date) {
      throw new ValidationError('La fecha es requerida')
    }

    const closingDate = new Date(params.date)
    if (isNaN(closingDate.getTime())) {
      throw new ValidationError('Fecha inválida')
    }

    // 3. Build date range for the day
    const startOfDay = new Date(closingDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(closingDate)
    endOfDay.setHours(23, 59, 59, 999)

    // Determine target userId: employee can only see their own
    const targetUserId = (user.role === 'owner' || user.role === 'admin')
      ? params.userId
      : user.id

    // 4. Get sales for the day
    const sales = await this.saleRepository.findByDateRange(
      startOfDay,
      endOfDay,
      params.workshopId,
    )
    const filteredSales = sales.filter((s) => {
      const salePlain = s.toPlainObject()
      const matchesUser = targetUserId ? salePlain.userId === targetUserId : true
      return matchesUser && salePlain.status === 'completed'
    })
    const salesCount = filteredSales.length
    const salesTotal = filteredSales.reduce((sum, s) => sum + s.toPlainObject().total, 0)

    // 5. Get repairs for the day
    const repairs = await this.repairRepository.findByStatus('delivered', params.workshopId)
    const filteredRepairs = repairs.filter((r) => {
      const repairPlain = r.toPlainObject()
      const matchesUser = targetUserId ? repairPlain.userId === targetUserId : true
      return matchesUser &&
        repairPlain.deliveredAt &&
        new Date(repairPlain.deliveredAt) >= startOfDay &&
        new Date(repairPlain.deliveredAt) <= endOfDay
    })
    const repairsCount = filteredRepairs.length
    const repairsTotal = filteredRepairs.reduce((sum, r) => sum + r.toPlainObject().totalCost, 0)

    // 6. Get expenses for the day
    const expenses = await this.expenseRepository.findByDateRange(
      startOfDay,
      endOfDay,
      params.workshopId,
    )
    const filteredExpenses = expenses.filter((e) => {
      const expensePlain = e.toPlainObject()
      return targetUserId ? expensePlain.userId === targetUserId : true
    })
    const expensesTotal = filteredExpenses.reduce((sum, e) => sum + e.toPlainObject().amount, 0)

    // 7. Calculate totals
    const totalIncome = salesTotal + repairsTotal
    const netTotal = totalIncome - expensesTotal

    // 8. Return summary
    return {
      salesCount,
      salesTotal,
      repairsCount,
      repairsTotal,
      expensesTotal,
      totalIncome,
      netTotal,
    }
  }
}
