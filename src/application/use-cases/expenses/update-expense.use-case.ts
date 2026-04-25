// ============================================================
// Update Expense Use Case
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { ExpenseRepository } from '@/domain/repositories'
import type { AuditPort, SessionPort } from '@/application/ports'
import type { UpdateExpenseRequest } from '@/application/dtos'
import { EntityNotFoundError, ValidationError } from '@/domain/errors'

export class UpdateExpenseUseCase {
  constructor(
    private expenseRepository: ExpenseRepository,
    private auditPort: AuditPort,
    private sessionPort: SessionPort,
  ) {}

  async execute(request: UpdateExpenseRequest, sessionRequest?: Request) {
    // 1. Authenticate
    const user = sessionRequest
      ? await this.sessionPort.getSessionUser(sessionRequest)
      : null
    if (!user) {
      throw new ValidationError('No autenticado')
    }

    // 2. Validate
    if (!request.id) {
      throw new ValidationError('ID del gasto es requerido')
    }

    // 3. Find existing expense
    const existing = await this.expenseRepository.findById(request.id)
    if (!existing) {
      throw new EntityNotFoundError('Gasto', request.id)
    }

    // 4. Build update data
    const updateData: Record<string, unknown> = {}
    if (request.category !== undefined) updateData.category = request.category
    if (request.description !== undefined) updateData.description = request.description
    if (request.amount !== undefined) {
      if (request.amount <= 0) {
        throw new ValidationError('El monto del gasto debe ser positivo')
      }
      updateData.amount = request.amount
    }
    if (request.date !== undefined) updateData.date = new Date(request.date)
    if (request.notes !== undefined) updateData.notes = request.notes

    // 5. Persist update
    const updated = await this.expenseRepository.update(request.id, updateData)

    // 6. Log audit trail
    await this.auditPort.log({
      userId: user.id,
      userName: user.name,
      action: 'UPDATE',
      entity: 'expense',
      entityId: request.id,
      details: `Gasto actualizado: ${request.description || existing.description}`,
    })

    // 7. Return result
    return updated
  }
}
