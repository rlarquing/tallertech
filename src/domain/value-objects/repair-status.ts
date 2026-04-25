import { DomainError, InvalidStateTransitionError } from '../errors'

/**
 * Valid repair status values
 */
export const REPAIR_STATUSES = [
  'received',
  'diagnosing',
  'waiting_parts',
  'repairing',
  'ready',
  'delivered',
  'cancelled',
] as const

export type RepairStatusValue = (typeof REPAIR_STATUSES)[number]

/**
 * RepairStatus Value Object
 * Enforces valid state transitions for repair orders.
 */
export class RepairStatus {
  private constructor(public readonly value: RepairStatusValue) {}

  /**
   * Valid state transition map:
   * - received → diagnosing, cancelled
   * - diagnosing → waiting_parts, repairing, ready, cancelled
   * - waiting_parts → repairing, cancelled
   * - repairing → ready, cancelled
   * - ready → delivered, cancelled
   * - delivered → (terminal)
   * - cancelled → (terminal)
   */
  private static readonly transitions: Record<RepairStatusValue, RepairStatusValue[]> = {
    received: ['diagnosing', 'cancelled'],
    diagnosing: ['waiting_parts', 'repairing', 'ready', 'cancelled'],
    waiting_parts: ['repairing', 'cancelled'],
    repairing: ['ready', 'cancelled'],
    ready: ['delivered', 'cancelled'],
    delivered: [],
    cancelled: [],
  }

  /** Create a RepairStatus from a string, throws if invalid */
  static from(status: string): RepairStatus {
    if (!REPAIR_STATUSES.includes(status as RepairStatusValue)) {
      throw new DomainError(
        `Estado de reparación inválido: ${status}`,
        'INVALID_REPAIR_STATUS',
      )
    }
    return new RepairStatus(status as RepairStatusValue)
  }

  /** Check if a transition to the given status is valid */
  canTransitionTo(newStatus: RepairStatus): boolean {
    const allowed = RepairStatus.transitions[this.value]
    return allowed.includes(newStatus.value)
  }

  /** Transition to a new status, throws if transition is invalid */
  transitionTo(newStatus: RepairStatus): RepairStatus {
    if (!this.canTransitionTo(newStatus)) {
      throw new InvalidStateTransitionError(this.value, newStatus.value)
    }
    return newStatus
  }

  /** Check if this is a terminal status (no further transitions allowed) */
  isTerminal(): boolean {
    return RepairStatus.transitions[this.value].length === 0
  }

  equals(other: RepairStatus): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }

  valueOf(): string {
    return this.value
  }
}
