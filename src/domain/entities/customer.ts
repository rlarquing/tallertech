import { Email } from '../value-objects'

/**
 * Customer Entity
 * Represents a customer who can have sales and repair orders.
 */
export class Customer {
  private constructor(
    public readonly id: string,
    public name: string,
    public phone: string | null,
    private _email: Email | null,
    public address: string | null,
    public dni: string | null,
    public notes: string | null,
    public active: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(params: {
    id: string
    name: string
    phone?: string | null
    email?: string | null
    address?: string | null
    dni?: string | null
    notes?: string | null
    active?: boolean
    createdAt?: Date
    updatedAt?: Date
  }): Customer {
    return new Customer(
      params.id,
      params.name,
      params.phone ?? null,
      params.email ? Email.create(params.email) : null,
      params.address ?? null,
      params.dni ?? null,
      params.notes ?? null,
      params.active ?? true,
      params.createdAt || new Date(),
      params.updatedAt || new Date(),
    )
  }

  /** Get the email as a string or null */
  get email(): string | null {
    return this._email?.toString() ?? null
  }

  /** Deactivate this customer */
  deactivate(): void {
    this.active = false
  }

  /** Activate this customer */
  activate(): void {
    this.active = true
  }

  /** Update customer details */
  updateDetails(params: {
    name?: string
    phone?: string | null
    email?: string | null
    address?: string | null
    dni?: string | null
    notes?: string | null
  }): void {
    if (params.name !== undefined) this.name = params.name
    if (params.phone !== undefined) this.phone = params.phone
    if (params.email !== undefined) {
      this._email = params.email ? Email.create(params.email) : null
    }
    if (params.address !== undefined) this.address = params.address
    if (params.dni !== undefined) this.dni = params.dni
    if (params.notes !== undefined) this.notes = params.notes
  }

  /** Serialize to a plain object matching the original interface shape */
  toPlainObject() {
    return {
      id: this.id,
      name: this.name,
      phone: this.phone,
      email: this.email,
      address: this.address,
      dni: this.dni,
      notes: this.notes,
      active: this.active,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
