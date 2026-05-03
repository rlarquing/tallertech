// ============================================================
// PrismaDailyClosingRepository - DailyClosingRepository implementation using Prisma
// Clean Architecture: Infrastructure Layer - Persistence
// ============================================================

import { DailyClosingRepository } from '@/domain/repositories'
import { DailyClosing } from '@/domain/entities'
import { prisma } from '../prisma-client'
import { DailyClosingMapper } from '../mappers'

export class PrismaDailyClosingRepository implements DailyClosingRepository {
  async findById(id: string): Promise<DailyClosing | null> {
    const dailyClosing = await prisma.dailyClosing.findUnique({ where: { id } })
    return dailyClosing ? DailyClosingMapper.toDomain(dailyClosing) : null
  }

  async findMany(params: {
    workshopId?: string
    userId?: string
    dateFrom?: Date
    dateTo?: Date
    status?: string
    skip?: number
    take?: number
  }): Promise<{ data: DailyClosing[]; total: number }> {
    const where: Record<string, unknown> = {}

    if (params.workshopId) {
      where.workshopId = params.workshopId
    }

    if (params.userId) {
      where.userId = params.userId
    }

    if (params.status) {
      where.status = params.status
    }

    if (params.dateFrom || params.dateTo) {
      where.date = {}
      if (params.dateFrom) {
        (where.date as Record<string, unknown>).gte = params.dateFrom
      }
      if (params.dateTo) {
        const to = new Date(params.dateTo)
        to.setHours(23, 59, 59, 999)
        ;(where.date as Record<string, unknown>).lte = to
      }
    }

    const skip = params.skip || 0
    const take = params.take || 20

    const [data, total] = await Promise.all([
      prisma.dailyClosing.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take,
      }),
      prisma.dailyClosing.count({ where }),
    ])

    return {
      data: data.map((dc) => DailyClosingMapper.toDomain(dc)),
      total,
    }
  }

  async create(data: Omit<DailyClosing, 'id' | 'createdAt' | 'updatedAt'>): Promise<DailyClosing> {
    const plain = data.toPlainObject()
    const dailyClosing = await prisma.dailyClosing.create({
      data: {
        workshopId: plain.workshopId,
        userId: plain.userId,
        userName: plain.userName,
        date: plain.date,
        salesCount: plain.salesCount,
        salesTotal: plain.salesTotal,
        repairsCount: plain.repairsCount,
        repairsTotal: plain.repairsTotal,
        expensesTotal: plain.expensesTotal,
        totalIncome: plain.totalIncome,
        netTotal: plain.netTotal,
        notes: plain.notes,
        status: plain.status,
        closedAt: plain.closedAt,
      },
    })
    return DailyClosingMapper.toDomain(dailyClosing)
  }

  async update(id: string, data: Partial<DailyClosing>): Promise<DailyClosing> {
    const updateData: Record<string, unknown> = {}
    if (data.salesCount !== undefined) updateData.salesCount = data.salesCount
    if (data.salesTotal !== undefined) updateData.salesTotal = data.salesTotal
    if (data.repairsCount !== undefined) updateData.repairsCount = data.repairsCount
    if (data.repairsTotal !== undefined) updateData.repairsTotal = data.repairsTotal
    if (data.expensesTotal !== undefined) updateData.expensesTotal = data.expensesTotal
    if (data.totalIncome !== undefined) updateData.totalIncome = data.totalIncome
    if (data.netTotal !== undefined) updateData.netTotal = data.netTotal
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.status !== undefined) updateData.status = data.status
    if (data.closedAt !== undefined) updateData.closedAt = data.closedAt

    const dailyClosing = await prisma.dailyClosing.update({
      where: { id },
      data: updateData,
    })
    return DailyClosingMapper.toDomain(dailyClosing)
  }

  async findByWorkshopAndUserAndDate(
    workshopId: string,
    userId: string,
    date: Date,
  ): Promise<DailyClosing | null> {
    // Normalize the date to start of day for matching
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const dailyClosing = await prisma.dailyClosing.findFirst({
      where: {
        workshopId,
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    })
    return dailyClosing ? DailyClosingMapper.toDomain(dailyClosing) : null
  }

  async getOpenClosing(
    workshopId: string,
    userId: string,
    date: Date,
  ): Promise<DailyClosing | null> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const dailyClosing = await prisma.dailyClosing.findFirst({
      where: {
        workshopId,
        userId,
        status: 'open',
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    })
    return dailyClosing ? DailyClosingMapper.toDomain(dailyClosing) : null
  }
}
