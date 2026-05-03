// ============================================================
// DailyClosing Mapper - Prisma <-> Domain entity conversion
// Clean Architecture: Infrastructure Layer - Persistence
// ============================================================

import { DailyClosing } from '@/domain/entities'

export class DailyClosingMapper {
  /**
   * Convert a Prisma DailyClosing record to a Domain DailyClosing entity
   */
  static toDomain(prismaDailyClosing: {
    id: string
    workshopId: string
    userId: string
    userName: string
    date: Date
    salesCount: number
    salesTotal: number
    repairsCount: number
    repairsTotal: number
    expensesTotal: number
    totalIncome: number
    netTotal: number
    notes: string | null
    status: string
    closedAt: Date | null
    createdAt: Date
    updatedAt: Date
  }): DailyClosing {
    return DailyClosing.create({
      id: prismaDailyClosing.id,
      workshopId: prismaDailyClosing.workshopId,
      userId: prismaDailyClosing.userId,
      userName: prismaDailyClosing.userName,
      date: prismaDailyClosing.date,
      salesCount: prismaDailyClosing.salesCount,
      salesTotal: prismaDailyClosing.salesTotal,
      repairsCount: prismaDailyClosing.repairsCount,
      repairsTotal: prismaDailyClosing.repairsTotal,
      expensesTotal: prismaDailyClosing.expensesTotal,
      totalIncome: prismaDailyClosing.totalIncome,
      netTotal: prismaDailyClosing.netTotal,
      notes: prismaDailyClosing.notes,
      status: prismaDailyClosing.status,
      closedAt: prismaDailyClosing.closedAt,
      createdAt: prismaDailyClosing.createdAt,
      updatedAt: prismaDailyClosing.updatedAt,
    })
  }

  /**
   * Convert a Domain DailyClosing entity to a Prisma-compatible data object
   */
  static toPrisma(dailyClosing: DailyClosing): {
    id: string
    workshopId: string
    userId: string
    userName: string
    date: Date
    salesCount: number
    salesTotal: number
    repairsCount: number
    repairsTotal: number
    expensesTotal: number
    totalIncome: number
    netTotal: number
    notes: string | null
    status: string
    closedAt: Date | null
    createdAt: Date
    updatedAt: Date
  } {
    const plain = dailyClosing.toPlainObject()
    return {
      id: plain.id,
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
      createdAt: plain.createdAt,
      updatedAt: plain.updatedAt,
    }
  }
}
