// ============================================================
// Delete Expense Use Case
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { ExpenseRepository } from '@/domain/repositories'
import type { AuditPort, SessionPort } from '@/application/ports'
import { EntityNotFoundError, ValidationError } from '@/domain/errors'

export class DeleteExpenseUseCase {
  constructor(
    private expenseRepository: ExpenseRepository,
    private auditPort: AuditPort,
    private sessionPort: SessionPort,
  ) {}

  async execute(id: string, sessionRequest?: Request) {
    // 1. Authenticate
    const user = sessionRequest
      ? await this.sessionPort.getSessionUser(sessionRequest)
      : null
    if (!user) {
      throw new ValidationError('No autenticado')
    }

    // 2. Find existing expense
    const existing = await this.expenseRepository.findById(id)
    if (!existing) {
      throw new EntityNotFoundError('Gasto', id)
    }

    // 3. Delete expense
    await this.expenseRepository.delete(id)

    // 4. Log audit trail
    await this.auditPort.log({
      userId: user.id,
      userName: user.name,
      action: 'DELETE',
      entity: 'expense',
      entityId: id,
      details: `Gasto eliminado: ${existing.description}`,
    })

    // 5. Return result
    return { success: true, message: 'Gasto eliminado' }
  }
}
