// ============================================================
// Get Backup Stats Use Case - Get database statistics
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { SessionPort, BackupPort } from '@/application/ports'
import type { BackupStatsResponse } from '@/application/dtos'
import { ValidationError } from '@/domain/errors'

export class GetBackupStatsUseCase {
  constructor(
    private backupPort: BackupPort,
    private sessionPort: SessionPort,
  ) {}

  async execute(sessionRequest?: Request): Promise<BackupStatsResponse> {
    // 1. Authenticate
    const user = sessionRequest
      ? await this.sessionPort.getSessionUser(sessionRequest)
      : null
    if (!user) {
      throw new ValidationError('No autenticado')
    }

    // 2. Get database stats
    const stats = await this.backupPort.getDatabaseStats()

    // 3. Return result
    return stats
  }
}
