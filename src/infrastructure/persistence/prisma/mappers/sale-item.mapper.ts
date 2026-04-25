// ============================================================
// SaleItem Mapper - Prisma <-> Domain entity conversion
// Clean Architecture: Infrastructure Layer - Persistence
// ============================================================

import { SaleItem } from '@/domain/entities'

export class SaleItemMapper {
  /**
   * Convert a Prisma SaleItem record to a Domain SaleItem entity
   */
  static toDomain(prismaItem: {
    id: string
    saleId: string
    productId: string | null
    name: string
    quantity: number
    unitPrice: number
    discount: number
    total: number
    type: string
  }): SaleItem {
    return SaleItem.create({
      id: prismaItem.id,
      saleId: prismaItem.saleId,
      productId: prismaItem.productId,
      name: prismaItem.name,
      quantity: prismaItem.quantity,
      unitPrice: prismaItem.unitPrice,
      discount: prismaItem.discount,
      total: prismaItem.total,
      type: prismaItem.type as 'product' | 'service' | 'part',
    })
  }

  /**
   * Convert a Domain SaleItem entity to a Prisma-compatible data object
   */
  static toPrisma(item: SaleItem): {
    id: string
    saleId: string
    productId: string | null
    name: string
    quantity: number
    unitPrice: number
    discount: number
    total: number
    type: string
  } {
    const plain = item.toPlainObject()
    return {
      id: plain.id,
      saleId: plain.saleId,
      productId: plain.productId,
      name: plain.name,
      quantity: plain.quantity,
      unitPrice: plain.unitPrice,
      discount: plain.discount,
      total: plain.total,
      type: plain.type,
    }
  }
}
