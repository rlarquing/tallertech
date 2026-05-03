import { DomainError } from '../errors'

/**
 * DailyClosing Entity
 * Represents a daily closing (cierre diario) for an employee in a workshop.
 */
export class DailyClosing {
  private constructor(
    public readonly id: string,
    public readonly workshopId: string,
    public readonly userId: string,
    public readonly userName: string,
    public date: Date,
    public salesCount: number,
    public salesTotal: number,
    public repairsCount: number,
    public repairsTotal: number,
    public expensesTotal: number,
    public totalIncome: number,
    public netTotal: number,
    public notes: string | null,
    private _status: string,
    private _closedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(params: {
    id: string
    workshopId: string
    userId: string
    userName: string
    date: Date
    salesCount?: number
    salesTotal?: number
    repairsCount?: number
    repairsTotal?: number
    expensesTotal?: number
    totalIncome?: number
    netTotal?: number
    notes?: string | null
    status?: string
    closedAt?: Date | null
    createdAt?: Date
    updatedAt?: Date
  }): DailyClosing {
    const salesCount = params.salesCount ?? 0
    const salesTotal = params.salesTotal ?? 0
    const repairsCount = params.repairsCount ?? 0
    const repairsTotal = params.repairsTotal ?? 0
    const expensesTotal = params.expensesTotal ?? 0
    const totalIncome = params.totalIncome ?? (salesTotal + repairsTotal)
    const netTotal = params.netTotal ?? (totalIncome - expensesTotal)

    return new DailyClosing(
      params.id,
      params.workshopId,
      params.userId,
      params.userName,
      params.date,
      salesCount,
      salesTotal,
      repairsCount,
      repairsTotal,
      expensesTotal,
      totalIncome,
      netTotal,
      params.notes ?? null,
      params.status ?? 'open',
      params.closedAt ?? null,
      params.createdAt || new Date(),
      params.updatedAt || new Date(),
    )
  }

  get status(): string {
    return this._status
  }

  get closedAt(): Date | null {
    return this._closedAt
  }

  /** Close the daily closing. Can only close if status is 'open'. */
  close(notes?: string): void {
    if (this._status !== 'open') {
      throw new DomainError(
        'El cierre diario ya está cerrado',
        'INVALID_STATE_TRANSITION',
      )
    }
    this._status = 'closed'
    this._closedAt = new Date()
    if (notes !== undefined) {
      this.notes = notes
    }
  }

  /** Update the financial totals */
  updateTotals(params: {
    salesCount: number
    salesTotal: number
    repairsCount: number
    repairsTotal: number
    expensesTotal: number
  }): void {
    this.salesCount = params.salesCount
    this.salesTotal = params.salesTotal
    this.repairsCount = params.repairsCount
    this.repairsTotal = params.repairsTotal
    this.expensesTotal = params.expensesTotal
    this.totalIncome = params.salesTotal + params.repairsTotal
    this.netTotal = this.totalIncome - params.expensesTotal
  }

  /** Serialize to a plain object */
  toPlainObject() {
    return {
      id: this.id,
      workshopId: this.workshopId,
      userId: this.userId,
      userName: this.userName,
      date: this.date,
      salesCount: this.salesCount,
      salesTotal: this.salesTotal,
      repairsCount: this.repairsCount,
      repairsTotal: this.repairsTotal,
      expensesTotal: this.expensesTotal,
      totalIncome: this.totalIncome,
      netTotal: this.netTotal,
      notes: this.notes,
      status: this._status,
      closedAt: this._closedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
