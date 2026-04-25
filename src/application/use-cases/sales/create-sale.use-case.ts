// ============================================================
// Create Sale Use Case - THE MOST COMPLEX USE CASE
// Generates code, validates items, calculates totals,
// creates sale with items in transaction, deducts stock,
// creates stock movements, logs audit.
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { SaleRepository, ProductRepository } from '@/domain/repositories'
import type { AuditPort, SessionPort, CodeGeneratorPort } from '@/application/ports'
import type { CreateSaleRequest } from '@/application/dtos'
import type { Sale, SaleItem, Product } from '@/domain/entities'
import { ValidationError, InsufficientStockError, EntityNotFoundError } from '@/domain/errors'

export class CreateSaleUseCase {
  constructor(
    private saleRepository: SaleRepository,
    private productRepository: ProductRepository,
    private auditPort: AuditPort,
    private sessionPort: SessionPort,
    private codeGeneratorPort: CodeGeneratorPort,
  ) {}

  async execute(request: CreateSaleRequest, sessionRequest?: Request) {
    // 1. Authenticate
    const user = sessionRequest
      ? await this.sessionPort.getSessionUser(sessionRequest)
      : null
    if (!user) {
      throw new ValidationError('No autenticado')
    }

    // 2. Validate request
    if (!request.items || request.items.length === 0) {
      throw new ValidationError('La venta debe tener al menos un item')
    }

    // 3. Generate sale code
    const code = this.codeGeneratorPort.generateSaleCode()

    // 4. Validate stock for product items and collect product data
    const productData: Map<string, { product: Product; requestedQty: number }> = new Map()
    for (const item of request.items) {
      if (item.productId) {
        const product = await this.productRepository.findById(item.productId)
        if (!product) {
          throw new EntityNotFoundError('Producto', item.productId)
        }
        const requestedQty = item.quantity || 1

        // Check sufficient stock (services don't need stock)
        if (product.type !== 'service' && product.quantity < requestedQty) {
          throw new InsufficientStockError(product.name, requestedQty, product.quantity)
        }

        productData.set(item.productId, { product, requestedQty })
      }
    }

    // 5. Calculate totals from items
    let subtotal = 0
    const saleItems = request.items.map((item) => {
      const quantity = item.quantity || 1
      const unitPrice = item.unitPrice || 0
      const discount = item.discount || 0
      const itemTotal = unitPrice * quantity - discount
      subtotal += itemTotal

      return {
        productId: item.productId || null,
        name: item.name,
        quantity,
        unitPrice,
        discount,
        total: itemTotal,
        type: (item.type || 'product') as 'product' | 'service' | 'part',
      }
    })

    const discountAmount = request.discount || 0
    const taxAmount = request.tax || 0
    const total = subtotal - discountAmount + taxAmount

    // 6. Create sale with items
    const sale = await this.saleRepository.createWithItems(
      {
        code,
        customerId: request.customerId || null,
        userId: user.id,
        userName: user.name,
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        total,
        paymentMethod: request.paymentMethod || 'efectivo',
        status: 'completed',
        notes: request.notes || null,
      } as unknown as Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'items'>,
      saleItems as unknown as Omit<SaleItem, 'id' | 'saleId'>[],
    )

    // 7. Deduct stock for each product item and create stock movements
    for (const item of request.items) {
      if (item.productId) {
        const data = productData.get(item.productId)
        if (data) {
          const qty = item.quantity || 1
          await this.productRepository.adjustStock(
            item.productId,
            qty,
            'out',
            'Venta',
            user.id,
            user.name,
            code,
          )
        }
      }
    }

    // 8. Log audit trail
    await this.auditPort.log({
      userId: user.id,
      userName: user.name,
      action: 'CREATE',
      entity: 'sale',
      entityId: sale.id,
      details: `Venta creada: ${code} - Total: ${total}`,
    })

    // 9. Return result
    return sale
  }
}
