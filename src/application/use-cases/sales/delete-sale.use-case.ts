// ============================================================
// Delete Sale Use Case
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { SaleRepository } from '@/domain/repositories'
import type { AuditPort, SessionPort } from '@/application/ports'
import { EntityNotFoundError, ValidationError } from '@/domain/errors'

export class DeleteSaleUseCase {
  constructor(
    private saleRepository: SaleRepository,
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

    // 2. Find existing sale
    const existing = await this.saleRepository.findById(id)
    if (!existing) {
      throw new EntityNotFoundError('Venta', id)
    }

    // 3. Delete sale
    await this.saleRepository.delete(id)

    // 4. Log audit trail
    await this.auditPort.log({
      userId: user.id,
      userName: user.name,
      action: 'DELETE',
      entity: 'sale',
      entityId: id,
      details: `Venta eliminada: ${existing.code}`,
    })

    // 5. Return result
    return { success: true, message: 'Venta eliminada' }
  }
}
