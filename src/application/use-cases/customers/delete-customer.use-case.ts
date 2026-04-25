// ============================================================
// Delete Customer Use Case - Soft delete (deactivate)
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { CustomerRepository } from '@/domain/repositories'
import type { AuditPort, SessionPort } from '@/application/ports'
import { EntityNotFoundError, ValidationError } from '@/domain/errors'

export class DeleteCustomerUseCase {
  constructor(
    private customerRepository: CustomerRepository,
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

    // 2. Find existing customer
    const existing = await this.customerRepository.findById(id)
    if (!existing) {
      throw new EntityNotFoundError('Cliente', id)
    }

    // 3. Soft delete (deactivate)
    const deactivated = await this.customerRepository.update(id, { active: false })

    // 4. Log audit trail
    await this.auditPort.log({
      userId: user.id,
      userName: user.name,
      action: 'DELETE',
      entity: 'customer',
      entityId: id,
      details: `Cliente desactivado: ${existing.name}`,
    })

    // 5. Return result
    return deactivated
  }
}
