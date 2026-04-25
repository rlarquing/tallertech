// ============================================================
// Get Workshops Use Case
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { WorkshopRepository } from '@/domain/repositories'
import type { SessionPort } from '@/application/ports'
import type { WorkshopFilters } from '@/application/dtos'
import { ValidationError } from '@/domain/errors'

export class GetWorkshopsUseCase {
  constructor(
    private workshopRepository: WorkshopRepository,
    private sessionPort: SessionPort,
  ) {}

  async execute(request: WorkshopFilters, sessionRequest?: Request) {
    // 1. Authenticate
    const user = sessionRequest
      ? await this.sessionPort.getSessionUser(sessionRequest)
      : null
    if (!user) {
      throw new ValidationError('No autenticado')
    }

    // 2. Get workshops for this user
    const workshopsWithRole = await this.workshopRepository.findByUserId(user.id)

    // 3. Apply filters
    let filtered = workshopsWithRole
    if (request.search) {
      const search = request.search.toLowerCase()
      filtered = filtered.filter(
        (w) =>
          w.name.toLowerCase().includes(search) ||
          w.slug.toLowerCase().includes(search),
      )
    }
    if (request.active !== undefined) {
      filtered = filtered.filter((w) => w.active === request.active)
    }

    // 4. Paginate
    const page = request.page || 1
    const limit = request.limit || 20
    const total = filtered.length
    const skip = (page - 1) * limit
    const data = filtered.slice(skip, skip + limit)

    return { data, total, page, limit }
  }
}
