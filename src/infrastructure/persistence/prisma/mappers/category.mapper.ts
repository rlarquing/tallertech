// ============================================================
// Category Mapper - Prisma <-> Domain entity conversion
// Clean Architecture: Infrastructure Layer - Persistence
// ============================================================

import { Category } from '@/domain/entities'

export class CategoryMapper {
  /**
   * Convert a Prisma Category record to a Domain Category entity
   */
  static toDomain(prismaCategory: {
    id: string
    name: string
    description: string | null
    type: string
    active: boolean
    createdAt: Date
    updatedAt: Date
  }): Category {
    return Category.create({
      id: prismaCategory.id,
      name: prismaCategory.name,
      description: prismaCategory.description,
      type: prismaCategory.type as 'product' | 'service' | 'part',
      active: prismaCategory.active,
      createdAt: prismaCategory.createdAt,
      updatedAt: prismaCategory.updatedAt,
    })
  }

  /**
   * Convert a Domain Category entity to a Prisma-compatible data object
   */
  static toPrisma(category: Category): {
    id: string
    name: string
    description: string | null
    type: string
    active: boolean
    createdAt: Date
    updatedAt: Date
  } {
    const plain = category.toPlainObject()
    return {
      id: plain.id,
      name: plain.name,
      description: plain.description,
      type: plain.type,
      active: plain.active,
      createdAt: plain.createdAt,
      updatedAt: plain.updatedAt,
    }
  }
}
