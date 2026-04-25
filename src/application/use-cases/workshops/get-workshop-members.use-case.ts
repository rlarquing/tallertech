// ============================================================
// Get Workshop Members Use Case
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { WorkshopRepository } from '@/domain/repositories'
import type { SessionPort } from '@/application/ports'
import { EntityNotFoundError, ValidationError, AuthorizationError } from '@/domain/errors'

export class GetWorkshopMembersUseCase {
  constructor(
    private workshopRepository: WorkshopRepository,
    private sessionPort: SessionPort,
  ) {}

  async execute(workshopId: string, sessionRequest?: Request) {
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

    // 3. Check permission (must be a member)
    const role = await this.workshopRepository.getMemberRole(workshopId, user.id)
    if (!role) {
      throw new AuthorizationError('No tienes acceso a este taller')
    }

    // 4. Get members
    return this.workshopRepository.findMembers(workshopId)
  }
}
