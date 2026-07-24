// ============================================================
// PrismaRepairRepository - RepairRepository implementation using Prisma
// Clean Architecture: Infrastructure Layer - Persistence
// ============================================================

import { RepairRepository } from '@/domain/repositories'
import { RepairOrder, RepairPart } from '@/domain/entities'
import { prisma } from '../prisma-client'
import { RepairOrderMapper, RepairPartMapper } from '../mappers'
import { toPlain } from '../utils/to-plain'

export class PrismaRepairRepository implements RepairRepository {
  async findById(id: string): Promise<RepairOrder | null> {
    const repair = await prisma.repairOrder.findUnique({
      where: { id },
      include: {
        parts: true,
      },
    })
    return repair ? RepairOrderMapper.toDomain(repair) : null
  }

  async findMany(params?: {
    search?: string
    skip?: number
    take?: number
    filters?: Record<string, string>
    workshopId?: string
  }): Promise<{ data: RepairOrder[]; total: number }> {
    const where: Record<string, unknown> = {}

    if (params?.workshopId) {
      where.workshopId = params.workshopId
    }

    if (params?.search) {
      where.OR = [
        { code: { contains: params.search } },
        { device: { contains: params.search } },
        { brand: { contains: params.search } },
        { imei: { contains: params.search } },
      ]
    }

    if (params?.filters) {
      if (params.filters.status) {
        where.status = params.filters.status
      }
      if (params.filters.priority) {
        where.priority = params.filters.priority
      }
    }

    const skip = params?.skip || 0
    const take = params?.take || 20

    const [data, total] = await Promise.all([
      prisma.repairOrder.findMany({
        where,
        include: {
          parts: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.repairOrder.count({ where }),
    ])

    return {
      data: data.map((r) => RepairOrderMapper.toDomain(r)),
      total,
    }
  }

  async create(data: Omit<RepairOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<RepairOrder> {
    const plain = toPlain(data)
    const repair = await prisma.repairOrder.create({
      data: {
        workshopId: plain.workshopId as string,
        code: plain.code as string,
        userId: plain.userId as string,
        userName: plain.userName as string,
        device: plain.device as string,
        brand: plain.brand as string | null,
        imei: plain.imei as string | null,
        issue: plain.issue as string,
        diagnosis: plain.diagnosis as string | null,
        solution: plain.solution as string | null,
        status: plain.status as string,
        priority: plain.priority as string,
        costEstimate: plain.costEstimate as number,
        laborCost: plain.laborCost as number,
        partsCost: plain.partsCost as number,
        totalCost: plain.totalCost as number,
        paymentMethod: plain.paymentMethod as string,
        paid: plain.paid as boolean,
        receivedAt: plain.receivedAt as Date,
        estimatedReady: plain.estimatedReady as Date | null,
        completedAt: plain.completedAt as Date | null,
        deliveredAt: plain.deliveredAt as Date | null,
        notes: plain.notes as string | null,
      },
      include: {
        parts: true,
      },
    })
    return RepairOrderMapper.toDomain(repair)
  }

  async update(id: string, data: Partial<RepairOrder>): Promise<RepairOrder> {
    const updateData: Record<string, unknown> = {}
    if (data.code !== undefined) updateData.code = data.code
    if (data.userId !== undefined) updateData.userId = data.userId
    if (data.userName !== undefined) updateData.userName = data.userName
    if (data.device !== undefined) updateData.device = data.device
    if (data.brand !== undefined) updateData.brand = data.brand
    if (data.imei !== undefined) updateData.imei = data.imei
    if (data.issue !== undefined) updateData.issue = data.issue
    if (data.diagnosis !== undefined) updateData.diagnosis = data.diagnosis
    if (data.solution !== undefined) updateData.solution = data.solution
    if (data.status !== undefined) updateData.status = data.status
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.costEstimate !== undefined) updateData.costEstimate = data.costEstimate
    if (data.laborCost !== undefined) updateData.laborCost = data.laborCost
    if (data.partsCost !== undefined) updateData.partsCost = data.partsCost
    if (data.totalCost !== undefined) updateData.totalCost = data.totalCost
    if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod
    if (data.paid !== undefined) updateData.paid = data.paid
    if (data.receivedAt !== undefined) updateData.receivedAt = data.receivedAt
    if (data.estimatedReady !== undefined) updateData.estimatedReady = data.estimatedReady
    if (data.completedAt !== undefined) updateData.completedAt = data.completedAt
    if (data.deliveredAt !== undefined) updateData.deliveredAt = data.deliveredAt
    if (data.notes !== undefined) updateData.notes = data.notes

    const repair = await prisma.repairOrder.update({
      where: { id },
      data: updateData,
      include: {
        parts: true,
      },
    })
    return RepairOrderMapper.toDomain(repair)
  }

  async delete(id: string): Promise<void> {
    await prisma.repairOrder.delete({ where: { id } })
  }

  async findByStatus(status: string, workshopId?: string): Promise<RepairOrder[]> {
    const where: Record<string, unknown> = { status }
    if (workshopId) where.workshopId = workshopId
    const repairs = await prisma.repairOrder.findMany({
      where,
      include: {
        parts: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return repairs.map((r) => RepairOrderMapper.toDomain(r))
  }

  async updateStatus(
    id: string,
    status: string,
    data?: Partial<RepairOrder>
  ): Promise<RepairOrder> {
    const updateData: Record<string, unknown> = { status }

    if (data) {
      if (data.diagnosis !== undefined) updateData.diagnosis = data.diagnosis
      if (data.solution !== undefined) updateData.solution = data.solution
      if (data.paid !== undefined) updateData.paid = data.paid
      if (data.laborCost !== undefined) updateData.laborCost = data.laborCost
      if (data.partsCost !== undefined) updateData.partsCost = data.partsCost
      if (data.totalCost !== undefined) updateData.totalCost = data.totalCost
      if (data.costEstimate !== undefined) updateData.costEstimate = data.costEstimate
      if (data.notes !== undefined) updateData.notes = data.notes
    }

    // Set timestamps based on status
    if (status === 'ready') {
      updateData.completedAt = new Date()
    }
    if (status === 'delivered') {
      updateData.deliveredAt = new Date()
    }

    const repair = await prisma.repairOrder.update({
      where: { id },
      data: updateData,
      include: {
        parts: true,
      },
    })
    return RepairOrderMapper.toDomain(repair)
  }

  async addPart(
    repairOrderId: string,
    part: Omit<RepairPart, 'id' | 'repairOrderId'>
  ): Promise<RepairPart> {
    const created = await prisma.repairPart.create({
      data: {
        repairOrderId,
        productId: part.productId || null,
        name: part.name,
        quantity: part.quantity || 1,
        unitPrice: part.unitPrice || 0,
        total: (part.unitPrice || 0) * (part.quantity || 1),
      },
    })
    return RepairPartMapper.toDomain(created)
  }
}
