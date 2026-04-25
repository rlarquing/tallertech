// ============================================================
// Get Repairs Use Case - List repairs with filters
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { RepairRepository } from '@/domain/repositories'
import type { SessionPort } from '@/application/ports'
import type { RepairFilters, PaginatedResult } from '@/application/dtos'
import { ValidationError } from '@/domain/errors'

export class GetRepairsUseCase {
  constructor(
    private repairRepository: RepairRepository,
    private sessionPort: SessionPort,
  ) {}

  async execute(
    filters: RepairFilters,
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

    const filterParams: Record<string, string> = {}
    if (filters.status) filterParams.status = filters.status

    // 3. Query repository
    const result = await this.repairRepository.findMany({
      search: filters.search,
      skip,
      take: limit,
      filters: Object.keys(filterParams).length > 0 ? filterParams : undefined,
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
