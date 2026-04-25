// ============================================================
// Update Category Use Case
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { CategoryRepository } from '@/domain/repositories'
import type { AuditPort, SessionPort } from '@/application/ports'
import type { UpdateCategoryRequest } from '@/application/dtos'
import { EntityNotFoundError, ValidationError } from '@/domain/errors'

export class UpdateCategoryUseCase {
  constructor(
    private categoryRepository: CategoryRepository,
    private auditPort: AuditPort,
    private sessionPort: SessionPort,
  ) {}

  async execute(request: UpdateCategoryRequest, sessionRequest?: Request) {
    // 1. Authenticate
    const user = sessionRequest
      ? await this.sessionPort.getSessionUser(sessionRequest)
      : null
    if (!user) {
      throw new ValidationError('No autenticado')
    }

    // 2. Validate
    if (!request.id) {
      throw new ValidationError('ID de la categoría es requerido')
    }

    // 3. Find existing category
    const existing = await this.categoryRepository.findById(request.id)
    if (!existing) {
      throw new EntityNotFoundError('Categoría', request.id)
    }

    // 4. Build update data
    const updateData: Record<string, unknown> = {}
    if (request.name !== undefined) updateData.name = request.name
    if (request.description !== undefined) updateData.description = request.description
    if (request.type !== undefined) updateData.type = request.type
    if (request.active !== undefined) updateData.active = request.active

    // 5. Persist update
    const updated = await this.categoryRepository.update(request.id, updateData)

    // 6. Log audit trail
    await this.auditPort.log({
      userId: user.id,
      userName: user.name,
      action: 'UPDATE',
      entity: 'category',
      entityId: request.id,
      details: `Categoría actualizada: ${request.name || existing.name}`,
    })

    // 7. Return result
    return updated
  }
}
