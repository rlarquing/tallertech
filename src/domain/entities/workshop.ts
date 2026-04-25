import { DomainError } from '../errors'

/**
 * Workshop Entity
 * Represents a repair workshop (taller) in the multi-tenancy system.
 */
export class Workshop {
  private constructor(
    public readonly id: string,
    public name: string,
    public slug: string,
    public description: string | null,
    public address: string | null,
    public phone: string | null,
    public email: string | null,
    public logo: string | null,
    public active: boolean,
    public currency: string,
    public timezone: string,
    public readonly settings: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(params: {
    id: string
    name: string
    slug: string
    description?: string | null
    address?: string | null
    phone?: string | null
    email?: string | null
    logo?: string | null
    active?: boolean
    currency?: string
    timezone?: string
    settings?: string
    createdAt?: Date
    updatedAt?: Date
  }): Workshop {
    if (!params.name) throw new DomainError('El nombre del taller es requerido', 'VALIDATION_ERROR')
    if (!params.slug) throw new DomainError('El slug del taller es requerido', 'VALIDATION_ERROR')
    return new Workshop(
      params.id,
      params.name,
      params.slug,
      params.description ?? null,
      params.address ?? null,
      params.phone ?? null,
      params.email ?? null,
      params.logo ?? null,
      params.active ?? true,
      params.currency || 'USD',
      params.timezone || 'America/Havana',
      params.settings || '{}',
      params.createdAt || new Date(),
      params.updatedAt || new Date(),
    )
  }

  static generateSlug(name: string): string {
    return (
      name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric with hyphen
        .replace(/^-+|-+$/g, '') // trim hyphens
      + '-' + Date.now().toString(36).slice(-4) // add short unique suffix
    )
  }

  updateDetails(
    params: Partial<
      Pick<
        Workshop,
        'name' | 'description' | 'address' | 'phone' | 'email' | 'currency' | 'timezone'
      >
    >,
  ): void {
    if (params.name !== undefined) this.name = params.name
    if (params.description !== undefined) this.description = params.description
    if (params.address !== undefined) this.address = params.address
    if (params.phone !== undefined) this.phone = params.phone
    if (params.email !== undefined) this.email = params.email
    if (params.currency !== undefined) this.currency = params.currency
    if (params.timezone !== undefined) this.timezone = params.timezone
  }

  deactivate(): void {
    this.active = false
  }

  activate(): void {
    this.active = true
  }

  toPlainObject() {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      description: this.description,
      address: this.address,
      phone: this.phone,
      email: this.email,
      logo: this.logo,
      active: this.active,
      currency: this.currency,
      timezone: this.timezone,
      settings: this.settings,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}

export interface WorkshopMember {
  id: string
  workshopId: string
  userId: string
  userName: string
  userEmail: string
  userImage: string | null
  role: 'owner' | 'admin' | 'employee'
  joinedAt: Date
}

export interface WorkshopWithRole extends ReturnType<Workshop['toPlainObject']> {
  userRole: 'owner' | 'admin' | 'employee'
}
