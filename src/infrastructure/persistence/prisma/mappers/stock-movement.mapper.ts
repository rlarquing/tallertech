// ============================================================
// StockMovement Mapper - Prisma <-> Domain entity conversion
// Clean Architecture: Infrastructure Layer - Persistence
// ============================================================

import { StockMovement } from '@/domain/entities'

export class StockMovementMapper {
  /**
   * Convert a Prisma StockMovement record to a Domain StockMovement entity
   */
  static toDomain(prismaMovement: {
    id: string
    productId: string
    type: string
    quantity: number
    reason: string | null
    reference: string | null
    userId: string
    userName: string
    createdAt: Date
  }): StockMovement {
    return StockMovement.create({
      id: prismaMovement.id,
      productId: prismaMovement.productId,
      type: prismaMovement.type,
      quantity: prismaMovement.quantity,
      reason: prismaMovement.reason,
      reference: prismaMovement.reference,
      userId: prismaMovement.userId,
      userName: prismaMovement.userName,
      createdAt: prismaMovement.createdAt,
    })
  }

  /**
   * Convert a Domain StockMovement entity to a Prisma-compatible data object
   */
  static toPrisma(movement: StockMovement): {
    id: string
    productId: string
    type: string
    quantity: number
    reason: string | null
    reference: string | null
    userId: string
    userName: string
    createdAt: Date
  } {
    const plain = movement.toPlainObject()
    return {
      id: plain.id,
      productId: plain.productId,
      type: plain.type,
      quantity: plain.quantity,
      reason: plain.reason,
      reference: plain.reference,
      userId: plain.userId,
      userName: plain.userName,
      createdAt: plain.createdAt,
    }
  }
}
