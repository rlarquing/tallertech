import { DomainError } from '../errors'

/**
 * Valid stock movement types
 */
export const STOCK_MOVEMENT_TYPES = ['in', 'out', 'adjustment', 'return'] as const
export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number]

/**
 * StockMovement Entity
 * Represents a stock movement record (inventory tracking).
 */
export class StockMovement {
  private constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly type: StockMovementType,
    public readonly quantity: number,
    public reason: string | null,
    public reference: string | null,
    public readonly userId: string,
    public readonly userName: string,
    public readonly createdAt: Date,
  ) {}

  static create(params: {
    id: string
    productId: string
    type: string
    quantity: number
    reason?: string | null
    reference?: string | null
    userId: string
    userName: string
    createdAt?: Date
  }): StockMovement {
    // Validate type
    if (!STOCK_MOVEMENT_TYPES.includes(params.type as StockMovementType)) {
      throw new DomainError(
        `Tipo de movimiento de stock inválido: ${params.type}. Válidos: ${STOCK_MOVEMENT_TYPES.join(', ')}`,
        'INVALID_STOCK_MOVEMENT_TYPE',
      )
    }

    // Validate quantity
    if (params.quantity <= 0) {
      throw new DomainError(
        'La cantidad del movimiento debe ser positiva',
        'INVALID_STOCK_MOVEMENT_QUANTITY',
      )
    }

    return new StockMovement(
      params.id,
      params.productId,
      params.type as StockMovementType,
      params.quantity,
      params.reason ?? null,
      params.reference ?? null,
      params.userId,
      params.userName,
      params.createdAt || new Date(),
    )
  }

  /** Check if this is a stock-in movement */
  isIn(): boolean {
    return this.type === 'in'
  }

  /** Check if this is a stock-out movement */
  isOut(): boolean {
    return this.type === 'out'
  }

  /** Check if this is an adjustment */
  isAdjustment(): boolean {
    return this.type === 'adjustment'
  }

  /** Check if this is a return */
  isReturn(): boolean {
    return this.type === 'return'
  }

  /** Get the signed quantity (negative for out movements) */
  getSignedQuantity(): number {
    return this.type === 'out' ? -this.quantity : this.quantity
  }

  /** Serialize to a plain object matching the original interface shape */
  toPlainObject() {
    return {
      id: this.id,
      productId: this.productId,
      type: this.type,
      quantity: this.quantity,
      reason: this.reason,
      reference: this.reference,
      userId: this.userId,
      userName: this.userName,
      createdAt: this.createdAt,
    }
  }
}
