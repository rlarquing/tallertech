// ============================================================
// PrismaCategoryRepository - CategoryRepository implementation using Prisma
// Clean Architecture: Infrastructure Layer - Persistence
// ============================================================

import { BaseRepository, CategoryRepository } from '@/domain/repositories'
import { Category } from '@/domain/entities'
import { prisma } from '../prisma-client'
import { CategoryMapper } from '../mappers'

export class PrismaCategoryRepository implements CategoryRepository {
  async findById(id: string): Promise<Category | null> {
    const category = await prisma.category.findUnique({ where: { id } })
    return category ? CategoryMapper.toDomain(category) : null
  }

  async findMany(params?: {
    search?: string
    skip?: number
    take?: number
    filters?: Record<string, string>
  }): Promise<{ data: Category[]; total: number }> {
    const where: Record<string, unknown> = {}

    if (params?.search) {
      where.OR = [
        { name: { contains: params.search } },
        { description: { contains: params.search } },
      ]
    }

    if (params?.filters) {
      if (params.filters.type) {
        where.type = params.filters.type
      }
      if (params.filters.active !== undefined && params.filters.active !== '') {
        where.active = params.filters.active === 'true'
      }
    }

    const skip = params?.skip || 0
    const take = params?.take || 50

    const [data, total] = await Promise.all([
      prisma.category.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.category.count({ where }),
    ])

    return {
      data: data.map((c) => CategoryMapper.toDomain(c)),
      total,
    }
  }

  async create(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    const plain = data.toPlainObject()
    const category = await prisma.category.create({
      data: {
        name: plain.name,
        description: plain.description,
        type: plain.type,
        active: plain.active,
      },
    })
    return CategoryMapper.toDomain(category)
  }

  async update(id: string, data: Partial<Category>): Promise<Category> {
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.type !== undefined) updateData.type = data.type
    if (data.active !== undefined) updateData.active = data.active

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    })
    return CategoryMapper.toDomain(category)
  }

  async delete(id: string): Promise<void> {
    await prisma.category.delete({ where: { id } })
  }
}

// Type assertion to ensure the repository implements BaseRepository<Category>
// This is needed since CategoryRepository = BaseRepository<Category>
void (PrismaCategoryRepository as new () => BaseRepository<Category>)
