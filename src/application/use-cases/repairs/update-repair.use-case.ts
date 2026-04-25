// ============================================================
// Update Repair Use Case
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { RepairRepository } from '@/domain/repositories'
import type { AuditPort, SessionPort } from '@/application/ports'
import type { UpdateRepairRequest } from '@/application/dtos'
import { EntityNotFoundError, ValidationError, InvalidStateTransitionError } from '@/domain/errors'
import type { RepairOrder } from '@/domain/entities'

export class UpdateRepairUseCase {
  constructor(
    private repairRepository: RepairRepository,
    private auditPort: AuditPort,
    private sessionPort: SessionPort,
  ) {}

  async execute(request: UpdateRepairRequest, sessionRequest?: Request) {
    // 1. Authenticate
    const user = sessionRequest
      ? await this.sessionPort.getSessionUser(sessionRequest)
      : null
    if (!user) {
      throw new ValidationError('No autenticado')
    }

    // 2. Validate
    if (!request.id) {
      throw new ValidationError('ID de la reparación es requerido')
    }

    // 3. Find existing repair
    const existing = await this.repairRepository.findById(request.id)
    if (!existing) {
      throw new EntityNotFoundError('Reparación', request.id)
    }

    // 4. Handle status changes using domain entity's updateStatus
    if (request.status && request.status !== existing.status) {
      try {
        existing.updateStatus(
          request.status as
            | 'received'
            | 'diagnosing'
            | 'waiting_parts'
            | 'repairing'
            | 'ready'
            | 'delivered'
            | 'cancelled',
        )
      } catch (error) {
        if (error instanceof InvalidStateTransitionError) {
          throw error
        }
        throw new InvalidStateTransitionError(existing.status, request.status)
      }
    }

    // 5. Build update data
    const updateData: Record<string, unknown> = {}
    if (request.status !== undefined) updateData.status = request.status
    if (request.device !== undefined) updateData.device = request.device
    if (request.brand !== undefined) updateData.brand = request.brand
    if (request.imei !== undefined) updateData.imei = request.imei
    if (request.issue !== undefined) updateData.issue = request.issue
    if (request.diagnosis !== undefined) updateData.diagnosis = request.diagnosis
    if (request.solution !== undefined) updateData.solution = request.solution
    if (request.priority !== undefined) updateData.priority = request.priority
    if (request.costEstimate !== undefined) updateData.costEstimate = request.costEstimate
    if (request.laborCost !== undefined) updateData.laborCost = request.laborCost
    if (request.estimatedReady !== undefined) {
      updateData.estimatedReady = request.estimatedReady
        ? new Date(request.estimatedReady)
        : null
    }
    if (request.notes !== undefined) updateData.notes = request.notes
    if (request.paid !== undefined) updateData.paid = request.paid

    // 6. Persist update
    const updated = await this.repairRepository.update(request.id, updateData)

    // 7. Log audit trail
    const action =
      request.status && request.status !== existing.status
        ? 'STATUS_CHANGE'
        : 'UPDATE'
    await this.auditPort.log({
      userId: user.id,
      userName: user.name,
      action,
      entity: 'repair',
      entityId: request.id,
      details: `Reparación actualizada: ${existing.code}${
        request.status ? ` → ${request.status}` : ''
      }`,
    })

    // 8. Return result
    return updated
  }
}
