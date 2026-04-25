// ============================================================
// Create Category Use Case
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { CategoryRepository } from '@/domain/repositories'
import type { AuditPort, SessionPort } from '@/application/ports'
import type { CreateCategoryRequest } from '@/application/dtos'
import { ValidationError } from '@/domain/errors'
import type { Category } from '@/domain/entities'

export class CreateCategoryUseCase {
  constructor(
    private categoryRepository: CategoryRepository,
    private auditPort: AuditPort,
    private sessionPort: SessionPort,
  ) {}

  async execute(request: CreateCategoryRequest, sessionRequest?: Request) {
    // 1. Authenticate
    const user = sessionRequest
      ? await this.sessionPort.getSessionUser(sessionRequest)
      : null
    if (!user) {
      throw new ValidationError('No autenticado')
    }

    // 2. Validate
    if (!request.name) {
      throw new ValidationError('El nombre de la categoría es requerido')
    }

    // 3. Build category data for persistence
    const categoryData = {
      name: request.name,
      description: request.description ?? null,
      type: (request.type || 'product') as 'product' | 'service' | 'part',
    }

    // 4. Persist
    const savedCategory = await this.categoryRepository.create(
      categoryData as unknown as Omit<Category, 'id' | 'createdAt' | 'updatedAt'>,
    )

    // 5. Log audit trail
    await this.auditPort.log({
      userId: user.id,
      userName: user.name,
      action: 'CREATE',
      entity: 'category',
      entityId: savedCategory.id,
      details: `Categoría creada: ${request.name}`,
    })

    // 6. Return result
    return savedCategory
  }
}
