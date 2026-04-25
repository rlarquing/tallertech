// ============================================================
// Delete Repair Use Case
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { RepairRepository } from '@/domain/repositories'
import type { AuditPort, SessionPort } from '@/application/ports'
import { EntityNotFoundError, ValidationError } from '@/domain/errors'

export class DeleteRepairUseCase {
  constructor(
    private repairRepository: RepairRepository,
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

    // 2. Find existing repair
    const existing = await this.repairRepository.findById(id)
    if (!existing) {
      throw new EntityNotFoundError('Reparación', id)
    }

    // 3. Delete repair
    await this.repairRepository.delete(id)

    // 4. Log audit trail
    await this.auditPort.log({
      userId: user.id,
      userName: user.name,
      action: 'DELETE',
      entity: 'repair',
      entityId: id,
      details: `Reparación eliminada: ${existing.code}`,
    })

    // 5. Return result
    return { success: true, message: 'Reparación eliminada' }
  }
}
