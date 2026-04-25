// ============================================================
// Delete Workshop Use Case (Deactivate)
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { WorkshopRepository } from '@/domain/repositories'
import type { AuditPort, SessionPort } from '@/application/ports'
import { EntityNotFoundError, ValidationError, AuthorizationError } from '@/domain/errors'

export class DeleteWorkshopUseCase {
  constructor(
    private workshopRepository: WorkshopRepository,
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

    // 2. Find workshop
    const workshop = await this.workshopRepository.findById(id)
    if (!workshop) {
      throw new EntityNotFoundError('Taller', id)
    }

    // 3. Check permission (owner only)
    const role = await this.workshopRepository.getMemberRole(id, user.id)
    if (role !== 'owner') {
      throw new AuthorizationError('Solo el dueño puede desactivar el taller')
    }

    // 4. Deactivate
    workshop.deactivate()
    await this.workshopRepository.update(id, workshop)

    // 5. Log audit
    await this.auditPort.log({
      userId: user.id,
      userName: user.name,
      action: 'DELETE',
      entity: 'workshop',
      entityId: id,
      details: `Taller desactivado: ${workshop.name}`,
    })
  }
}
