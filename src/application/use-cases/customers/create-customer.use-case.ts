// ============================================================
// Create Customer Use Case
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { CustomerRepository } from '@/domain/repositories'
import type { AuditPort, SessionPort } from '@/application/ports'
import type { CreateCustomerRequest } from '@/application/dtos'
import { ValidationError } from '@/domain/errors'
import type { Customer } from '@/domain/entities'

export class CreateCustomerUseCase {
  constructor(
    private customerRepository: CustomerRepository,
    private auditPort: AuditPort,
    private sessionPort: SessionPort,
  ) {}

  async execute(request: CreateCustomerRequest, sessionRequest?: Request) {
    // 1. Authenticate
    const user = sessionRequest
      ? await this.sessionPort.getSessionUser(sessionRequest)
      : null
    if (!user) {
      throw new ValidationError('No autenticado')
    }

    // 2. Validate
    if (!request.name) {
      throw new ValidationError('El nombre del cliente es requerido')
    }

    // 3. Build customer data for persistence
    const customerData = {
      name: request.name,
      phone: request.phone ?? null,
      email: request.email ?? null,
      address: request.address ?? null,
      dni: request.dni ?? null,
      notes: request.notes ?? null,
    }

    // 4. Persist
    const savedCustomer = await this.customerRepository.create(
      customerData as unknown as Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>,
    )

    // 5. Log audit trail
    await this.auditPort.log({
      userId: user.id,
      userName: user.name,
      action: 'CREATE',
      entity: 'customer',
      entityId: savedCustomer.id,
      details: `Cliente creado: ${request.name}`,
    })

    // 6. Return result
    return savedCustomer
  }
}
