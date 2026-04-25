// ============================================================
// Remove Workshop Member Use Case
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { WorkshopRepository } from '@/domain/repositories'
import type { AuditPort, SessionPort } from '@/application/ports'
import { EntityNotFoundError, ValidationError, AuthorizationError } from '@/domain/errors'

export class RemoveWorkshopMemberUseCase {
  constructor(
    private workshopRepository: WorkshopRepository,
    private auditPort: AuditPort,
    private sessionPort: SessionPort,
  ) {}

  async execute(workshopId: string, userId: string, sessionRequest?: Request) {
    // 1. Authenticate
    const user = sessionRequest
      ? await this.sessionPort.getSessionUser(sessionRequest)
      : null
    if (!user) {
      throw new ValidationError('No autenticado')
    }

    // 2. Find workshop
    const workshop = await this.workshopRepository.findById(workshopId)
    if (!workshop) {
      throw new EntityNotFoundError('Taller', workshopId)
    }

    // 3. Check permission (owner only)
    const role = await this.workshopRepository.getMemberRole(workshopId, user.id)
    if (role !== 'owner') {
      throw new AuthorizationError('Solo el dueño puede eliminar miembros')
    }

    // 4. Cannot remove the owner
    const targetRole = await this.workshopRepository.getMemberRole(workshopId, userId)
    if (targetRole === 'owner') {
      throw new ValidationError('No se puede eliminar al dueño del taller')
    }

    // 5. Remove member
    await this.workshopRepository.removeMember(workshopId, userId)

    // 6. Log audit
    await this.auditPort.log({
      userId: user.id,
      userName: user.name,
      action: 'DELETE',
      entity: 'workshop',
      entityId: workshopId,
      details: `Miembro eliminado: ${userId}`,
    })
  }
}
