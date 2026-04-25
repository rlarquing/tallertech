// ============================================================
// List Backups Use Case
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { SessionPort, BackupPort } from '@/application/ports'
import type { BackupRecordDTO } from '@/application/dtos'
import { ValidationError } from '@/domain/errors'

export class ListBackupsUseCase {
  constructor(
    private backupPort: BackupPort,
    private sessionPort: SessionPort,
  ) {}

  async execute(sessionRequest?: Request): Promise<BackupRecordDTO[]> {
    // 1. Authenticate
    const user = sessionRequest
      ? await this.sessionPort.getSessionUser(sessionRequest)
      : null
    if (!user) {
      throw new ValidationError('No autenticado')
    }

    // 2. Get backup history from filesystem
    const history = await this.backupPort.getBackupHistory()

    // 3. Return as DTOs
    return history.map((record) => ({
      id: record.id,
      filename: record.filename,
      format: record.format,
      description: record.description,
      size: record.size,
      checksum: record.checksum,
      stats: record.stats,
      createdAt: record.createdAt,
    }))
  }
}
