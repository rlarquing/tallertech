import { Money } from '../value-objects'

/**
 * SaleItem Entity
 * Represents a line item in a sale.
 */
export class SaleItem {
  private constructor(
    public readonly id: string,
    public readonly saleId: string,
    public readonly productId: string | null,
    public name: string,
    private _quantity: number,
    private _unitPrice: Money,
    private _discount: Money,
    private _total: Money,
    public type: 'product' | 'service' | 'part',
  ) {}

  static create(params: {
    id: string
    saleId: string
    productId?: string | null
    name: string
    quantity?: number
    unitPrice?: number
    discount?: number
    total?: number
    type?: 'product' | 'service' | 'part'
  }): SaleItem {
    const quantity = params.quantity ?? 1
    const unitPrice = Money.from(params.unitPrice ?? 0)
    const discount = Money.from(params.discount ?? 0)

    // Calculate total if not provided: (unitPrice * quantity) - discount
    const total =
      params.total !== undefined
        ? Money.from(params.total)
        : unitPrice.multiply(quantity).subtract(discount)

    return new SaleItem(
      params.id,
      params.saleId,
      params.productId ?? null,
      params.name,
      quantity,
      unitPrice,
      discount,
      total,
      params.type || 'product',
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

  /** Get the discount as a number */
  get discount(): number {
    return this._discount.amount
  }

  /** Get the line total as a number */
  get total(): number {
    return this._total.amount
  }

  /** Calculate the total for this line item */
  calculateTotal(): Money {
    return this._unitPrice.multiply(this._quantity).subtract(this._discount)
  }

  /** Get the line total (alias for calculateTotal) */
  getLineTotal(): Money {
    return this.calculateTotal()
  }

  /** Recalculate the total based on current values */
  recalculate(): void {
    this._total = this.calculateTotal()
  }

  /** Serialize to a plain object matching the original interface shape */
  toPlainObject() {
    return {
      id: this.id,
      saleId: this.saleId,
      productId: this.productId,
      name: this.name,
      quantity: this.quantity,
      unitPrice: this.unitPrice,
      discount: this.discount,
      total: this.total,
      type: this.type,
    }
  }
}
