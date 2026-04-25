import { DomainError, InvalidStateTransitionError } from '../errors'

/**
 * Valid sale status values
 */
export const SALE_STATUSES = ['completed', 'cancelled', 'pending'] as const

export type SaleStatusValue = (typeof SALE_STATUSES)[number]

/**
 * SaleStatus Value Object
 * Enforces valid state transitions for sales.
 */
export class SaleStatus {
  private constructor(public readonly value: SaleStatusValue) {}

  /**
   * Valid state transition map:
   * - completed → cancelled
   * - pending → completed, cancelled
   * - cancelled → (terminal)
   */
  private static readonly transitions: Record<SaleStatusValue, SaleStatusValue[]> = {
    completed: ['cancelled'],
    pending: ['completed', 'cancelled'],
    cancelled: [],
  }

  /** Create a SaleStatus from a string, throws if invalid */
  static from(status: string): SaleStatus {
    if (!SALE_STATUSES.includes(status as SaleStatusValue)) {
      throw new DomainError(
        `Estado de venta inválido: ${status}`,
        'INVALID_SALE_STATUS',
      )
    }
    return new SaleStatus(status as SaleStatusValue)
  }

  /** Check if a transition to the given status is valid */
  canTransitionTo(newStatus: SaleStatus): boolean {
    const allowed = SaleStatus.transitions[this.value]
    return allowed.includes(newStatus.value)
  }

  /** Transition to a new status, throws if transition is invalid */
  transitionTo(newStatus: SaleStatus): SaleStatus {
    if (!this.canTransitionTo(newStatus)) {
      throw new InvalidStateTransitionError(this.value, newStatus.value)
    }
    return newStatus
  }

  /** Check if this is a terminal status (no further transitions allowed) */
  isTerminal(): boolean {
    return SaleStatus.transitions[this.value].length === 0
  }

  equals(other: SaleStatus): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }

  valueOf(): string {
    return this.value
  }
}
