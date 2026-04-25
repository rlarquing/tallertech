import { Money, SaleStatus } from '../value-objects'
import { DomainError, InvalidStateTransitionError } from '../errors'
import { SaleItem } from './sale-item'

/**
 * Sale Entity
 * Represents a sale transaction with line items.
 */
export class Sale {
  private constructor(
    public readonly id: string,
    public code: string,
    public readonly customerId: string | null,
    public readonly userId: string,
    public userName: string,
    private _subtotal: Money,
    private _discount: Money,
    private _tax: Money,
    private _total: Money,
    public paymentMethod: 'efectivo' | 'transferencia' | 'mixto',
    private _status: SaleStatus,
    public notes: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    private _items: SaleItem[],
    public readonly customer?: { name: string } | null,
  ) {}

  static create(params: {
    id: string
    code: string
    customerId?: string | null
    userId: string
    userName: string
    subtotal?: number
    discount?: number
    tax?: number
    total?: number
    paymentMethod?: 'efectivo' | 'transferencia' | 'mixto'
    status?: 'completed' | 'cancelled' | 'pending'
    notes?: string | null
    createdAt?: Date
    updatedAt?: Date
    items?: SaleItem[]
    customer?: { name: string } | null
  }): Sale {
    const status = SaleStatus.from(params.status || 'completed')
    const items = params.items || []

    return new Sale(
      params.id,
      params.code,
      params.customerId ?? null,
      params.userId,
      params.userName,
      Money.from(params.subtotal ?? 0),
      Money.from(params.discount ?? 0),
      Money.from(params.tax ?? 0),
      Money.from(params.total ?? 0),
      params.paymentMethod || 'efectivo',
      status,
      params.notes ?? null,
      params.createdAt || new Date(),
      params.updatedAt || new Date(),
      items,
      params.customer ?? null,
    )
  }

  /** Get the subtotal as a number */
  get subtotal(): number {
    return this._subtotal.amount
  }

  /** Get the discount as a number */
  get discount(): number {
    return this._discount.amount
  }

  /** Get the tax as a number */
  get tax(): number {
    return this._tax.amount
  }

  /** Get the total as a number */
  get total(): number {
    return this._total.amount
  }

  /** Get the current status string */
  get status(): 'completed' | 'cancelled' | 'pending' {
    return this._status.value
  }

  /** Get the sale items */
  get items(): SaleItem[] {
    return this._items
  }

  /** Calculate totals from items */
  calculateTotals(): void {
    let subtotal = Money.zero()
    for (const item of this._items) {
      subtotal = subtotal.add(item.calculateTotal())
    }
    this._subtotal = subtotal
    this._total = subtotal.subtract(this._discount).add(this._tax)
  }

  /** Cancel this sale, throws if transition is invalid */
  cancel(): void {
    const newStatus = SaleStatus.from('cancelled')
    if (!this._status.canTransitionTo(newStatus)) {
      throw new InvalidStateTransitionError(this._status.value, 'cancelled')
    }
    this._status = newStatus
  }

  /** Mark a pending sale as completed */
  complete(): void {
    const newStatus = SaleStatus.from('completed')
    if (!this._status.canTransitionTo(newStatus)) {
      throw new InvalidStateTransitionError(this._status.value, 'completed')
    }
    this._status = newStatus
  }

  /** Check if this sale can be cancelled */
  isCancellable(): boolean {
    const cancelled = SaleStatus.from('cancelled')
    return this._status.canTransitionTo(cancelled)
  }

  /** Check if this sale can be completed */
  isCompletable(): boolean {
    const completed = SaleStatus.from('completed')
    return this._status.canTransitionTo(completed)
  }

  /** Check if this sale is in a terminal state */
  isTerminal(): boolean {
    return this._status.isTerminal()
  }

  /** Serialize to a plain object matching the original interface shape */
  toPlainObject() {
    return {
      id: this.id,
      code: this.code,
      customerId: this.customerId,
      userId: this.userId,
      userName: this.userName,
      subtotal: this.subtotal,
      discount: this.discount,
      tax: this.tax,
      total: this.total,
      paymentMethod: this.paymentMethod,
      status: this.status,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      items: this._items.map((item) => item.toPlainObject()),
      customer: this.customer,
    }
  }
}
