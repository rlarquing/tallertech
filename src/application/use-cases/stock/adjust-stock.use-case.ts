// ============================================================
// Adjust Stock Use Case - Adjust stock, create movement, log audit
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { ProductRepository } from '@/domain/repositories'
import type { AuditPort, SessionPort } from '@/application/ports'
import type { AdjustStockRequest } from '@/application/dtos'
import { EntityNotFoundError, ValidationError } from '@/domain/errors'

export class AdjustStockUseCase {
  constructor(
    private productRepository: ProductRepository,
    private auditPort: AuditPort,
    private sessionPort: SessionPort,
  ) {}

  async execute(request: AdjustStockRequest, sessionRequest?: Request) {
    // 1. Authenticate
    const user = sessionRequest
      ? await this.sessionPort.getSessionUser(sessionRequest)
      : null
    if (!user) {
      throw new ValidationError('No autenticado')
    }

    // 2. Validate
    if (!request.productId) {
      throw new ValidationError('ID del producto es requerido')
    }
    if (!request.type) {
      throw new ValidationError('El tipo de ajuste es requerido')
    }
    if (!request.quantity || request.quantity <= 0) {
      throw new ValidationError('La cantidad debe ser positiva')
    }

    // 3. Find product
    const product = await this.productRepository.findById(request.productId)
    if (!product) {
      throw new EntityNotFoundError('Producto', request.productId)
    }

    // 4. Adjust stock
    const updatedProduct = await this.productRepository.adjustStock(
      request.productId,
      request.quantity,
      request.type,
      request.reason || `Ajuste de stock: ${request.type}`,
      user.id,
      user.name,
      request.reference,
    )

    // 5. Log audit trail
    await this.auditPort.log({
      userId: user.id,
      userName: user.name,
      action: 'STOCK_ADJUSTMENT',
      entity: 'product',
      entityId: request.productId,
      details: `Stock ajustado: ${product.name} - ${request.type} ${request.quantity}${request.reason ? ` (${request.reason})` : ''}`,
    })

    // 6. Return result
    return updatedProduct
  }
}
