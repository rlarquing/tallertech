// ============================================================
// Get Suppliers Use Case - List suppliers
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { SupplierRepository } from '@/domain/repositories'
import type { SessionPort } from '@/application/ports'
import type { PaginationParams, PaginatedResult } from '@/application/dtos'
import { ValidationError } from '@/domain/errors'

export class GetSuppliersUseCase {
  constructor(
    private supplierRepository: SupplierRepository,
    private sessionPort: SessionPort,
  ) {}

  async execute(
    filters: PaginationParams,
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
    const limit = filters.limit || 20
    const skip = (page - 1) * limit

    // 3. Query repository
    const result = await this.supplierRepository.findMany({
      search: filters.search,
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
