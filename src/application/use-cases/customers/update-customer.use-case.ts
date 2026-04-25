// ============================================================
// Update Customer Use Case
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { CustomerRepository } from '@/domain/repositories'
import type { AuditPort, SessionPort } from '@/application/ports'
import type { UpdateCustomerRequest } from '@/application/dtos'
import { EntityNotFoundError, ValidationError } from '@/domain/errors'

export class UpdateCustomerUseCase {
  constructor(
    private customerRepository: CustomerRepository,
    private auditPort: AuditPort,
    private sessionPort: SessionPort,
  ) {}

  async execute(request: UpdateCustomerRequest, sessionRequest?: Request) {
    // 1. Authenticate
    const user = sessionRequest
      ? await this.sessionPort.getSessionUser(sessionRequest)
      : null
    if (!user) {
      throw new ValidationError('No autenticado')
    }

    // 2. Validate
    if (!request.id) {
      throw new ValidationError('ID del cliente es requerido')
    }

    // 3. Find existing customer
    const existing = await this.customerRepository.findById(request.id)
    if (!existing) {
      throw new EntityNotFoundError('Cliente', request.id)
    }

    // 4. Build update data
    const updateData: Record<string, unknown> = {}
    if (request.name !== undefined) updateData.name = request.name
    if (request.phone !== undefined) updateData.phone = request.phone
    if (request.email !== undefined) updateData.email = request.email
    if (request.address !== undefined) updateData.address = request.address
    if (request.dni !== undefined) updateData.dni = request.dni
    if (request.notes !== undefined) updateData.notes = request.notes

    // 5. Persist update
    const updated = await this.customerRepository.update(request.id, updateData)

    // 6. Log audit trail
    await this.auditPort.log({
      userId: user.id,
      userName: user.name,
      action: 'UPDATE',
      entity: 'customer',
      entityId: request.id,
      details: `Cliente actualizado: ${request.name || existing.name}`,
    })

    // 7. Return result
    return updated
  }
}
