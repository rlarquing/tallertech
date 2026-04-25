// ============================================================
// Update Product Use Case
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { ProductRepository } from '@/domain/repositories'
import type { AuditPort, SessionPort } from '@/application/ports'
import type { UpdateProductRequest } from '@/application/dtos'
import { EntityNotFoundError, ValidationError, DuplicateSkuError } from '@/domain/errors'

export class UpdateProductUseCase {
  constructor(
    private productRepository: ProductRepository,
    private auditPort: AuditPort,
    private sessionPort: SessionPort,
  ) {}

  async execute(request: UpdateProductRequest, sessionRequest?: Request) {
    // 1. Authenticate
    const user = sessionRequest
      ? await this.sessionPort.getSessionUser(sessionRequest)
      : null
    if (!user) {
      throw new ValidationError('No autenticado')
    }

    // 2. Validate
    if (!request.id) {
      throw new ValidationError('ID del producto es requerido')
    }

    // 3. Find existing product
    const existing = await this.productRepository.findById(request.id)
    if (!existing) {
      throw new EntityNotFoundError('Producto', request.id)
    }

    // 4. Check SKU uniqueness if changing SKU
    if (request.sku) {
      const productWithSku = await this.productRepository.findBySku(request.sku)
      if (productWithSku && productWithSku.id !== request.id) {
        throw new DuplicateSkuError(request.sku)
      }
    }

    // 5. Build update data
    const updateData: Record<string, unknown> = {}
    if (request.name !== undefined) updateData.name = request.name
    if (request.sku !== undefined) updateData.sku = request.sku
    if (request.description !== undefined) updateData.description = request.description
    if (request.categoryId !== undefined) updateData.categoryId = request.categoryId
    if (request.supplierId !== undefined) updateData.supplierId = request.supplierId
    if (request.costPrice !== undefined) updateData.costPrice = request.costPrice
    if (request.salePrice !== undefined) updateData.salePrice = request.salePrice
    if (request.quantity !== undefined) updateData.quantity = request.quantity
    if (request.minStock !== undefined) updateData.minStock = request.minStock
    if (request.unit !== undefined) updateData.unit = request.unit
    if (request.type !== undefined) updateData.type = request.type
    if (request.brand !== undefined) updateData.brand = request.brand
    if (request.model !== undefined) updateData.model = request.model
    if (request.location !== undefined) updateData.location = request.location

    // 6. Persist update
    const updated = await this.productRepository.update(request.id, updateData)

    // 7. Log audit trail
    await this.auditPort.log({
      userId: user.id,
      userName: user.name,
      action: 'UPDATE',
      entity: 'product',
      entityId: request.id,
      details: `Producto actualizado: ${request.name || existing.name}`,
    })

    // 8. Return result
    return updated
  }
}
