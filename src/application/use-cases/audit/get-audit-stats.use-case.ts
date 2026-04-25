// ============================================================
// Get Audit Stats Use Case - Get audit statistics
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { AuditRepository } from '@/domain/repositories'
import type { SessionPort } from '@/application/ports'
import { ValidationError } from '@/domain/errors'
import type { AuditLog } from '@/domain/entities'

export interface AuditStatsResult {
  totalLogs: number
  todayLogs: number
  byEntity: Array<{ entity: string; count: number }>
  byAction: Array<{ action: string; count: number }>
}

export class GetAuditStatsUseCase {
  constructor(
    private auditRepository: AuditRepository,
    private sessionPort: SessionPort,
  ) {}

  async execute(sessionRequest?: Request): Promise<AuditStatsResult> {
    // 1. Authenticate
    const user = sessionRequest
      ? await this.sessionPort.getSessionUser(sessionRequest)
      : null
    if (!user) {
      throw new ValidationError('No autenticado')
    }

    // 2. Get all logs for stats calculation
    const allLogs = await this.auditRepository.findMany({ take: 100000 })

    // 3. Calculate stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayLogs = allLogs.data.filter(
      (log: AuditLog) => new Date(log.createdAt) >= today,
    ).length

    // Group by entity
    const entityMap = new Map<string, number>()
    for (const log of allLogs.data) {
      const entity = log.entity
      entityMap.set(entity, (entityMap.get(entity) || 0) + 1)
    }
    const byEntity = Array.from(entityMap.entries())
      .map(([entity, count]) => ({ entity, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Group by action
    const actionMap = new Map<string, number>()
    for (const log of allLogs.data) {
      const action = log.action
      actionMap.set(action, (actionMap.get(action) || 0) + 1)
    }
    const byAction = Array.from(actionMap.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // 4. Return result
    return {
      totalLogs: allLogs.total,
      todayLogs,
      byEntity,
      byAction,
    }
  }
}
