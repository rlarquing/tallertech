// ============================================================
// Get Sales Use Case - List sales with filters
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { SaleRepository } from '@/domain/repositories'
import type { SessionPort } from '@/application/ports'
import type { SaleFilters, PaginatedResult } from '@/application/dtos'
import { ValidationError } from '@/domain/errors'

export class GetSalesUseCase {
  constructor(
    private saleRepository: SaleRepository,
    private sessionPort: SessionPort,
  ) {}

  async execute(
    filters: SaleFilters,
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
    if (filters.dateFrom) filterParams.dateFrom = filters.dateFrom
    if (filters.dateTo) filterParams.dateTo = filters.dateTo

    // 3. Query repository
    const result = await this.saleRepository.findMany({
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
