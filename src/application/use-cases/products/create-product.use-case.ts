// ============================================================
// Create Product Use Case
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { ProductRepository } from '@/domain/repositories'
import type { AuditPort, SessionPort } from '@/application/ports'
import type { CreateProductRequest } from '@/application/dtos'
import { DuplicateSkuError, ValidationError } from '@/domain/errors'

export class CreateProductUseCase {
  constructor(
    private productRepository: ProductRepository,
    private auditPort: AuditPort,
    private sessionPort: SessionPort,
  ) {}

  async execute(request: CreateProductRequest, sessionRequest?: Request) {
    // 1. Authenticate
    const user = sessionRequest
      ? await this.sessionPort.getSessionUser(sessionRequest)
      : null
    if (!user) {
      throw new ValidationError('No autenticado')
    }

    // 2. Validate business rules
    if (!request.name) {
      throw new ValidationError('El nombre del producto es requerido')
    }

    // 3. Check SKU uniqueness
    if (request.sku) {
      const existingProduct = await this.productRepository.findBySku(request.sku)
      if (existingProduct) {
        throw new DuplicateSkuError(request.sku)
      }
    }

    // 4. Build product data for persistence
    const productData = {
      name: request.name,
      sku: request.sku ?? null,
      description: request.description ?? null,
      categoryId: request.categoryId ?? null,
      supplierId: request.supplierId ?? null,
      costPrice: request.costPrice ?? 0,
      salePrice: request.salePrice ?? 0,
      quantity: request.quantity ?? 0,
      minStock: request.minStock ?? 5,
      unit: request.unit || 'unidad',
      type: (request.type || 'product') as 'product' | 'service' | 'part',
      brand: request.brand ?? null,
      model: request.model ?? null,
      location: request.location ?? null,
    }

    // 5. Persist
    const savedProduct = await this.productRepository.create(
      productData as unknown as Omit<
        import('@/domain/entities').Product,
        'id' | 'createdAt' | 'updatedAt'
      >,
    )

    // 6. Create initial stock movement if quantity > 0
    if (request.quantity && request.quantity > 0) {
      await this.productRepository.adjustStock(
        savedProduct.id,
        request.quantity,
        'in',
        'Stock inicial',
        user.id,
        user.name,
      )
    }

    // 7. Log audit trail
    await this.auditPort.log({
      userId: user.id,
      userName: user.name,
      action: 'CREATE',
      entity: 'product',
      entityId: savedProduct.id,
      details: `Producto creado: ${request.name}`,
    })

    // 8. Return result
    return savedProduct
  }
}
