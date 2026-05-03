// ============================================================
// Get Daily Closings Use Case - List daily closings with filters
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { DailyClosingRepository } from '@/domain/repositories'
import type { SessionPort } from '@/application/ports'
import type { DailyClosingFilters, PaginatedResult } from '@/application/dtos'
import { ValidationError } from '@/domain/errors'

export class GetDailyClosingsUseCase {
  constructor(
    private dailyClosingRepository: DailyClosingRepository,
    private sessionPort: SessionPort,
  ) {}

  async execute(
    filters: DailyClosingFilters,
    sessionRequest?: Request,
  ): Promise<PaginatedResult<unknown>> {
    // 1. Authenticate
    const user = sessionRequest
      ? await this.sessionPort.getSessionUser(sessionRequest)
      : null
    if (!user) {
      throw new ValidationError('No autenticado')
    }

    // 2. Build filter params
    const page = filters.page || 1
    const limit = filters.limit || 20
    const skip = (page - 1) * limit

    // 3. Owner/admin can see all employees' closings, employee can only see their own
    const userId = (user.role === 'owner' || user.role === 'admin')
      ? filters.userId
      : user.id

    // 4. Query repository
    const result = await this.dailyClosingRepository.findMany({
      workshopId: filters.workshopId,
      userId,
      dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
      dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
      status: filters.status,
      skip,
      take: limit,
    })

    // 5. Return paginated result
    return {
      data: result.data,
      total: result.total,
      page,
      limit,
    }
  }
}
