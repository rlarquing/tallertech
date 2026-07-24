// ============================================================
// Add Workshop Member Use Case
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { AuthRepository, WorkshopRepository } from '@/domain/repositories'
import type { AuditPort, SessionPort } from '@/application/ports'
import type { AddWorkshopMemberRequest } from '@/application/dtos'
import { AuthenticationError, EntityNotFoundError, ValidationError, AuthorizationError } from '@/domain/errors'

export class AddWorkshopMemberUseCase {
  constructor(
    private workshopRepository: WorkshopRepository,
    private authRepository: AuthRepository,
    private auditPort: AuditPort,
    private sessionPort: SessionPort,
  ) {}

  async execute(request: AddWorkshopMemberRequest, sessionRequest?: Request) {
    // 1. Authenticate
    const user = sessionRequest
      ? await this.sessionPort.getSessionUser(sessionRequest)
      : null
    if (!user) {
      throw new AuthenticationError('No autenticado')
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

    // 4. Resolve userId from email if not provided directly
    let userId = request.userId
    if (!userId) {
      if (!request.email) {
        throw new ValidationError('userId o email son requeridos')
      }
      const foundUser = await this.authRepository.findByEmail(request.email)
      if (!foundUser) {
        throw new EntityNotFoundError('Usuario', request.email)
      }
      userId = foundUser.id
    }

    // 5. Check if already a member
    const existingRole = await this.workshopRepository.getMemberRole(request.workshopId, userId)
    if (existingRole) {
      throw new ValidationError('El usuario ya es miembro de este taller')
    }

    // 6. Add member
    const member = await this.workshopRepository.addMember(
      request.workshopId,
      userId,
      request.role,
    )

    // 7. Log audit
    await this.auditPort.log({
      userId: user.id,
      userName: user.name,
      action: 'CREATE',
      entity: 'workshop',
      entityId: request.workshopId,
      details: `Miembro agregado: ${userId} con rol ${request.role}`,
    })

    return member
  }
}
