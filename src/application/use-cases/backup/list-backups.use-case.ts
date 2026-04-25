// ============================================================
// List Backups Use Case
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { SessionPort, BackupPort } from '@/application/ports'
import type { BackupListResponse } from '@/application/dtos'
import { ValidationError } from '@/domain/errors'

export class ListBackupsUseCase {
  constructor(
    private backupPort: BackupPort,
    private sessionPort: SessionPort,
  ) {}

  async execute(sessionRequest?: Request): Promise<BackupListResponse[]> {
    // 1. Authenticate
    const user = sessionRequest
      ? await this.sessionPort.getSessionUser(sessionRequest)
      : null
    if (!user) {
      throw new ValidationError('No autenticado')
    }

    // 2. List backups
    const backups = await this.backupPort.listBackups()

    // 3. Return result
    return backups
  }
}
