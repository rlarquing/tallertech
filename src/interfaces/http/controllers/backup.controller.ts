// ============================================================
// Backup Controller - HTTP adapter for backup endpoints
// Clean Architecture: Interface Adapters Layer
// ============================================================

import { NextRequest } from 'next/server'
import '@/infrastructure/container'
import { UseCaseContainer } from '@/application/container'
import { ResponsePresenter } from '../presenters/response.presenter'
import { BackupService } from '@/infrastructure/services/backup-service'
import { AuditAdapter } from '@/infrastructure/adapters/audit-adapter'
import { CookieSession } from '@/infrastructure/auth/cookie-session'
import { AuthorizationError, AuthenticationError, ValidationError } from '@/domain/errors'

const useCases = UseCaseContainer.getInstance()
const backupService = new BackupService()
const auditAdapter = new AuditAdapter()
const cookieSession = new CookieSession()

function isTursoMode(): boolean {
  const url = process.env.DATABASE_URL || ''
  return url.startsWith('libsql://') || url.startsWith('https://')
}

export class BackupController {
  static async download(request: NextRequest) {
    try {
      const user = await cookieSession.getSessionUser(request)
      if (!user) {
        throw new AuthenticationError('No autenticado')
      }
      if (user.role !== 'admin' && user.role !== 'owner') {
        throw new AuthorizationError('Solo administradores pueden descargar backups')
      }

      const buffer = await backupService.getDatabaseBuffer()
      const dateStr = new Date().toISOString().split('T')[0]

      await auditAdapter.log({
        userId: user.id,
        userName: user.name,
        action: 'BACKUP',
        entity: 'backup',
        details: `Descarga de backup - ${buffer.length} bytes`,
      })

      // In Turso mode, download as JSON; in SQLite mode, download as .db file
      if (isTursoMode()) {
        return ResponsePresenter.binary(
          buffer,
          'application/json',
          `TallerTech_backup_${dateStr}.json`,
        )
      }

      return ResponsePresenter.binary(
        buffer,
        'application/x-sqlite3',
        `TallerTech_backup_${dateStr}.db`,
      )
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }

  static async restore(request: NextRequest) {
    try {
      const user = await cookieSession.getSessionUser(request)
      if (!user) {
        throw new AuthenticationError('No autenticado')
      }
      if (user.role !== 'admin' && user.role !== 'owner') {
        throw new AuthorizationError('Solo administradores pueden restaurar backups')
      }

      const formData = await request.formData()
      const file = formData.get('file') as File | null

      if (!file) {
        throw new ValidationError('No se proporcionó archivo')
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      const result = await backupService.restoreFromBuffer(buffer)

      await auditAdapter.log({
        userId: user.id,
        userName: user.name,
        action: 'RESTORE',
        entity: 'backup',
        details: result.success
          ? `Restauración exitosa desde archivo: ${file.name}`
          : `Restauración fallida: ${result.message}`,
      })

      return ResponsePresenter.success(result)
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }

  static async stats(request: NextRequest) {
    try {
      const statsResult = await useCases.getBackupStats.execute(request)
      const backupsResult = await useCases.listBackups.execute(request)
      return ResponsePresenter.success({
        ...statsResult,
        backups: backupsResult,
        engine: isTursoMode() ? 'turso' : 'sqlite',
      })
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }
}
