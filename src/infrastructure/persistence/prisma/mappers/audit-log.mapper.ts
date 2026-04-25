// ============================================================
// AuditLog Mapper - Prisma <-> Domain entity conversion
// Clean Architecture: Infrastructure Layer - Persistence
// ============================================================

import { AuditLog } from '@/domain/entities'

export class AuditLogMapper {
  /**
   * Convert a Prisma AuditLog record to a Domain AuditLog entity
   */
  static toDomain(prismaLog: {
    id: string
    userId: string
    userName: string
    action: string
    entity: string
    entityId: string | null
    details: string | null
    ip: string | null
    createdAt: Date
  }): AuditLog {
    return AuditLog.create({
      id: prismaLog.id,
      userId: prismaLog.userId,
      userName: prismaLog.userName,
      action: prismaLog.action,
      entity: prismaLog.entity,
      entityId: prismaLog.entityId,
      details: prismaLog.details,
      ip: prismaLog.ip,
      createdAt: prismaLog.createdAt,
    })
  }

  /**
   * Convert a Domain AuditLog entity to a Prisma-compatible data object
   */
  static toPrisma(log: AuditLog): {
    id: string
    userId: string
    userName: string
    action: string
    entity: string
    entityId: string | null
    details: string | null
    ip: string | null
    createdAt: Date
  } {
    const plain = log.toPlainObject()
    return {
      id: plain.id,
      userId: plain.userId,
      userName: plain.userName,
      action: plain.action,
      entity: plain.entity,
      entityId: plain.entityId,
      details: plain.details,
      ip: plain.ip,
      createdAt: plain.createdAt,
    }
  }
}
