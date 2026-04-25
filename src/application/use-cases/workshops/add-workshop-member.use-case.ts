// ============================================================
// Add Workshop Member Use Case
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { WorkshopRepository } from '@/domain/repositories'
import type { AuditPort, SessionPort } from '@/application/ports'
import type { AddWorkshopMemberRequest } from '@/application/dtos'
import { EntityNotFoundError, ValidationError, AuthorizationError } from '@/domain/errors'

export class AddWorkshopMemberUseCase {
  constructor(
    private workshopRepository: WorkshopRepository,
    private auditPort: AuditPort,
    private sessionPort: SessionPort,
  ) {}

  async execute(request: AddWorkshopMemberRequest, sessionRequest?: Request) {
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

    // 3. Check permission (owner or admin)
    const role = await this.workshopRepository.getMemberRole(request.workshopId, user.id)
    if (!role || role === 'employee') {
      throw new AuthorizationError('Solo el dueño o administrador puede agregar miembros')
    }

    // 4. Check if already a member
    const existingRole = await this.workshopRepository.getMemberRole(request.workshopId, request.userId)
    if (existingRole) {
      throw new ValidationError('El usuario ya es miembro de este taller')
    }

    // 5. Add member
    const member = await this.workshopRepository.addMember(
      request.workshopId,
      request.userId,
      request.role,
    )

    // 6. Log audit
    await this.auditPort.log({
      userId: user.id,
      userName: user.name,
      action: 'CREATE',
      entity: 'workshop',
      entityId: request.workshopId,
      details: `Miembro agregado: ${request.userId} con rol ${request.role}`,
    })

    return member
  }
}
