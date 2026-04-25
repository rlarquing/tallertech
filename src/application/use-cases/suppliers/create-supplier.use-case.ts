// ============================================================
// Create Supplier Use Case
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { SupplierRepository } from '@/domain/repositories'
import type { AuditPort, SessionPort } from '@/application/ports'
import type { CreateSupplierRequest } from '@/application/dtos'
import { ValidationError } from '@/domain/errors'
import type { Supplier } from '@/domain/entities'

export class CreateSupplierUseCase {
  constructor(
    private supplierRepository: SupplierRepository,
    private auditPort: AuditPort,
    private sessionPort: SessionPort,
  ) {}

  async execute(request: CreateSupplierRequest, sessionRequest?: Request) {
    // 1. Authenticate
    const user = sessionRequest
      ? await this.sessionPort.getSessionUser(sessionRequest)
      : null
    if (!user) {
      throw new ValidationError('No autenticado')
    }

    // 2. Validate
    if (!request.name) {
      throw new ValidationError('El nombre del proveedor es requerido')
    }

    // 3. Build supplier data for persistence
    const supplierData = {
      name: request.name,
      phone: request.phone ?? null,
      email: request.email ?? null,
      address: request.address ?? null,
      notes: request.notes ?? null,
    }

    // 4. Persist
    const savedSupplier = await this.supplierRepository.create(
      supplierData as unknown as Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>,
    )

    // 5. Log audit trail
    await this.auditPort.log({
      userId: user.id,
      userName: user.name,
      action: 'CREATE',
      entity: 'supplier',
      entityId: savedSupplier.id,
      details: `Proveedor creado: ${request.name}`,
    })

    // 6. Return result
    return savedSupplier
  }
}
