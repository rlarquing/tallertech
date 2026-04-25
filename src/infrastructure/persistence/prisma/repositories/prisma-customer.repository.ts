// ============================================================
// PrismaCustomerRepository - CustomerRepository implementation using Prisma
// Clean Architecture: Infrastructure Layer - Persistence
// ============================================================

import { CustomerRepository } from '@/domain/repositories'
import { Customer, Sale, RepairOrder } from '@/domain/entities'
import { prisma } from '../prisma-client'
import { CustomerMapper, SaleMapper, RepairOrderMapper } from '../mappers'

export class PrismaCustomerRepository implements CustomerRepository {
  async findById(id: string): Promise<Customer | null> {
    const customer = await prisma.customer.findUnique({ where: { id } })
    return customer ? CustomerMapper.toDomain(customer) : null
  }

  async findMany(params?: {
    search?: string
    skip?: number
    take?: number
    filters?: Record<string, string>
  }): Promise<{ data: Customer[]; total: number }> {
    const where: Record<string, unknown> = {}

    if (params?.search) {
      where.OR = [
        { name: { contains: params.search } },
        { phone: { contains: params.search } },
        { email: { contains: params.search } },
        { dni: { contains: params.search } },
      ]
    }

    if (params?.filters) {
      if (params.filters.active !== undefined && params.filters.active !== '') {
        where.active = params.filters.active === 'true'
      }
    }

    const skip = params?.skip || 0
    const take = params?.take || 20

    const [data, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.customer.count({ where }),
    ])

    return {
      data: data.map((c) => CustomerMapper.toDomain(c)),
      total,
    }
  }

  async create(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const plain = data.toPlainObject()
    const customer = await prisma.customer.create({
      data: {
        name: plain.name,
        phone: plain.phone,
        email: plain.email,
        address: plain.address,
        dni: plain.dni,
        notes: plain.notes,
        active: plain.active,
      },
    })
    return CustomerMapper.toDomain(customer)
  }

  async update(id: string, data: Partial<Customer>): Promise<Customer> {
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.email !== undefined) updateData.email = data.email
    if (data.address !== undefined) updateData.address = data.address
    if (data.dni !== undefined) updateData.dni = data.dni
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.active !== undefined) updateData.active = data.active

    const customer = await prisma.customer.update({
      where: { id },
      data: updateData,
    })
    return CustomerMapper.toDomain(customer)
  }

  async delete(id: string): Promise<void> {
    await prisma.customer.delete({ where: { id } })
  }

  async findWithHistory(
    id: string
  ): Promise<(Customer & { sales: Sale[]; repairOrders: RepairOrder[] }) | null> {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        sales: {
          include: { items: true, customer: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        repairOrders: {
          include: { parts: true, customer: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!customer) return null

    const domainCustomer = CustomerMapper.toDomain(customer)
    const sales = customer.sales.map((s) => SaleMapper.toDomain(s))
    const repairOrders = customer.repairOrders.map((r) => RepairOrderMapper.toDomain(r))

    return Object.assign(domainCustomer, { sales, repairOrders })
  }
}
