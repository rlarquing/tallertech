// ============================================================
// Get Products Use Case - List products with filters
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { ProductRepository } from '@/domain/repositories'
import type { SessionPort } from '@/application/ports'
import type { ProductFilters, PaginatedResult } from '@/application/dtos'
import { ValidationError } from '@/domain/errors'
import type { Product } from '@/domain/entities'

export class GetProductsUseCase {
  constructor(
    private productRepository: ProductRepository,
    private sessionPort: SessionPort,
  ) {}

  async execute(
    filters: ProductFilters,
    sessionRequest?: Request,
  ): Promise<PaginatedResult<Product>> {
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
    if (filters.categoryId) filterParams.categoryId = filters.categoryId
    if (filters.type) filterParams.type = filters.type
    if (filters.lowStock) filterParams.lowStock = 'true'
    if (filters.active !== undefined) filterParams.active = filters.active

    // 3. Query repository
    const result = await this.productRepository.findMany({
      search: filters.search,
      skip,
      take: limit,
      filters: Object.keys(filterParams).length > 0 ? filterParams : undefined,
    })

    // 4. Filter low stock in JS if needed
    let data = result.data
    let total = result.total
    if (filters.lowStock) {
      data = data.filter((p) => p.quantity <= p.minStock)
      total = data.length
    }

    // 5. Return paginated result
    return {
      data,
      total,
      page,
      limit,
    }
  }
}
