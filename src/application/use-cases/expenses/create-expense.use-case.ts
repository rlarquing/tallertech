// ============================================================
// Create Expense Use Case
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { ExpenseRepository } from '@/domain/repositories'
import type { AuditPort, SessionPort } from '@/application/ports'
import type { CreateExpenseRequest } from '@/application/dtos'
import { ValidationError } from '@/domain/errors'
import type { Expense } from '@/domain/entities'

export class CreateExpenseUseCase {
  constructor(
    private expenseRepository: ExpenseRepository,
    private auditPort: AuditPort,
    private sessionPort: SessionPort,
  ) {}

  async execute(request: CreateExpenseRequest, sessionRequest?: Request) {
    // 1. Authenticate
    const user = sessionRequest
      ? await this.sessionPort.getSessionUser(sessionRequest)
      : null
    if (!user) {
      throw new ValidationError('No autenticado')
    }

    // 2. Validate
    if (!request.description) {
      throw new ValidationError('La descripción del gasto es requerida')
    }
    if (!request.amount || request.amount <= 0) {
      throw new ValidationError('El monto del gasto debe ser positivo')
    }

    // 3. Build expense data for persistence
    const expenseData = {
      category: request.category,
      description: request.description,
      amount: request.amount,
      userId: user.id,
      userName: user.name,
      date: request.date ? new Date(request.date) : new Date(),
      notes: request.notes ?? null,
    }

    // 4. Persist
    const savedExpense = await this.expenseRepository.create(
      expenseData as unknown as Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>,
    )

    // 5. Log audit trail
    await this.auditPort.log({
      userId: user.id,
      userName: user.name,
      action: 'CREATE',
      entity: 'expense',
      entityId: savedExpense.id,
      details: `Gasto creado: ${request.description} - ${request.amount}`,
    })

    // 6. Return result
    return savedExpense
  }
}
