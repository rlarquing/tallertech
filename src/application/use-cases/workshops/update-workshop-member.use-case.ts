// ============================================================
// Update Workshop Member Role Use Case
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { WorkshopRepository } from '@/domain/repositories'
import type { AuditPort, SessionPort } from '@/application/ports'
import type { UpdateWorkshopMemberRequest } from '@/application/dtos'
import { EntityNotFoundError, ValidationError, AuthorizationError } from '@/domain/errors'

export class UpdateWorkshopMemberUseCase {
  constructor(
    private workshopRepository: WorkshopRepository,
    private auditPort: AuditPort,
    private sessionPort: SessionPort,
  ) {}

  async execute(request: UpdateWorkshopMemberRequest, sessionRequest?: Request) {
    // 1. Authenticate
    const user = sessionRequest
      ? await this.sessionPort.getSessionUser(sessionRequest)
      : null
    if (!user) {
      throw new ValidationError('No autenticado')
    }

    // 2. Find workshop
    const workshop = await this.workshopRepository.findById(request.workshopId)
    if (!workshop) {
      throw new EntityNotFoundError('Taller', request.workshopId)
    }

    // 3. Check permission (owner only)
    const role = await this.workshopRepository.getMemberRole(request.workshopId, user.id)
    if (role !== 'owner') {
      throw new AuthorizationError('Solo el dueño puede cambiar roles')
    }

    // 4. Cannot change own role
    if (request.userId === user.id) {
      throw new ValidationError('No puedes cambiar tu propio rol')
    }

    // 5. Check target is a member
    const targetRole = await this.workshopRepository.getMemberRole(request.workshopId, request.userId)
    if (!targetRole) {
      throw new ValidationError('El usuario no es miembro de este taller')
    }

    // 6. Update role
    await this.workshopRepository.updateMemberRole(
      request.workshopId,
      request.userId,
      request.role,
    )

    // 7. Log audit
    await this.auditPort.log({
      userId: user.id,
      userName: user.name,
      action: 'UPDATE',
      entity: 'workshop',
      entityId: request.workshopId,
      details: `Rol actualizado: ${request.userId} → ${request.role}`,
    })
  }
}
