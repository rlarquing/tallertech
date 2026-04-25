/**
 * Domain Events
 * Event-driven architecture support for the domain layer.
 */

export interface DomainEvent {
  eventType: string
  occurredAt: Date
  aggregateId: string
  aggregateType: string
  payload: Record<string, unknown>
}

export class DomainEventPublisher {
  private static instance: DomainEventPublisher
  private handlers: Map<string, Array<(event: DomainEvent) => Promise<void>>> =
    new Map()

  static getInstance(): DomainEventPublisher {
    if (!DomainEventPublisher.instance) {
      DomainEventPublisher.instance = new DomainEventPublisher()
    }
    return DomainEventPublisher.instance
  }

  subscribe(
    eventType: string,
    handler: (event: DomainEvent) => Promise<void>,
  ): void {
    const handlers = this.handlers.get(eventType) || []
    handlers.push(handler)
    this.handlers.set(eventType, handlers)
  }

  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) || []
    await Promise.all(handlers.map((handler) => handler(event)))
  }
}

/** Event type constants */
export const DomainEventTypes = {
  SALE_CREATED: 'sale.created',
  SALE_CANCELLED: 'sale.cancelled',
  REPAIR_CREATED: 'repair.created',
  REPAIR_STATUS_CHANGED: 'repair.status_changed',
  STOCK_ADJUSTED: 'stock.adjusted',
  PRODUCT_CREATED: 'product.created',
  LOW_STOCK_ALERT: 'stock.low_stock_alert',
} as const

export type DomainEventType = (typeof DomainEventTypes)[keyof typeof DomainEventTypes]
