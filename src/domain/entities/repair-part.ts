import { Money } from '../value-objects'

/**
 * RepairPart Entity
 * Represents a part used in a repair order.
 */
export class RepairPart {
  private constructor(
    public readonly id: string,
    public readonly repairOrderId: string,
    public readonly productId: string | null,
    public name: string,
    private _quantity: number,
    private _unitPrice: Money,
    private _total: Money,
  ) {}

  static create(params: {
    id: string
    repairOrderId: string
    productId?: string | null
    name: string
    quantity?: number
    unitPrice?: number
    total?: number
  }): RepairPart {
    const quantity = params.quantity ?? 1
    const unitPrice = Money.from(params.unitPrice ?? 0)

    // Calculate total if not provided
    const total =
      params.total !== undefined
        ? Money.from(params.total)
        : unitPrice.multiply(quantity)

    return new RepairPart(
      params.id,
      params.repairOrderId,
      params.productId ?? null,
      params.name,
      quantity,
      unitPrice,
      total,
    )
  }

  /** Get the quantity */
  get quantity(): number {
    return this._quantity
  }

  /** Get the unit price as a number */
  get unitPrice(): number {
    return this._unitPrice.amount
  }

  /** Get the total as a number */
  get total(): number {
    return this._total.amount
  }

  /** Calculate the total for this part */
  calculateTotal(): Money {
    return this._unitPrice.multiply(this._quantity)
  }

  /** Recalculate the total based on current values */
  recalculate(): void {
    this._total = this.calculateTotal()
  }

  /** Serialize to a plain object matching the original interface shape */
  toPlainObject() {
    return {
      id: this.id,
      repairOrderId: this.repairOrderId,
      productId: this.productId,
      name: this.name,
      quantity: this.quantity,
      unitPrice: this.unitPrice,
      total: this.total,
    }
  }
}
