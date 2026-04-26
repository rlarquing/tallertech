// ============================================================
// Audit Service Infrastructure - Audit logging implementation
// Clean Architecture: Infrastructure Layer - Services
// ============================================================

import { prisma } from '../persistence/prisma/prisma-client'

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'REGISTER'
  | 'STATUS_CHANGE'
  | 'STOCK_ADJUSTMENT'
  | 'BACKUP'
  | 'RESTORE'
  | 'EXPORT'
  | 'CANCEL'

export interface AuditEntry {
  userId: string
  userName: string
  action: AuditAction | string
  entity: string
  entityId?: string | null
  details?: string | null
  ip?: string | null
  workshopId?: string | null
}

export class AuditService {
  /**
   * Log an audit entry
   */
  async log(entry: AuditEntry) {
    try {
      // If no workshopId provided, try to find the user's first workshop
      let workshopId = entry.workshopId
      if (!workshopId) {
        const membership = await prisma.workshopUser.findFirst({
          where: { userId: entry.userId },
          select: { workshopId: true },
        })
        workshopId = membership?.workshopId
      }

      // If still no workshopId, try to find any workshop (system-level audit)
      if (!workshopId) {
        const firstWorkshop = await prisma.workshop.findFirst({
          select: { id: true },
        })
        workshopId = firstWorkshop?.id || 'system'
      }

      return await prisma.auditLog.create({
        data: {
          workshopId,
          userId: entry.userId,
          userName: entry.userName,
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId,
          details: entry.details,
          ip: entry.ip,
        },
      })
    } catch (error) {
      // Audit logging should never break the application
      console.error('[AuditService] Failed to log audit entry:', error)
      return null
    }
  }

  /**
   * Log multiple entries at once
   */
  async logBatch(entries: AuditEntry[]) {
    try {
      // Resolve workshop IDs for entries that don't have one
      const resolvedEntries = await Promise.all(
        entries.map(async (entry) => {
          let workshopId = entry.workshopId
          if (!workshopId) {
            const membership = await prisma.workshopUser.findFirst({
              where: { userId: entry.userId },
              select: { workshopId: true },
            })
            workshopId = membership?.workshopId
          }
          if (!workshopId) {
            const firstWorkshop = await prisma.workshop.findFirst({
              select: { id: true },
            })
            workshopId = firstWorkshop?.id || 'system'
          }
          return {
            workshopId,
            userId: entry.userId,
            userName: entry.userName,
            action: entry.action,
            entity: entry.entity,
            entityId: entry.entityId,
            details: entry.details,
            ip: entry.ip,
          }
        })
      )

      return await prisma.auditLog.createMany({
        data: resolvedEntries,
      })
    } catch (error) {
      console.error('[AuditService] Failed to log batch:', error)
      return null
    }
  }

  /**
   * Get audit logs with filters
   */
  async getLogs(params: {
    userId?: string
    entity?: string
    action?: string
    dateFrom?: string
    dateTo?: string
    search?: string
    workshopId?: string
    skip?: number
    take?: number
  }) {
    const where: Record<string, unknown> = {}

    if (params.workshopId) where.workshopId = params.workshopId
    if (params.userId) where.userId = params.userId
    if (params.entity) where.entity = params.entity
    if (params.action) where.action = params.action
    if (params.dateFrom || params.dateTo) {
      where.createdAt = {}
      if (params.dateFrom)
        (where.createdAt as Record<string, unknown>).gte = new Date(params.dateFrom)
      if (params.dateTo)
        (where.createdAt as Record<string, unknown>).lte = new Date(params.dateTo)
    }
    if (params.search) {
      where.OR = [
        { userName: { contains: params.search } },
        { entity: { contains: params.search } },
        { action: { contains: params.search } },
        { details: { contains: params.search } },
      ]
    }

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: params.skip || 0,
        take: params.take || 50,
      }),
      prisma.auditLog.count({ where }),
    ])

    return { data, total }
  }

  /**
   * Get audit logs for a specific entity
   */
  async getByEntity(entity: string, entityId: string) {
    return prisma.auditLog.findMany({
      where: { entity, entityId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  }

  /**
   * Get recent audit entries
   */
  async getRecent(limit = 20) {
    return prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  /**
   * Get audit statistics
   */
  async getStats(workshopId?: string) {
    const baseWhere = workshopId ? { workshopId } : {}
    const [totalLogs, todayLogs, byEntity, byAction] = await Promise.all([
      prisma.auditLog.count({ where: baseWhere }),
      prisma.auditLog.count({
        where: {
          ...baseWhere,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.auditLog.groupBy({
        by: ['entity'],
        _count: { entity: true },
        where: baseWhere,
        orderBy: { _count: { entity: 'desc' } },
        take: 10,
      }),
      prisma.auditLog.groupBy({
        by: ['action'],
        _count: { action: true },
        where: baseWhere,
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
    ])

    return {
      totalLogs,
      todayLogs,
      byEntity: byEntity.map((e) => ({ entity: e.entity, count: e._count.entity })),
      byAction: byAction.map((a) => ({ action: a.action, count: a._count.action })),
    }
  }
}

export const auditService = new AuditService()
