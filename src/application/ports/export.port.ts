// ============================================================
// Export Port - Interface for data export operations
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { ExportOptions } from '@/domain/entities'

export interface ExportPort {
  exportData(options: ExportOptions, data: unknown[]): Promise<Buffer>
}
