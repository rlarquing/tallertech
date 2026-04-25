// ============================================================
// Update Supplier Use Case
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { SupplierRepository } from '@/domain/repositories'
import type { AuditPort, SessionPort } from '@/application/ports'
import type { UpdateSupplierRequest } from '@/application/dtos'
import { EntityNotFoundError, ValidationError } from '@/domain/errors'

export class UpdateSupplierUseCase {
  constructor(
    private supplierRepository: SupplierRepository,
    private auditPort: AuditPort,
    private sessionPort: SessionPort,
  ) {}

  async execute(request: UpdateSupplierRequest, sessionRequest?: Request) {
    // 1. Authenticate
    const user = sessionRequest
      ? await this.sessionPort.getSessionUser(sessionRequest)
      : null
    if (!user) {
      throw new ValidationError('No autenticado')
    }

    // 2. Validate
    if (!request.id) {
      throw new ValidationError('ID del proveedor es requerido')
    }

    // 3. Find existing supplier
    const existing = await this.supplierRepository.findById(request.id)
    if (!existing) {
      throw new EntityNotFoundError('Proveedor', request.id)
    }

    // 4. Build update data
    const updateData: Record<string, unknown> = {}
    if (request.name !== undefined) updateData.name = request.name
    if (request.phone !== undefined) updateData.phone = request.phone
    if (request.email !== undefined) updateData.email = request.email
    if (request.address !== undefined) updateData.address = request.address
    if (request.notes !== undefined) updateData.notes = request.notes
    if (request.active !== undefined) updateData.active = request.active

    // 5. Persist update
    const updated = await this.supplierRepository.update(request.id, updateData)

    // 6. Log audit trail
    await this.auditPort.log({
      userId: user.id,
      userName: user.name,
      action: 'UPDATE',
      entity: 'supplier',
      entityId: request.id,
      details: `Proveedor actualizado: ${request.name || existing.name}`,
    })

    // 7. Return result
    return updated
  }
}
