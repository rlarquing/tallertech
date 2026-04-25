// ============================================================
// Get Audit Logs Use Case - List audit logs with filters
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { AuditRepository } from '@/domain/repositories'
import type { SessionPort } from '@/application/ports'
import type { AuditFilters, PaginatedResult } from '@/application/dtos'
import { ValidationError } from '@/domain/errors'

export class GetAuditLogsUseCase {
  constructor(
    private auditRepository: AuditRepository,
    private sessionPort: SessionPort,
  ) {}

  async execute(
    filters: AuditFilters,
    sessionRequest?: Request,
  ): Promise<PaginatedResult<unknown>> {
    // 1. Authenticate
    const user = sessionRequest
      ? await this.sessionPort.getSessionUser(sessionRequest)
      : null
    if (!user) {
      throw new ValidationError('No autenticado')
    }

    // 2. Build params
    const page = filters.page || 1
    const limit = filters.limit || 50
    const skip = (page - 1) * limit

    // 3. Query repository
    const result = await this.auditRepository.findMany({
      userId: filters.userId,
      entity: filters.entity,
      action: filters.action,
      dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
      dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
      skip,
      take: limit,
    })

    // 4. Return paginated result
    return {
      data: result.data,
      total: result.total,
      page,
      limit,
    }
  }
}
