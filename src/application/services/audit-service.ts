// ============================================================
// Audit Service - Application service for tracing/logging
// Clean Architecture: Application Business Rules Layer
// ============================================================

import { db } from '@/lib/db'

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
}

class AuditService {
  /**
   * Log an audit entry
   */
  async log(entry: AuditEntry) {
    try {
      return await db.auditLog.create({
        data: {
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
      return await db.auditLog.createMany({
        data: entries.map((entry) => ({
          userId: entry.userId,
          userName: entry.userName,
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId,
          details: entry.details,
          ip: entry.ip,
        })),
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
    skip?: number
    take?: number
  }) {
    const where: Record<string, unknown> = {}

    if (params.userId) where.userId = params.userId
    if (params.entity) where.entity = params.entity
    if (params.action) where.action = params.action
    if (params.dateFrom || params.dateTo) {
      where.createdAt = {}
      if (params.dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(params.dateFrom)
      if (params.dateTo) (where.createdAt as Record<string, unknown>).lte = new Date(params.dateTo)
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
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: params.skip || 0,
        take: params.take || 50,
      }),
      db.auditLog.count({ where }),
    ])

    return { data, total }
  }

  /**
   * Get audit logs for a specific entity
   */
  async getByEntity(entity: string, entityId: string) {
    return db.auditLog.findMany({
      where: { entity, entityId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  }

  /**
   * Get recent audit entries
   */
  async getRecent(limit = 20) {
    return db.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  /**
   * Get audit statistics
   */
  async getStats() {
    const [totalLogs, todayLogs, byEntity, byAction] = await Promise.all([
      db.auditLog.count(),
      db.auditLog.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      db.auditLog.groupBy({
        by: ['entity'],
        _count: { entity: true },
        orderBy: { _count: { entity: 'desc' } },
        take: 10,
      }),
      db.auditLog.groupBy({
        by: ['action'],
        _count: { action: true },
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
