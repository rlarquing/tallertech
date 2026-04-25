// ============================================================
// Get Workshop Use Case
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { WorkshopRepository } from '@/domain/repositories'
import type { SessionPort } from '@/application/ports'
import { EntityNotFoundError, ValidationError, AuthorizationError } from '@/domain/errors'

export class GetWorkshopUseCase {
  constructor(
    private workshopRepository: WorkshopRepository,
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

    // 2. Find workshop
    const workshop = await this.workshopRepository.findById(id)
    if (!workshop) {
      throw new EntityNotFoundError('Taller', id)
    }

    // 3. Get user's role in this workshop
    const role = await this.workshopRepository.getMemberRole(id, user.id)
    if (!role) {
      throw new AuthorizationError('No tienes acceso a este taller')
    }

    // 4. Return with role
    return {
      ...workshop.toPlainObject(),
      userRole: role as 'owner' | 'admin' | 'employee',
    }
  }
}
