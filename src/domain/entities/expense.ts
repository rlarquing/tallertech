import { Money } from '../value-objects'
import { DomainError } from '../errors'

/**
 * Expense Entity
 * Represents a business expense.
 */
export class Expense {
  private constructor(
    public readonly id: string,
    public category: 'supplies' | 'rent' | 'salary' | 'utilities' | 'other',
    public description: string,
    private _amount: Money,
    public readonly userId: string,
    public readonly userName: string,
    public date: Date,
    public notes: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(params: {
    id: string
    category: 'supplies' | 'rent' | 'salary' | 'utilities' | 'other'
    description: string
    amount: number
    userId: string
    userName: string
    date?: Date
    notes?: string | null
    createdAt?: Date
    updatedAt?: Date
  }): Expense {
    if (params.amount <= 0) {
      throw new DomainError(
        'El monto del gasto debe ser positivo',
        'INVALID_EXPENSE_AMOUNT',
      )
    }

    return new Expense(
      params.id,
      params.category,
      params.description,
      Money.from(params.amount),
      params.userId,
      params.userName,
      params.date || new Date(),
      params.notes ?? null,
      params.createdAt || new Date(),
      params.updatedAt || new Date(),
    )
  }

  /** Get the amount as a number */
  get amount(): number {
    return this._amount.amount
  }

  /** Update the expense amount */
  updateAmount(newAmount: number): void {
    if (newAmount <= 0) {
      throw new DomainError(
        'El monto del gasto debe ser positivo',
        'INVALID_EXPENSE_AMOUNT',
      )
    }
    this._amount = Money.from(newAmount)
  }

  /** Update expense details */
  updateDetails(params: {
    category?: 'supplies' | 'rent' | 'salary' | 'utilities' | 'other'
    description?: string
    amount?: number
    date?: Date
    notes?: string | null
  }): void {
    if (params.category !== undefined) this.category = params.category
    if (params.description !== undefined) this.description = params.description
    if (params.amount !== undefined) this.updateAmount(params.amount)
    if (params.date !== undefined) this.date = params.date
    if (params.notes !== undefined) this.notes = params.notes
  }

  /** Serialize to a plain object matching the original interface shape */
  toPlainObject() {
    return {
      id: this.id,
      category: this.category,
      description: this.description,
      amount: this.amount,
      userId: this.userId,
      userName: this.userName,
      date: this.date,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
