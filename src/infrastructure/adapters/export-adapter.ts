// ============================================================
// Export Adapter - Adapts ExportService to implement ExportPort
// Clean Architecture: Infrastructure Layer - Adapters
// ============================================================

import type { ExportPort } from '@/application/ports'
import type { ExportOptions } from '@/domain/entities'
import { exportData } from '@/infrastructure/services/export-service'

export class ExportAdapter implements ExportPort {
  async exportData(options: ExportOptions, _data: unknown[]): Promise<Buffer> {
    const result = await exportData({
      format: options.format,
      entity: options.entity,
      dateFrom: options.dateFrom,
      dateTo: options.dateTo,
      filters: options.filters,
    })
    return result.buffer
  }
}
