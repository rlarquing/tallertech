// ============================================================
// Create Backup Use Case
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { AuditPort, SessionPort, BackupPort } from '@/application/ports'
import { AuthenticationError, ValidationError, AuthorizationError } from '@/domain/errors'

export class CreateBackupUseCase {
  constructor(
    private backupPort: BackupPort,
    private auditPort: AuditPort,
    private sessionPort: SessionPort,
  ) {}

  async execute(
    sessionRequest: Request,
    format: 'json' | 'sqlite' = 'json',
    description?: string,
  ) {
    // 1. Authenticate & authorize
    const user = await this.sessionPort.getSessionUser(sessionRequest)
    if (!user) {
      throw new AuthenticationError('No autenticado')
    }
    if (user.role !== 'admin' && user.role !== 'owner') {
      throw new AuthorizationError('Solo administradores pueden crear backups')
    }

    // 2. Create backup
    let result
    if (format === 'json') {
      result = await this.backupPort.createJsonBackup(description)
    } else {
      const path = await this.backupPort.createBackup(description)
      result = { path, format: 'sqlite' }
    }

    // 3. Log audit trail
    await this.auditPort.log({
      userId: user.id,
      userName: user.name,
      action: 'BACKUP',
      entity: 'backup',
      details: `Backup ${format.toUpperCase()} creado${description ? `: ${description}` : ''}`,
    })

    // 4. Return result
    return {
      ...result,
      format,
      message: `Backup ${format.toUpperCase()} creado exitosamente`,
    }
  }
}
