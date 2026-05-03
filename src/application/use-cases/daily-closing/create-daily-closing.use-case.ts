// ============================================================
// Create Daily Closing Use Case
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { DailyClosingRepository, SaleRepository, RepairRepository, ExpenseRepository } from '@/domain/repositories'
import type { AuditPort, SessionPort } from '@/application/ports'
import type { CreateDailyClosingRequest } from '@/application/dtos'
import { ValidationError } from '@/domain/errors'
import type { DailyClosing } from '@/domain/entities'

export class CreateDailyClosingUseCase {
  constructor(
    private dailyClosingRepository: DailyClosingRepository,
    private saleRepository: SaleRepository,
    private repairRepository: RepairRepository,
    private expenseRepository: ExpenseRepository,
    private auditPort: AuditPort,
    private sessionPort: SessionPort,
  ) {}

  async execute(request: CreateDailyClosingRequest, sessionRequest?: Request) {
    // 1. Authenticate
    const user = sessionRequest
      ? await this.sessionPort.getSessionUser(sessionRequest)
      : null
    if (!user) {
      throw new ValidationError('No autenticado')
    }

    // 2. Validate
    if (!request.workshopId) {
      throw new ValidationError('El taller es requerido')
    }
    if (!request.date) {
      throw new ValidationError('La fecha es requerida')
    }

    const closingDate = new Date(request.date)
    if (isNaN(closingDate.getTime())) {
      throw new ValidationError('Fecha inválida')
    }

    // 3. Check if an open closing already exists for this user/workshop/date
    const existing = await this.dailyClosingRepository.findByWorkshopAndUserAndDate(
      request.workshopId,
      user.id,
      closingDate,
    )
    if (existing) {
      throw new ValidationError('Ya existe un cierre diario para esta fecha')
    }

    // 4. Calculate totals from sales/repairs/expenses for that day
    const startOfDay = new Date(closingDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(closingDate)
    endOfDay.setHours(23, 59, 59, 999)

    // Get sales for the day
    const sales = await this.saleRepository.findByDateRange(
      startOfDay,
      endOfDay,
      request.workshopId,
    )
    const userSales = sales.filter((s) => {
      const salePlain = s.toPlainObject()
      return salePlain.userId === user.id && salePlain.status === 'completed'
    })
    const salesCount = userSales.length
    const salesTotal = userSales.reduce((sum, s) => sum + s.toPlainObject().total, 0)

    // Get repairs for the day
    const repairs = await this.repairRepository.findByStatus('delivered', request.workshopId)
    const userRepairs = repairs.filter((r) => {
      const repairPlain = r.toPlainObject()
      return repairPlain.userId === user.id &&
        repairPlain.deliveredAt &&
        new Date(repairPlain.deliveredAt) >= startOfDay &&
        new Date(repairPlain.deliveredAt) <= endOfDay
    })
    const repairsCount = userRepairs.length
    const repairsTotal = userRepairs.reduce((sum, r) => sum + r.toPlainObject().totalCost, 0)

    // Get expenses for the day
    const expenses = await this.expenseRepository.findByDateRange(
      startOfDay,
      endOfDay,
      request.workshopId,
    )
    const userExpenses = expenses.filter((e) => e.toPlainObject().userId === user.id)
    const expensesTotal = userExpenses.reduce((sum, e) => sum + e.toPlainObject().amount, 0)

    const totalIncome = salesTotal + repairsTotal
    const netTotal = totalIncome - expensesTotal

    // 5. Build daily closing data
    const dailyClosingData = {
      workshopId: request.workshopId,
      userId: user.id,
      userName: user.name,
      date: closingDate,
      salesCount,
      salesTotal,
      repairsCount,
      repairsTotal,
      expensesTotal,
      totalIncome,
      netTotal,
      notes: request.notes ?? null,
      status: 'open' as const,
      closedAt: null as Date | null,
    }

    // 6. Persist
    const savedDailyClosing = await this.dailyClosingRepository.create(
      dailyClosingData as unknown as Omit<DailyClosing, 'id' | 'createdAt' | 'updatedAt'>,
    )

    // 7. Log audit trail
    await this.auditPort.log({
      userId: user.id,
      userName: user.name,
      action: 'CREATE',
      entity: 'daily_closing',
      entityId: savedDailyClosing.id,
      details: `Cierre diario creado para ${closingDate.toISOString().split('T')[0]}`,
    })

    // 8. Return result
    return savedDailyClosing
  }
}
