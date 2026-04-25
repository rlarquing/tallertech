// ============================================================
// Delete Supplier Use Case - Soft delete (deactivate)
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { SupplierRepository } from '@/domain/repositories'
import type { AuditPort, SessionPort } from '@/application/ports'
import { EntityNotFoundError, ValidationError } from '@/domain/errors'

export class DeleteSupplierUseCase {
  constructor(
    private supplierRepository: SupplierRepository,
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

    // 2. Find existing supplier
    const existing = await this.supplierRepository.findById(id)
    if (!existing) {
      throw new EntityNotFoundError('Proveedor', id)
    }

    // 3. Soft delete (deactivate)
    const deactivated = await this.supplierRepository.update(id, { active: false })

    // 4. Log audit trail
    await this.auditPort.log({
      userId: user.id,
      userName: user.name,
      action: 'DELETE',
      entity: 'supplier',
      entityId: id,
      details: `Proveedor desactivado: ${existing.name}`,
    })

    // 5. Return result
    return deactivated
  }
}
