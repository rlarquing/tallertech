// ============================================================
// Sale Mapper - Prisma <-> Domain entity conversion
// Clean Architecture: Infrastructure Layer - Persistence
// ============================================================

import { Sale, SaleItem } from '@/domain/entities'
import { SaleItemMapper } from './sale-item.mapper'

export class SaleMapper {
  /**
   * Convert a Prisma Sale record to a Domain Sale entity
   * Supports both with and without included items/customer
   */
  static toDomain(prismaSale: {
    id: string
    code: string
    customerId: string | null
    userId: string
    userName: string
    subtotal: number
    discount: number
    tax: number
    total: number
    paymentMethod: string
    status: string
    notes: string | null
    createdAt: Date
    updatedAt: Date
    items?: Array<{
      id: string
      saleId: string
      productId: string | null
      name: string
      quantity: number
      unitPrice: number
      discount: number
      total: number
      type: string
    }>
    customer?: { name: string } | null
  }): Sale {
    const items: SaleItem[] = prismaSale.items
      ? prismaSale.items.map((item) => SaleItemMapper.toDomain(item))
      : []

    return Sale.create({
      id: prismaSale.id,
      code: prismaSale.code,
      customerId: prismaSale.customerId,
      userId: prismaSale.userId,
      userName: prismaSale.userName,
      subtotal: prismaSale.subtotal,
      discount: prismaSale.discount,
      tax: prismaSale.tax,
      total: prismaSale.total,
      paymentMethod: prismaSale.paymentMethod as 'efectivo' | 'transferencia' | 'mixto',
      status: prismaSale.status as 'completed' | 'cancelled' | 'pending',
      notes: prismaSale.notes,
      createdAt: prismaSale.createdAt,
      updatedAt: prismaSale.updatedAt,
      items,
      customer: prismaSale.customer ?? null,
    })
  }

  /**
   * Convert a Domain Sale entity to a Prisma-compatible data object (without items)
   */
  static toPrisma(sale: Sale): {
    id: string
    code: string
    customerId: string | null
    userId: string
    userName: string
    subtotal: number
    discount: number
    tax: number
    total: number
    paymentMethod: string
    status: string
    notes: string | null
    createdAt: Date
    updatedAt: Date
  } {
    const plain = sale.toPlainObject()
    return {
      id: plain.id,
      code: plain.code,
      customerId: plain.customerId,
      userId: plain.userId,
      userName: plain.userName,
      subtotal: plain.subtotal,
      discount: plain.discount,
      tax: plain.tax,
      total: plain.total,
      paymentMethod: plain.paymentMethod,
      status: plain.status,
      notes: plain.notes,
      createdAt: plain.createdAt,
      updatedAt: plain.updatedAt,
    }
  }
}
