// ============================================================
// PrismaSaleRepository - SaleRepository implementation using Prisma
// Clean Architecture: Infrastructure Layer - Persistence
// ============================================================

import { SaleRepository } from '@/domain/repositories'
import { Sale, SaleItem } from '@/domain/entities'
import { prisma } from '../prisma-client'
import { SaleMapper } from '../mappers'

export class PrismaSaleRepository implements SaleRepository {
  async findById(id: string): Promise<Sale | null> {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        customer: { select: { name: true } },
        items: {
          include: { product: true },
        },
      },
    })
    return sale ? SaleMapper.toDomain(sale) : null
  }

  async findMany(params?: {
    search?: string
    skip?: number
    take?: number
    filters?: Record<string, string>
    workshopId?: string
  }): Promise<{ data: Sale[]; total: number }> {
    const where: Record<string, unknown> = {}

    if (params?.workshopId) {
      where.workshopId = params.workshopId
    }

    if (params?.search) {
      where.OR = [
        { code: { contains: params.search } },
        { customer: { name: { contains: params.search } } },
      ]
    }

    if (params?.filters) {
      if (params.filters.status) {
        where.status = params.filters.status
      }
      if (params.filters.dateFrom || params.filters.dateTo) {
        where.createdAt = {}
        if (params.filters.dateFrom) {
          (where.createdAt as Record<string, unknown>).gte = new Date(params.filters.dateFrom)
        }
        if (params.filters.dateTo) {
          const to = new Date(params.filters.dateTo)
          to.setHours(23, 59, 59, 999)
          ;(where.createdAt as Record<string, unknown>).lte = to
        }
      }
    }

    const skip = params?.skip || 0
    const take = params?.take || 20

    const [data, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          customer: true,
          items: {
            include: { product: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.sale.count({ where }),
    ])

    return {
      data: data.map((s) => SaleMapper.toDomain(s)),
      total,
    }
  }

  async create(data: Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'items'>): Promise<Sale> {
    const plain = data.toPlainObject()
    const sale = await prisma.sale.create({
      data: {
        workshopId: plain.workshopId || '',
        code: plain.code,
        customerId: plain.customerId,
        userId: plain.userId,
        userName: plain.userName,
        subtotal: plain.subtotal,
        discount: plain.discount,
        tax: plain.tax,
        total: plain.total,
        paymentMethod: plain.paymentMethod,
        status: plain.status,
        notes: plain.notes,
      },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    })
    return SaleMapper.toDomain(sale)
  }

  async update(id: string, data: Partial<Sale>): Promise<Sale> {
    const updateData: Record<string, unknown> = {}
    if (data.code !== undefined) updateData.code = data.code
    if (data.customerId !== undefined) updateData.customerId = data.customerId
    if (data.userId !== undefined) updateData.userId = data.userId
    if (data.userName !== undefined) updateData.userName = data.userName
    if (data.subtotal !== undefined) updateData.subtotal = data.subtotal
    if (data.discount !== undefined) updateData.discount = data.discount
    if (data.tax !== undefined) updateData.tax = data.tax
    if (data.total !== undefined) updateData.total = data.total
    if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod
    if (data.status !== undefined) updateData.status = data.status
    if (data.notes !== undefined) updateData.notes = data.notes

    const sale = await prisma.sale.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    })
    return SaleMapper.toDomain(sale)
  }

  async delete(id: string): Promise<void> {
    await prisma.sale.delete({ where: { id } })
  }

  /**
   * Create a sale with items in a single transaction.
   * This also decrements product stock and creates stock movements.
   */
  async createWithItems(
    data: Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'items'>,
    items: Omit<SaleItem, 'id' | 'saleId'>[]
  ): Promise<Sale> {
    const plain = data.toPlainObject()

    const sale = await prisma.$transaction(async (tx) => {
      // Create sale with items
      const newSale = await tx.sale.create({
        data: {
          workshopId: plain.workshopId || '',
          code: plain.code,
          customerId: plain.customerId,
          userId: plain.userId,
          userName: plain.userName,
          subtotal: plain.subtotal,
          discount: plain.discount,
          tax: plain.tax,
          total: plain.total,
          paymentMethod: plain.paymentMethod,
          notes: plain.notes,
          items: {
            create: items.map((item) => ({
              productId: item.productId || null,
              name: item.name,
              quantity: item.quantity || 1,
              unitPrice: item.unitPrice || 0,
              discount: item.discount || 0,
              total: (item.unitPrice || 0) * (item.quantity || 1) - (item.discount || 0),
              type: item.type || 'product',
            })),
          },
        },
        include: {
          customer: true,
          items: {
            include: { product: true },
          },
        },
      })

      // Decrement product quantities and create stock movements
      for (const item of items) {
        if (item.productId) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          })

          if (product) {
            if (product.quantity < (item.quantity || 1)) {
              throw new Error(
                `Stock insuficiente para ${product.name}. Disponible: ${product.quantity}`
              )
            }

            await tx.product.update({
              where: { id: item.productId },
              data: { quantity: product.quantity - (item.quantity || 1) },
            })

            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                type: 'out',
                quantity: item.quantity || 1,
                reason: 'Venta',
                reference: plain.code,
                userId: plain.userId,
                userName: plain.userName,
              },
            })
          }
        }
      }

      return newSale
    })

    return SaleMapper.toDomain(sale)
  }

  async findByDateRange(from: Date, to: Date, workshopId?: string): Promise<Sale[]> {
    const where: Record<string, unknown> = {
      createdAt: {
        gte: from,
        lte: to,
      },
    }
    if (workshopId) where.workshopId = workshopId
    const sales = await prisma.sale.findMany({
      where,
      include: {
        customer: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return sales.map((s) => SaleMapper.toDomain(s))
  }

  async getSalesStats(from?: Date, to?: Date, workshopId?: string): Promise<{
    totalRevenue: number
    totalSales: number
    byPaymentMethod: Record<string, number>
    byDay: { date: string; total: number; count: number }[]
  }> {
    const where: Record<string, unknown> = {
      status: 'completed',
    }

    if (workshopId) where.workshopId = workshopId

    if (from || to) {
      where.createdAt = {}
      if (from) (where.createdAt as Record<string, unknown>).gte = from
      if (to) (where.createdAt as Record<string, unknown>).lte = to
    }

    // Get total revenue and count
    const aggregate = await prisma.sale.aggregate({
      where,
      _sum: { total: true },
      _count: true,
    })

    // Get by payment method
    const byPayment = await prisma.sale.groupBy({
      by: ['paymentMethod'],
      where,
      _sum: { total: true },
    })

    const byPaymentMethod: Record<string, number> = {}
    for (const item of byPayment) {
      byPaymentMethod[item.paymentMethod] = item._sum.total || 0
    }

    // Get by day
    const salesByDay = await prisma.sale.findMany({
      where,
      select: { createdAt: true, total: true },
      orderBy: { createdAt: 'asc' },
    })

    const dayMap: Record<string, { total: number; count: number }> = {}
    for (const sale of salesByDay) {
      const dateKey = sale.createdAt.toISOString().split('T')[0]
      if (!dayMap[dateKey]) {
        dayMap[dateKey] = { total: 0, count: 0 }
      }
      dayMap[dateKey].total += sale.total
      dayMap[dateKey].count += 1
    }

    const byDay = Object.entries(dayMap).map(([date, data]) => ({
      date,
      total: data.total,
      count: data.count,
    }))

    return {
      totalRevenue: aggregate._sum.total || 0,
      totalSales: aggregate._count,
      byPaymentMethod,
      byDay,
    }
  }
}
