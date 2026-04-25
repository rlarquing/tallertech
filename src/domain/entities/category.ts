import { DomainError } from '../errors'

/**
 * Category Entity
 * Represents a product/service/part category.
 */
export class Category {
  private constructor(
    public readonly id: string,
    public name: string,
    public description: string | null,
    public type: 'product' | 'service' | 'part',
    public active: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(params: {
    id: string
    name: string
    description?: string | null
    type?: 'product' | 'service' | 'part'
    active?: boolean
    createdAt?: Date
    updatedAt?: Date
  }): Category {
    return new Category(
      params.id,
      params.name,
      params.description ?? null,
      params.type || 'product',
      params.active ?? true,
      params.createdAt || new Date(),
      params.updatedAt || new Date(),
    )
  }

  /** Activate this category */
  activate(): void {
    this.active = true
  }

  /** Deactivate this category */
  deactivate(): void {
    this.active = false
  }

  /** Update category details */
  updateDetails(params: {
    name?: string
    description?: string | null
    type?: 'product' | 'service' | 'part'
  }): void {
    if (params.name !== undefined) this.name = params.name
    if (params.description !== undefined) this.description = params.description
    if (params.type !== undefined) this.type = params.type
  }

  /** Serialize to a plain object matching the original interface shape */
  toPlainObject() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
      active: this.active,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
