import { Money } from '../value-objects'
import { DomainError, InsufficientStockError } from '../errors'

/**
 * Product Entity
 * Represents an inventory item, service, or part.
 */
export class Product {
  private constructor(
    public readonly id: string,
    public name: string,
    public sku: string | null,
    public description: string | null,
    public categoryId: string | null,
    public supplierId: string | null,
    private _costPrice: Money,
    private _salePrice: Money,
    private _quantity: number,
    private _minStock: number,
    public unit: string,
    public type: 'product' | 'service' | 'part',
    public brand: string | null,
    public model: string | null,
    public location: string | null,
    public active: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(params: {
    id: string
    name: string
    sku?: string | null
    description?: string | null
    categoryId?: string | null
    supplierId?: string | null
    costPrice?: number
    salePrice?: number
    quantity?: number
    minStock?: number
    unit?: string
    type?: 'product' | 'service' | 'part'
    brand?: string | null
    model?: string | null
    location?: string | null
    active?: boolean
    createdAt?: Date
    updatedAt?: Date
  }): Product {
    return new Product(
      params.id,
      params.name,
      params.sku ?? null,
      params.description ?? null,
      params.categoryId ?? null,
      params.supplierId ?? null,
      Money.from(params.costPrice ?? 0),
      Money.from(params.salePrice ?? 0),
      params.quantity ?? 0,
      params.minStock ?? 5,
      params.unit || 'unidad',
      params.type || 'product',
      params.brand ?? null,
      params.model ?? null,
      params.location ?? null,
      params.active ?? true,
      params.createdAt || new Date(),
      params.updatedAt || new Date(),
    )
  }

  /** Get the cost price as a number */
  get costPrice(): number {
    return this._costPrice.amount
  }

  /** Get the sale price as a number */
  get salePrice(): number {
    return this._salePrice.amount
  }

  /** Get the current stock quantity */
  get quantity(): number {
    return this._quantity
  }

  /** Get the minimum stock threshold */
  get minStock(): number {
    return this._minStock
  }

  /** Calculate profit margin as a percentage */
  get profitMargin(): number {
    if (this._costPrice.isZero()) return 0
    return (
      ((this._salePrice.amount - this._costPrice.amount) /
        this._costPrice.amount) *
      100
    )
  }

  /** Check if stock is at or below the minimum threshold */
  get isLowStock(): boolean {
    return this._quantity <= this._minStock
  }

  /** Check if there is sufficient stock for the requested quantity */
  hasSufficientStock(requested: number): boolean {
    return this.type === 'service' || this._quantity >= requested
  }

  /** Deduct stock for a sale/repair, throws InsufficientStockError if not enough */
  deductStock(quantity: number): void {
    if (!this.hasSufficientStock(quantity)) {
      throw new InsufficientStockError(this.name, quantity, this._quantity)
    }
    this._quantity -= quantity
  }

  /** Add stock (e.g. from a return or restock) */
  addStock(quantity: number): void {
    this._quantity += quantity
  }

  /** Adjust stock to a specific quantity (for inventory corrections) */
  adjustStock(newQuantity: number): void {
    this._quantity = newQuantity
  }

  /** Update both cost and sale prices */
  updatePrices(costPrice: number, salePrice: number): void {
    if (costPrice < 0 || salePrice < 0) {
      throw new DomainError(
        'Los precios no pueden ser negativos',
        'INVALID_PRICE',
      )
    }
    this._costPrice = Money.from(costPrice)
    this._salePrice = Money.from(salePrice)
  }

  /** Serialize to a plain object matching the original interface shape */
  toPlainObject() {
    return {
      id: this.id,
      name: this.name,
      sku: this.sku,
      description: this.description,
      categoryId: this.categoryId,
      supplierId: this.supplierId,
      costPrice: this.costPrice,
      salePrice: this.salePrice,
      quantity: this.quantity,
      minStock: this.minStock,
      unit: this.unit,
      type: this.type,
      brand: this.brand,
      model: this.model,
      location: this.location,
      active: this.active,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
