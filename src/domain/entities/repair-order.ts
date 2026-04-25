import { Money, RepairStatus } from '../value-objects'
import { DomainError, InvalidStateTransitionError } from '../errors'
import { RepairPart } from './repair-part'

/**
 * RepairOrder Entity
 * Represents a repair order for a customer's device.
 */
export class RepairOrder {
  private constructor(
    public readonly id: string,
    public code: string,
    public readonly customerId: string,
    public readonly userId: string,
    public userName: string,
    public device: string,
    public brand: string | null,
    public imei: string | null,
    public issue: string,
    public diagnosis: string | null,
    public solution: string | null,
    private _status: RepairStatus,
    public priority: 'low' | 'normal' | 'high' | 'urgent',
    private _costEstimate: Money,
    private _laborCost: Money,
    private _partsCost: Money,
    private _totalCost: Money,
    public paymentMethod: string,
    public paid: boolean,
    public receivedAt: Date,
    public estimatedReady: Date | null,
    public completedAt: Date | null,
    public deliveredAt: Date | null,
    public notes: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    private _parts: RepairPart[],
    public readonly customer?: { name: string } | null,
  ) {}

  static create(params: {
    id: string
    code: string
    customerId: string
    userId: string
    userName: string
    device: string
    brand?: string | null
    imei?: string | null
    issue: string
    diagnosis?: string | null
    solution?: string | null
    status?:
      | 'received'
      | 'diagnosing'
      | 'waiting_parts'
      | 'repairing'
      | 'ready'
      | 'delivered'
      | 'cancelled'
    priority?: 'low' | 'normal' | 'high' | 'urgent'
    costEstimate?: number
    laborCost?: number
    partsCost?: number
    totalCost?: number
    paymentMethod?: string
    paid?: boolean
    receivedAt?: Date
    estimatedReady?: Date | null
    completedAt?: Date | null
    deliveredAt?: Date | null
    notes?: string | null
    createdAt?: Date
    updatedAt?: Date
    parts?: RepairPart[]
    customer?: { name: string } | null
  }): RepairOrder {
    const status = RepairStatus.from(params.status || 'received')
    const parts = params.parts || []

    return new RepairOrder(
      params.id,
      params.code,
      params.customerId,
      params.userId,
      params.userName,
      params.device,
      params.brand ?? null,
      params.imei ?? null,
      params.issue,
      params.diagnosis ?? null,
      params.solution ?? null,
      status,
      params.priority || 'normal',
      Money.from(params.costEstimate ?? 0),
      Money.from(params.laborCost ?? 0),
      Money.from(params.partsCost ?? 0),
      Money.from(params.totalCost ?? 0),
      params.paymentMethod || 'efectivo',
      params.paid ?? false,
      params.receivedAt || new Date(),
      params.estimatedReady ?? null,
      params.completedAt ?? null,
      params.deliveredAt ?? null,
      params.notes ?? null,
      params.createdAt || new Date(),
      params.updatedAt || new Date(),
      parts,
      params.customer ?? null,
    )
  }

  /** Get the current status string */
  get status():
    | 'received'
    | 'diagnosing'
    | 'waiting_parts'
    | 'repairing'
    | 'ready'
    | 'delivered'
    | 'cancelled' {
    return this._status.value
  }

  /** Get the cost estimate as a number */
  get costEstimate(): number {
    return this._costEstimate.amount
  }

  /** Get the labor cost as a number */
  get laborCost(): number {
    return this._laborCost.amount
  }

  /** Get the parts cost as a number */
  get partsCost(): number {
    return this._partsCost.amount
  }

  /** Get the total cost as a number */
  get totalCost(): number {
    return this._totalCost.amount
  }

  /** Get the repair parts */
  get parts(): RepairPart[] {
    return this._parts
  }

  /** Update the status, enforcing valid state transitions */
  updateStatus(
    newStatus:
      | 'received'
      | 'diagnosing'
      | 'waiting_parts'
      | 'repairing'
      | 'ready'
      | 'delivered'
      | 'cancelled',
  ): void {
    const target = RepairStatus.from(newStatus)
    this._status = this._status.transitionTo(target)

    // Set timestamps based on new status
    if (newStatus === 'ready') {
      this.completedAt = new Date()
    }
    if (newStatus === 'delivered') {
      this.deliveredAt = new Date()
    }
  }

  /** Add a part to this repair order */
  addPart(part: RepairPart): void {
    if (this._status.isTerminal()) {
      throw new DomainError(
        'No se pueden agregar partes a una orden en estado terminal',
        'CANNOT_ADD_PART',
      )
    }
    this._parts.push(part)
    this.recalculateCosts()
  }

  /** Calculate the total cost from labor + parts */
  calculateTotalCost(): Money {
    let partsTotal = Money.zero()
    for (const part of this._parts) {
      partsTotal = partsTotal.add(part.calculateTotal())
    }
    this._partsCost = partsTotal
    return this._laborCost.add(partsTotal)
  }

  /** Recalculate all cost fields */
  recalculateCosts(): void {
    const total = this.calculateTotalCost()
    this._totalCost = total
    this._costEstimate = this._costEstimate.isZero()
      ? total
      : this._costEstimate
  }

  /** Mark the repair as ready for delivery */
  markAsReady(): void {
    this.updateStatus('ready')
  }

  /** Mark the repair as delivered */
  markAsDelivered(): void {
    this.updateStatus('delivered')
  }

  /** Cancel the repair order */
  cancel(): void {
    this.updateStatus('cancelled')
  }

  /** Set the diagnosis */
  setDiagnosis(diagnosis: string): void {
    this.diagnosis = diagnosis
  }

  /** Set the solution */
  setSolution(solution: string): void {
    this.solution = solution
  }

  /** Update labor cost */
  updateLaborCost(cost: number): void {
    if (cost < 0) {
      throw new DomainError(
        'El costo de mano de obra no puede ser negativo',
        'INVALID_LABOR_COST',
      )
    }
    this._laborCost = Money.from(cost)
    this.recalculateCosts()
  }

  /** Mark as paid */
  markAsPaid(): void {
    this.paid = true
  }

  /** Check if this repair can transition to a given status */
  canTransitionTo(
    status:
      | 'received'
      | 'diagnosing'
      | 'waiting_parts'
      | 'repairing'
      | 'ready'
      | 'delivered'
      | 'cancelled',
  ): boolean {
    const target = RepairStatus.from(status)
    return this._status.canTransitionTo(target)
  }

  /** Serialize to a plain object matching the original interface shape */
  toPlainObject() {
    return {
      id: this.id,
      code: this.code,
      customerId: this.customerId,
      userId: this.userId,
      userName: this.userName,
      device: this.device,
      brand: this.brand,
      imei: this.imei,
      issue: this.issue,
      diagnosis: this.diagnosis,
      solution: this.solution,
      status: this.status,
      priority: this.priority,
      costEstimate: this.costEstimate,
      laborCost: this.laborCost,
      partsCost: this.partsCost,
      totalCost: this.totalCost,
      paymentMethod: this.paymentMethod,
      paid: this.paid,
      receivedAt: this.receivedAt,
      estimatedReady: this.estimatedReady,
      completedAt: this.completedAt,
      deliveredAt: this.deliveredAt,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      parts: this._parts.map((part) => part.toPlainObject()),
      customer: this.customer,
    }
  }
}
