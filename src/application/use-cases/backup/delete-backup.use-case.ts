// ============================================================
// Delete Backup Use Case
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { AuditPort, SessionPort, BackupPort } from '@/application/ports'
import { ValidationError, AuthorizationError } from '@/domain/errors'

export class DeleteBackupUseCase {
  constructor(
    private backupPort: BackupPort,
    private auditPort: AuditPort,
    private sessionPort: SessionPort,
  ) {}

  async execute(sessionRequest: Request, filename: string): Promise<boolean> {
    // 1. Authenticate & authorize
    const user = await this.sessionPort.getSessionUser(sessionRequest)
    if (!user) {
      throw new ValidationError('No autenticado')
    }
    if (user.role !== 'admin' && user.role !== 'owner') {
      throw new AuthorizationError('Solo administradores pueden eliminar backups')
    }

    // 2. Delete backup
    const result = await this.backupPort.deleteBackup(filename)

    // 3. Log audit trail
    await this.auditPort.log({
      userId: user.id,
      userName: user.name,
      action: 'DELETE',
      entity: 'backup',
      details: `Backup eliminado: ${filename}`,
    })

    return result
  }
}
