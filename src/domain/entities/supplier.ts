/**
 * Supplier Entity
 * Represents a product supplier.
 */
export class Supplier {
  private constructor(
    public readonly id: string,
    public name: string,
    public phone: string | null,
    public email: string | null,
    public address: string | null,
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
    notes?: string | null
    active?: boolean
    createdAt?: Date
    updatedAt?: Date
  }): Supplier {
    return new Supplier(
      params.id,
      params.name,
      params.phone ?? null,
      params.email ?? null,
      params.address ?? null,
      params.notes ?? null,
      params.active ?? true,
      params.createdAt || new Date(),
      params.updatedAt || new Date(),
    )
  }

  /** Activate this supplier */
  activate(): void {
    this.active = true
  }

  /** Deactivate this supplier */
  deactivate(): void {
    this.active = false
  }

  /** Update supplier details */
  updateDetails(params: {
    name?: string
    phone?: string | null
    email?: string | null
    address?: string | null
    notes?: string | null
  }): void {
    if (params.name !== undefined) this.name = params.name
    if (params.phone !== undefined) this.phone = params.phone
    if (params.email !== undefined) this.email = params.email
    if (params.address !== undefined) this.address = params.address
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
      notes: this.notes,
      active: this.active,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
