// ============================================================
// PrismaSupplierRepository - SupplierRepository implementation using Prisma
// Clean Architecture: Infrastructure Layer - Persistence
// ============================================================

import { BaseRepository, SupplierRepository } from '@/domain/repositories'
import { Supplier } from '@/domain/entities'
import { prisma } from '../prisma-client'
import { SupplierMapper } from '../mappers'

export class PrismaSupplierRepository implements SupplierRepository {
  async findById(id: string): Promise<Supplier | null> {
    const supplier = await prisma.supplier.findUnique({ where: { id } })
    return supplier ? SupplierMapper.toDomain(supplier) : null
  }

  async findMany(params?: {
    search?: string
    skip?: number
    take?: number
    filters?: Record<string, string>
  }): Promise<{ data: Supplier[]; total: number }> {
    const where: Record<string, unknown> = {}

    if (params?.search) {
      where.OR = [
        { name: { contains: params.search } },
        { phone: { contains: params.search } },
        { email: { contains: params.search } },
      ]
    }

    if (params?.filters) {
      if (params.filters.active !== undefined && params.filters.active !== '') {
        where.active = params.filters.active === 'true'
      }
    }

    const skip = params?.skip || 0
    const take = params?.take || 50

    const [data, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.supplier.count({ where }),
    ])

    return {
      data: data.map((s) => SupplierMapper.toDomain(s)),
      total,
    }
  }

  async create(data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier> {
    const plain = data.toPlainObject()
    const supplier = await prisma.supplier.create({
      data: {
        name: plain.name,
        phone: plain.phone,
        email: plain.email,
        address: plain.address,
        notes: plain.notes,
        active: plain.active,
      },
    })
    return SupplierMapper.toDomain(supplier)
  }

  async update(id: string, data: Partial<Supplier>): Promise<Supplier> {
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.email !== undefined) updateData.email = data.email
    if (data.address !== undefined) updateData.address = data.address
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.active !== undefined) updateData.active = data.active

    const supplier = await prisma.supplier.update({
      where: { id },
      data: updateData,
    })
    return SupplierMapper.toDomain(supplier)
  }

  async delete(id: string): Promise<void> {
    await prisma.supplier.delete({ where: { id } })
  }
}

// Type assertion to ensure the repository implements BaseRepository<Supplier>
void (PrismaSupplierRepository as new () => BaseRepository<Supplier>)
