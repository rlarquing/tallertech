// ============================================================
// Product Mapper - Prisma <-> Domain entity conversion
// Clean Architecture: Infrastructure Layer - Persistence
// ============================================================

import { Product } from '@/domain/entities'

export class ProductMapper {
  /**
   * Convert a Prisma Product record to a Domain Product entity
   */
  static toDomain(prismaProduct: {
    id: string
    name: string
    sku: string | null
    description: string | null
    categoryId: string | null
    supplierId: string | null
    costPrice: number
    salePrice: number
    quantity: number
    minStock: number
    unit: string
    type: string
    brand: string | null
    model: string | null
    location: string | null
    active: boolean
    createdAt: Date
    updatedAt: Date
  }): Product {
    return Product.create({
      id: prismaProduct.id,
      name: prismaProduct.name,
      sku: prismaProduct.sku,
      description: prismaProduct.description,
      categoryId: prismaProduct.categoryId,
      supplierId: prismaProduct.supplierId,
      costPrice: prismaProduct.costPrice,
      salePrice: prismaProduct.salePrice,
      quantity: prismaProduct.quantity,
      minStock: prismaProduct.minStock,
      unit: prismaProduct.unit,
      type: prismaProduct.type as 'product' | 'service' | 'part',
      brand: prismaProduct.brand,
      model: prismaProduct.model,
      location: prismaProduct.location,
      active: prismaProduct.active,
      createdAt: prismaProduct.createdAt,
      updatedAt: prismaProduct.updatedAt,
    })
  }

  /**
   * Convert a Domain Product entity to a Prisma-compatible data object
   */
  static toPrisma(product: Product): {
    id: string
    name: string
    sku: string | null
    description: string | null
    categoryId: string | null
    supplierId: string | null
    costPrice: number
    salePrice: number
    quantity: number
    minStock: number
    unit: string
    type: string
    brand: string | null
    model: string | null
    location: string | null
    active: boolean
    createdAt: Date
    updatedAt: Date
  } {
    const plain = product.toPlainObject()
    return {
      id: plain.id,
      name: plain.name,
      sku: plain.sku,
      description: plain.description,
      categoryId: plain.categoryId,
      supplierId: plain.supplierId,
      costPrice: plain.costPrice,
      salePrice: plain.salePrice,
      quantity: plain.quantity,
      minStock: plain.minStock,
      unit: plain.unit,
      type: plain.type,
      brand: plain.brand,
      model: plain.model,
      location: plain.location,
      active: plain.active,
      createdAt: plain.createdAt,
      updatedAt: plain.updatedAt,
    }
  }
}
