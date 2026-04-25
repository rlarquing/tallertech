// ============================================================
// Export Data Use Case - Delegate to ExportPort
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { AuditPort, SessionPort, ExportPort } from '@/application/ports'
import type { ExportRequest } from '@/application/dtos'
import type { ExportOptions } from '@/domain/entities'
import { ValidationError } from '@/domain/errors'

export class ExportDataUseCase {
  constructor(
    private exportPort: ExportPort,
    private auditPort: AuditPort,
    private sessionPort: SessionPort,
  ) {}

  async execute(request: ExportRequest, sessionRequest?: Request): Promise<Buffer> {
    // 1. Authenticate
    const user = sessionRequest
      ? await this.sessionPort.getSessionUser(sessionRequest)
      : null
    if (!user) {
      throw new ValidationError('No autenticado')
    }

    // 2. Validate
    if (!request.format) {
      throw new ValidationError('El formato de exportación es requerido')
    }
    if (!request.entity) {
      throw new ValidationError('La entidad a exportar es requerida')
    }

    // 3. Build export options
    const options: ExportOptions = {
      format: request.format,
      entity: request.entity,
      dateFrom: request.dateFrom,
      dateTo: request.dateTo,
      filters: request.filters,
    }

    // 4. Delegate to export port (data fetching is handled by the port implementation)
    const buffer = await this.exportPort.exportData(options, [])

    // 5. Log audit trail
    await this.auditPort.log({
      userId: user.id,
      userName: user.name,
      action: 'EXPORT',
      entity: request.entity,
      details: `Datos exportados: ${request.entity} en formato ${request.format}`,
    })

    // 6. Return buffer
    return buffer
  }
}
