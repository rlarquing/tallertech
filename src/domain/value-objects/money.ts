/**
 * Money Value Object
 * Immutable representation of a monetary amount.
 * Handles rounding to 2 decimal places.
 */
export class Money {
  private constructor(public readonly amount: number) {
    // Round to 2 decimal places
    this.amount = Math.round(amount * 100) / 100
  }

  /** Create a Money instance from a number */
  static from(amount: number): Money {
    return new Money(amount)
  }

  /** Create a zero-valued Money instance */
  static zero(): Money {
    return new Money(0)
  }

  /** Add another Money value, returns a new Money instance */
  add(other: Money): Money {
    return new Money(this.amount + other.amount)
  }

  /** Subtract another Money value, returns a new Money instance */
  subtract(other: Money): Money {
    return new Money(this.amount - other.amount)
  }

  /** Multiply by a factor, returns a new Money instance */
  multiply(factor: number): Money {
    return new Money(this.amount * factor)
  }

  /** Check if the amount is negative */
  isNegative(): boolean {
    return this.amount < 0
  }

  /** Check if the amount is zero */
  isZero(): boolean {
    return this.amount === 0
  }

  /** Check if the amount is positive */
  isPositive(): boolean {
    return this.amount > 0
  }

  /** Format as a currency string, e.g. "$1,234.56" */
  format(): string {
    return `$${this.amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  /** Check equality with another Money instance */
  equals(other: Money): boolean {
    return this.amount === other.amount
  }

  toString(): string {
    return this.format()
  }

  valueOf(): number {
    return this.amount
  }
}
