// ============================================================
// Create Backup Use Case
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { AuditPort, SessionPort, BackupPort } from '@/application/ports'
import { ValidationError } from '@/domain/errors'

export class CreateBackupUseCase {
  constructor(
    private backupPort: BackupPort,
    private auditPort: AuditPort,
    private sessionPort: SessionPort,
  ) {}

  async execute(sessionRequest?: Request) {
    // 1. Authenticate
    const user = sessionRequest
      ? await this.sessionPort.getSessionUser(sessionRequest)
      : null
    if (!user) {
      throw new ValidationError('No autenticado')
    }

    // 2. Create backup
    const backupPath = await this.backupPort.createBackup()

    // 3. Log audit trail
    await this.auditPort.log({
      userId: user.id,
      userName: user.name,
      action: 'BACKUP',
      entity: 'system',
      details: `Backup creado: ${backupPath}`,
    })

    // 4. Return result
    return { path: backupPath, message: 'Backup creado exitosamente' }
  }
}
