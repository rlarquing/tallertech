// ============================================================
// PrismaProductRepository - ProductRepository implementation using Prisma
// Clean Architecture: Infrastructure Layer - Persistence
// ============================================================

import { ProductRepository } from '@/domain/repositories'
import { Product, StockMovement } from '@/domain/entities'
import { prisma } from '../prisma-client'
import { ProductMapper, StockMovementMapper } from '../mappers'
import { toPlain } from '../utils/to-plain'

export class PrismaProductRepository implements ProductRepository {
  async findById(id: string): Promise<Product | null> {
    const product = await prisma.product.findUnique({ where: { id } })
    return product ? ProductMapper.toDomain(product) : null
  }

  async findMany(params?: {
    search?: string
    skip?: number
    take?: number
    filters?: Record<string, string>
    workshopId?: string
  }): Promise<{ data: Product[]; total: number }> {
    const where: Record<string, unknown> = {}
    const lowStock = params?.filters?.lowStock === 'true'

    if (params?.workshopId) {
      where.workshopId = params.workshopId
    }

    if (params?.search) {
      where.OR = [
        { name: { contains: params.search } },
        { sku: { contains: params.search } },
        { brand: { contains: params.search } },
        { model: { contains: params.search } },
      ]
    }

    // Apply filters
    if (params?.filters) {
      if (params.filters.categoryId) {
        where.categoryId = params.filters.categoryId
      }
      if (params.filters.type) {
        where.type = params.filters.type
      }
      if (params.filters.active !== undefined && params.filters.active !== '') {
        where.active = params.filters.active === 'true'
      }
    }

    const skip = params?.skip || 0
    const take = params?.take || 20

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.product.count({ where }),
    ])

    // If lowStock filter, filter in-memory since Prisma SQLite doesn't support field comparisons
    let filteredData = data
    if (lowStock) {
      filteredData = data.filter((p) => p.quantity <= p.minStock)
    }

    return {
      data: filteredData.map((p) => ProductMapper.toDomain(p)),
      total: lowStock ? filteredData.length : total,
    }
  }

  async create(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const plain = toPlain(data)
    const product = await prisma.product.create({
      data: {
        workshopId: plain.workshopId as string,
        name: plain.name as string,
        sku: plain.sku as string | null,
        description: plain.description as string | null,
        categoryId: plain.categoryId as string | null,
        supplierId: plain.supplierId as string | null,
        costPrice: plain.costPrice as number,
        salePrice: plain.salePrice as number,
        quantity: plain.quantity as number,
        minStock: plain.minStock as number,
        unit: plain.unit as string,
        type: plain.type as 'product' | 'service' | 'part',
        brand: plain.brand as string | null,
        model: plain.model as string | null,
        location: plain.location as string | null,
        active: plain.active as boolean,
      },
    })
    return ProductMapper.toDomain(product)
  }

  async update(id: string, data: Partial<Product>): Promise<Product> {
    // Build update data from partial domain entity
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.sku !== undefined) updateData.sku = data.sku
    if (data.description !== undefined) updateData.description = data.description
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId
    if (data.supplierId !== undefined) updateData.supplierId = data.supplierId
    if (data.costPrice !== undefined) updateData.costPrice = data.costPrice
    if (data.salePrice !== undefined) updateData.salePrice = data.salePrice
    if (data.quantity !== undefined) updateData.quantity = data.quantity
    if (data.minStock !== undefined) updateData.minStock = data.minStock
    if (data.unit !== undefined) updateData.unit = data.unit
    if (data.type !== undefined) updateData.type = data.type
    if (data.brand !== undefined) updateData.brand = data.brand
    if (data.model !== undefined) updateData.model = data.model
    if (data.location !== undefined) updateData.location = data.location
    if (data.active !== undefined) updateData.active = data.active

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    })
    return ProductMapper.toDomain(product)
  }

  async delete(id: string): Promise<void> {
    await prisma.product.delete({ where: { id } })
  }

  async findBySku(sku: string): Promise<Product | null> {
    // sku is not @unique in the schema (it's nullable and workshop-scoped),
    // so use findFirst instead of findUnique.
    const product = await prisma.product.findFirst({ where: { sku } })
    return product ? ProductMapper.toDomain(product) : null
  }

  async findLowStock(): Promise<Product[]> {
    // Fetch all active products and filter in-memory (SQLite limitation)
    const products = await prisma.product.findMany({
      where: { active: true },
    })
    return products
      .filter((p) => p.quantity <= p.minStock)
      .map((p) => ProductMapper.toDomain(p))
  }

  async adjustStock(
    id: string,
    quantity: number,
    type: string,
    reason: string,
    userId: string,
    userName: string,
    reference?: string,
  ): Promise<Product> {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id } })
      if (!product) throw new Error('Producto no encontrado')

      let newQuantity: number
      switch (type) {
        case 'in':
          newQuantity = product.quantity + quantity
          break
        case 'out':
          newQuantity = product.quantity - quantity
          if (newQuantity < 0) {
            throw new Error(
              `Stock insuficiente para ${product.name}. Disponible: ${product.quantity}`
            )
          }
          break
        case 'adjustment':
          newQuantity = quantity // Direct set for adjustments
          break
        case 'return':
          newQuantity = product.quantity + quantity
          break
        default:
          throw new Error(`Tipo de movimiento inválido: ${type}`)
      }

      const updated = await tx.product.update({
        where: { id },
        data: { quantity: newQuantity },
      })

      await tx.stockMovement.create({
        data: {
          productId: id,
          type,
          quantity,
          reason,
          reference: reference || null,
          userId,
          userName,
        },
      })

      return ProductMapper.toDomain(updated)
    })
  }

  async getStockMovements(productId: string): Promise<StockMovement[]> {
    const movements = await prisma.stockMovement.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    })
    return movements.map((m) => StockMovementMapper.toDomain(m))
  }
}
