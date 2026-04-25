// ============================================================
// Restore Backup Use Case
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { AuditPort, SessionPort, BackupPort } from '@/application/ports'
import { ValidationError, AuthorizationError } from '@/domain/errors'

export class RestoreBackupUseCase {
  constructor(
    private backupPort: BackupPort,
    private auditPort: AuditPort,
    private sessionPort: SessionPort,
  ) {}

  async execute(sessionRequest: Request, backupData: any): Promise<{
    success: boolean
    message: string
    stats?: Record<string, number>
  }> {
    // 1. Authenticate & authorize
    const user = await this.sessionPort.getSessionUser(sessionRequest)
    if (!user) {
      throw new ValidationError('No autenticado')
    }
    if (user.role !== 'admin' && user.role !== 'owner') {
      throw new AuthorizationError('Solo administradores pueden restaurar backups')
    }

    // 2. Validate backup data exists
    if (!backupData) {
      throw new ValidationError('No se proporcionaron datos de backup')
    }

    // 3. Restore
    const result = await this.backupPort.restoreFromJsonBackup(backupData)

    // 4. Log audit trail
    await this.auditPort.log({
      userId: user.id,
      userName: user.name,
      action: 'RESTORE',
      entity: 'backup',
      details: result.success
        ? `Restauración exitosa`
        : `Restauración fallida: ${result.message}`,
    })

    return result
  }
}
