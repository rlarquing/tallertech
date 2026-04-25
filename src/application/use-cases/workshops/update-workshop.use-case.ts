// ============================================================
// Update Workshop Use Case
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { WorkshopRepository } from '@/domain/repositories'
import type { AuditPort, SessionPort } from '@/application/ports'
import type { UpdateWorkshopRequest } from '@/application/dtos'
import { EntityNotFoundError, ValidationError, AuthorizationError } from '@/domain/errors'

export class UpdateWorkshopUseCase {
  constructor(
    private workshopRepository: WorkshopRepository,
    private auditPort: AuditPort,
    private sessionPort: SessionPort,
  ) {}

  async execute(request: UpdateWorkshopRequest, sessionRequest?: Request) {
    // 1. Authenticate
    const user = sessionRequest
      ? await this.sessionPort.getSessionUser(sessionRequest)
      : null
    if (!user) {
      throw new ValidationError('No autenticado')
    }

    // 2. Find workshop
    const workshop = await this.workshopRepository.findById(request.id)
    if (!workshop) {
      throw new EntityNotFoundError('Taller', request.id)
    }

    // 3. Check permission (owner or admin)
    const role = await this.workshopRepository.getMemberRole(request.id, user.id)
    if (!role || role === 'employee') {
      throw new AuthorizationError('Solo el dueño o administrador puede actualizar el taller')
    }

    // 4. Update details
    workshop.updateDetails({
      name: request.name,
      description: request.description,
      address: request.address,
      phone: request.phone,
      email: request.email,
      currency: request.currency,
      timezone: request.timezone,
    })

    if (request.active === false) workshop.deactivate()
    if (request.active === true) workshop.activate()

    // 5. Persist
    const updated = await this.workshopRepository.update(request.id, workshop)

    // 6. Log audit
    await this.auditPort.log({
      userId: user.id,
      userName: user.name,
      action: 'UPDATE',
      entity: 'workshop',
      entityId: request.id,
      details: `Taller actualizado: ${workshop.name}`,
    })

    return updated
  }
}
