// ============================================================
// RepairPart Mapper - Prisma <-> Domain entity conversion
// Clean Architecture: Infrastructure Layer - Persistence
// ============================================================

import { RepairPart } from '@/domain/entities'

export class RepairPartMapper {
  /**
   * Convert a Prisma RepairPart record to a Domain RepairPart entity
   */
  static toDomain(prismaPart: {
    id: string
    repairOrderId: string
    productId: string | null
    name: string
    quantity: number
    unitPrice: number
    total: number
  }): RepairPart {
    return RepairPart.create({
      id: prismaPart.id,
      repairOrderId: prismaPart.repairOrderId,
      productId: prismaPart.productId,
      name: prismaPart.name,
      quantity: prismaPart.quantity,
      unitPrice: prismaPart.unitPrice,
      total: prismaPart.total,
    })
  }

  /**
   * Convert a Domain RepairPart entity to a Prisma-compatible data object
   */
  static toPrisma(part: RepairPart): {
    id: string
    repairOrderId: string
    productId: string | null
    name: string
    quantity: number
    unitPrice: number
    total: number
  } {
    const plain = part.toPlainObject()
    return {
      id: plain.id,
      repairOrderId: plain.repairOrderId,
      productId: plain.productId,
      name: plain.name,
      quantity: plain.quantity,
      unitPrice: plain.unitPrice,
      total: plain.total,
    }
  }
}
