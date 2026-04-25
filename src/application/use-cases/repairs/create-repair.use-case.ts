// ============================================================
// Create Repair Use Case
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { RepairRepository, CustomerRepository } from '@/domain/repositories'
import type { AuditPort, SessionPort, CodeGeneratorPort } from '@/application/ports'
import type { CreateRepairRequest } from '@/application/dtos'
import { EntityNotFoundError, ValidationError } from '@/domain/errors'

export class CreateRepairUseCase {
  constructor(
    private repairRepository: RepairRepository,
    private customerRepository: CustomerRepository,
    private auditPort: AuditPort,
    private sessionPort: SessionPort,
    private codeGeneratorPort: CodeGeneratorPort,
  ) {}

  async execute(request: CreateRepairRequest, sessionRequest?: Request) {
    // 1. Authenticate
    const user = sessionRequest
      ? await this.sessionPort.getSessionUser(sessionRequest)
      : null
    if (!user) {
      throw new ValidationError('No autenticado')
    }

    // 2. Validate required fields
    if (!request.customerId) {
      throw new ValidationError('El cliente es requerido')
    }
    if (!request.device) {
      throw new ValidationError('El dispositivo es requerido')
    }
    if (!request.issue) {
      throw new ValidationError('El problema es requerido')
    }

    // 3. Validate customer exists
    const customer = await this.customerRepository.findById(request.customerId)
    if (!customer) {
      throw new EntityNotFoundError('Cliente', request.customerId)
    }

    // 4. Generate repair code
    const code = this.codeGeneratorPort.generateRepairCode()

    // 5. Create repair order
    const repair = await this.repairRepository.create({
      code,
      customerId: request.customerId,
      userId: user.id,
      userName: user.name,
      device: request.device,
      brand: request.brand || null,
      imei: request.imei || null,
      issue: request.issue,
      diagnosis: request.diagnosis || null,
      priority: request.priority || 'normal',
      costEstimate: request.costEstimate || 0,
      estimatedReady: request.estimatedReady ? new Date(request.estimatedReady) : null,
      notes: request.notes || null,
    } as Omit<import('@/domain/entities').RepairOrder, 'id' | 'createdAt' | 'updatedAt'>)

    // 6. Log audit trail
    await this.auditPort.log({
      userId: user.id,
      userName: user.name,
      action: 'CREATE',
      entity: 'repair',
      entityId: repair.id,
      details: `Reparación creada: ${code} - ${request.device}`,
    })

    // 7. Return result
    return repair
  }
}
