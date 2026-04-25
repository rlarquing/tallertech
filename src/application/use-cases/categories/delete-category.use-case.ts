// ============================================================
// Delete Category Use Case - Soft delete (deactivate)
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { CategoryRepository } from '@/domain/repositories'
import type { AuditPort, SessionPort } from '@/application/ports'
import { EntityNotFoundError, ValidationError } from '@/domain/errors'

export class DeleteCategoryUseCase {
  constructor(
    private categoryRepository: CategoryRepository,
    private auditPort: AuditPort,
    private sessionPort: SessionPort,
  ) {}

  async execute(id: string, sessionRequest?: Request) {
    // 1. Authenticate
    const user = sessionRequest
      ? await this.sessionPort.getSessionUser(sessionRequest)
      : null
    if (!user) {
      throw new ValidationError('No autenticado')
    }

    // 2. Find existing category
    const existing = await this.categoryRepository.findById(id)
    if (!existing) {
      throw new EntityNotFoundError('Categoría', id)
    }

    // 3. Soft delete (deactivate)
    const deactivated = await this.categoryRepository.update(id, { active: false })

    // 4. Log audit trail
    await this.auditPort.log({
      userId: user.id,
      userName: user.name,
      action: 'DELETE',
      entity: 'category',
      entityId: id,
      details: `Categoría desactivada: ${existing.name}`,
    })

    // 5. Return result
    return deactivated
  }
}
