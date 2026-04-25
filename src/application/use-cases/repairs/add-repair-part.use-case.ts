// ============================================================
// Add Repair Part Use Case - Add part to repair, deduct stock
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { RepairRepository, ProductRepository } from '@/domain/repositories'
import type { AuditPort, SessionPort } from '@/application/ports'
import type { AddRepairPartRequest } from '@/application/dtos'
import type { RepairPart } from '@/domain/entities'
import { EntityNotFoundError, ValidationError, InsufficientStockError } from '@/domain/errors'

export class AddRepairPartUseCase {
  constructor(
    private repairRepository: RepairRepository,
    private productRepository: ProductRepository,
    private auditPort: AuditPort,
    private sessionPort: SessionPort,
  ) {}

  async execute(
    repairId: string,
    request: AddRepairPartRequest,
    sessionRequest?: Request,
  ) {
    // 1. Authenticate
    const user = sessionRequest
      ? await this.sessionPort.getSessionUser(sessionRequest)
      : null
    if (!user) {
      throw new ValidationError('No autenticado')
    }

    // 2. Validate
    if (!repairId) {
      throw new ValidationError('ID de la reparación es requerido')
    }
    if (!request.name) {
      throw new ValidationError('El nombre de la parte es requerido')
    }

    // 3. Find existing repair
    const existing = await this.repairRepository.findById(repairId)
    if (!existing) {
      throw new EntityNotFoundError('Reparación', repairId)
    }

    // 4. If productId exists, validate stock and deduct
    if (request.productId) {
      const product = await this.productRepository.findById(request.productId)
      if (!product) {
        throw new EntityNotFoundError('Producto', request.productId)
      }

      const quantity = request.quantity || 1
      if (product.type !== 'service' && product.quantity < quantity) {
        throw new InsufficientStockError(product.name, quantity, product.quantity)
      }

      // Deduct stock
      await this.productRepository.adjustStock(
        request.productId,
        quantity,
        'out',
        `Reparación ${existing.code}`,
        user.id,
        user.name,
        existing.code,
      )
    }

    // 5. Add part to repair
    const partData = {
      productId: request.productId || null,
      name: request.name,
      quantity: request.quantity || 1,
      unitPrice: request.unitPrice || 0,
    }
    const part = await this.repairRepository.addPart(
      repairId,
      partData as unknown as Omit<RepairPart, 'id' | 'repairOrderId'>,
    )

    // 6. Log audit trail
    await this.auditPort.log({
      userId: user.id,
      userName: user.name,
      action: 'UPDATE',
      entity: 'repair',
      entityId: repairId,
      details: `Parte agregada a reparación ${existing.code}: ${request.name}`,
    })

    // 7. Return result
    return part
  }
}
