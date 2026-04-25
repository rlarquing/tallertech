// ============================================================
// PrismaAuditRepository - AuditRepository implementation using Prisma
// Clean Architecture: Infrastructure Layer - Persistence
// ============================================================

import { AuditRepository } from '@/domain/repositories'
import { AuditLog } from '@/domain/entities'
import { prisma } from '../prisma-client'
import { AuditLogMapper } from '../mappers'

export class PrismaAuditRepository implements AuditRepository {
  async log(entry: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
    const plain = entry.toPlainObject()
    const log = await prisma.auditLog.create({
      data: {
        userId: plain.userId,
        userName: plain.userName,
        action: plain.action,
        entity: plain.entity,
        entityId: plain.entityId,
        details: plain.details,
        ip: plain.ip,
      },
    })
    return AuditLogMapper.toDomain(log)
  }

  async findMany(params?: {
    userId?: string
    entity?: string
    action?: string
    dateFrom?: Date
    dateTo?: Date
    skip?: number
    take?: number
  }): Promise<{ data: AuditLog[]; total: number }> {
    const where: Record<string, unknown> = {}

    if (params?.userId) where.userId = params.userId
    if (params?.entity) where.entity = params.entity
    if (params?.action) where.action = params.action
    if (params?.dateFrom || params?.dateTo) {
      where.createdAt = {}
      if (params.dateFrom) {
        (where.createdAt as Record<string, unknown>).gte = params.dateFrom
      }
      if (params.dateTo) {
        ;(where.createdAt as Record<string, unknown>).lte = params.dateTo
      }
    }

    const skip = params?.skip || 0
    const take = params?.take || 50

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.auditLog.count({ where }),
    ])

    return {
      data: data.map((l) => AuditLogMapper.toDomain(l)),
      total,
    }
  }

  async findByEntityId(entity: string, entityId: string): Promise<AuditLog[]> {
    const logs = await prisma.auditLog.findMany({
      where: { entity, entityId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return logs.map((l) => AuditLogMapper.toDomain(l))
  }

  async getRecent(limit = 20): Promise<AuditLog[]> {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return logs.map((l) => AuditLogMapper.toDomain(l))
  }
}
