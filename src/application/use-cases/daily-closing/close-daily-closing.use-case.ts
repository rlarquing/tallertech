// ============================================================
// Close Daily Closing Use Case
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { DailyClosingRepository, SaleRepository, RepairRepository, ExpenseRepository } from '@/domain/repositories'
import type { AuditPort, SessionPort } from '@/application/ports'
import type { CloseDailyClosingRequest } from '@/application/dtos'
import { ValidationError, EntityNotFoundError } from '@/domain/errors'

export class CloseDailyClosingUseCase {
  constructor(
    private dailyClosingRepository: DailyClosingRepository,
    private saleRepository: SaleRepository,
    private repairRepository: RepairRepository,
    private expenseRepository: ExpenseRepository,
    private auditPort: AuditPort,
    private sessionPort: SessionPort,
  ) {}

  async execute(request: CloseDailyClosingRequest, sessionRequest?: Request) {
    // 1. Authenticate
    const user = sessionRequest
      ? await this.sessionPort.getSessionUser(sessionRequest)
      : null
    if (!user) {
      throw new ValidationError('No autenticado')
    }

    // 2. Find the daily closing
    const dailyClosing = await this.dailyClosingRepository.findById(request.id)
    if (!dailyClosing) {
      throw new EntityNotFoundError('Cierre diario', request.id)
    }

    // 3. Verify ownership (only the user who created it can close it, or owner/admin)
    const plain = dailyClosing.toPlainObject()
    if (plain.userId !== user.id && user.role !== 'owner' && user.role !== 'admin') {
      throw new ValidationError('No tiene permisos para cerrar este cierre diario')
    }

    // 4. Recalculate totals from sales/repairs/expenses
    const closingDate = plain.date
    const startOfDay = new Date(closingDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(closingDate)
    endOfDay.setHours(23, 59, 59, 999)

    // Get sales for the day
    const sales = await this.saleRepository.findByDateRange(
      startOfDay,
      endOfDay,
      plain.workshopId,
    )
    const userSales = sales.filter((s) => {
      const salePlain = s.toPlainObject()
      return salePlain.userId === plain.userId && salePlain.status === 'completed'
    })
    const salesCount = userSales.length
    const salesTotal = userSales.reduce((sum, s) => sum + s.toPlainObject().total, 0)

    // Get repairs for the day
    const repairs = await this.repairRepository.findByStatus('delivered', plain.workshopId)
    const userRepairs = repairs.filter((r) => {
      const repairPlain = r.toPlainObject()
      return repairPlain.userId === plain.userId &&
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
      plain.workshopId,
    )
    const userExpenses = expenses.filter((e) => e.toPlainObject().userId === plain.userId)
    const expensesTotal = userExpenses.reduce((sum, e) => sum + e.toPlainObject().amount, 0)

    // 5. Update totals and close
    dailyClosing.updateTotals({
      salesCount,
      salesTotal,
      repairsCount,
      repairsTotal,
      expensesTotal,
    })
    dailyClosing.close(request.notes)

    // 6. Persist
    const closedDailyClosing = await this.dailyClosingRepository.update(
      request.id,
      dailyClosing as never,
    )

    // 7. Log audit trail
    await this.auditPort.log({
      userId: user.id,
      userName: user.name,
      action: 'STATUS_CHANGE',
      entity: 'daily_closing',
      entityId: request.id,
      details: `Cierre diario cerrado para ${new Date(closingDate).toISOString().split('T')[0]}. Neto: ${plain.netTotal}`,
    })

    // 8. Return result
    return closedDailyClosing
  }
}
