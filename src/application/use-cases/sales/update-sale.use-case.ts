// ============================================================
// Update Sale Use Case - Update sale (status changes, cancel)
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { SaleRepository } from '@/domain/repositories'
import type { AuditPort, SessionPort } from '@/application/ports'
import type { UpdateProductRequest } from '@/application/dtos'
import { EntityNotFoundError, ValidationError, InvalidStateTransitionError } from '@/domain/errors'

interface UpdateSaleRequest {
  id: string
  status?: string
  discount?: number
  tax?: number
  paymentMethod?: 'efectivo' | 'transferencia' | 'mixto'
  notes?: string | null
}

export class UpdateSaleUseCase {
  constructor(
    private saleRepository: SaleRepository,
    private auditPort: AuditPort,
    private sessionPort: SessionPort,
  ) {}

  async execute(request: UpdateSaleRequest, sessionRequest?: Request) {
    // 1. Authenticate
    const user = sessionRequest
      ? await this.sessionPort.getSessionUser(sessionRequest)
      : null
    if (!user) {
      throw new ValidationError('No autenticado')
    }

    // 2. Validate
    if (!request.id) {
      throw new ValidationError('ID de la venta es requerido')
    }

    // 3. Find existing sale
    const existing = await this.saleRepository.findById(request.id)
    if (!existing) {
      throw new EntityNotFoundError('Venta', request.id)
    }

    // 4. Handle status changes using domain entity
    if (request.status && request.status !== existing.status) {
      if (request.status === 'cancelled') {
        existing.cancel()
      } else if (request.status === 'completed') {
        existing.complete()
      } else {
        throw new InvalidStateTransitionError(existing.status, request.status)
      }
    }

    // 5. Build update data
    const updateData: Record<string, unknown> = {}
    if (request.status !== undefined) updateData.status = request.status
    if (request.discount !== undefined) updateData.discount = request.discount
    if (request.tax !== undefined) updateData.tax = request.tax
    if (request.paymentMethod !== undefined) updateData.paymentMethod = request.paymentMethod
    if (request.notes !== undefined) updateData.notes = request.notes

    // 6. Persist update
    const updated = await this.saleRepository.update(request.id, updateData)

    // 7. Log audit trail
    const action = request.status === 'cancelled' ? 'CANCEL' : 'UPDATE'
    await this.auditPort.log({
      userId: user.id,
      userName: user.name,
      action,
      entity: 'sale',
      entityId: request.id,
      details: `Venta actualizada: ${existing.code}`,
    })

    // 8. Return result
    return updated
  }
}
