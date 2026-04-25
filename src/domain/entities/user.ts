import { Email } from '../value-objects'
import { DomainError } from '../errors'

/**
 * User Entity
 * Represents a system user (admin or employee).
 */
export class User {
  private constructor(
    public readonly id: string,
    public readonly email: Email,
    public name: string,
    public role: 'admin' | 'employee',
    public active: boolean,
    public readonly image: string | null,
    public readonly provider: 'credentials' | 'google',
    public readonly password: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(params: {
    id: string
    email: string
    name: string
    password: string
    role?: 'admin' | 'employee'
    provider?: 'credentials' | 'google'
    image?: string | null
    createdAt?: Date
    updatedAt?: Date
  }): User {
    return new User(
      params.id,
      Email.create(params.email),
      params.name,
      params.role || 'admin',
      true,
      params.image ?? null,
      params.provider || 'credentials',
      params.password,
      params.createdAt || new Date(),
      params.updatedAt || new Date(),
    )
  }

  /** Check if this user is an admin */
  isAdmin(): boolean {
    return this.role === 'admin'
  }

  /** Check if this user authenticated via Google (no password) */
  isGoogleUser(): boolean {
    return this.provider === 'google' && !this.password
  }

  /** Check if this user can be activated */
  canActivate(): boolean {
    return !this.active
  }

  /** Check if this user can be deactivated */
  canDeactivate(): boolean {
    return this.active && this.role !== 'admin'
  }

  /** Deactivate this user (cannot deactivate admin) */
  deactivate(): User {
    if (!this.canDeactivate()) {
      throw new DomainError(
        'No se puede desactivar este usuario',
        'CANNOT_DEACTIVATE',
      )
    }
    this.active = false
    return this
  }

  /** Activate this user */
  activate(): User {
    this.active = true
    return this
  }

  /** Update the user's display name */
  updateName(name: string): void {
    this.name = name
  }

  /** Serialize to a plain object matching the original interface shape */
  toPlainObject() {
    return {
      id: this.id,
      email: this.email.toString(),
      name: this.name,
      role: this.role,
      active: this.active,
      image: this.image,
      provider: this.provider,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }

  /** Get public-facing user info (no sensitive fields) */
  toPublicInfo() {
    return {
      id: this.id,
      email: this.email.toString(),
      name: this.name,
      role: this.role,
      image: this.image,
      provider: this.provider,
    }
  }
}
