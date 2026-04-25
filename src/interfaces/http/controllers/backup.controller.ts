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

export class BackupController {
  /**
   * GET /api/backup - Download backup file
   * Query params: format=json|sqlite, filename=xxx
   */
  static async download(request: NextRequest) {
    try {
      const user = await cookieSession.getSessionUser(request)
      if (!user) {
        throw new AuthenticationError('No autenticado')
      }
      if (user.role !== 'admin' && user.role !== 'owner') {
        throw new AuthorizationError('Solo administradores pueden descargar backups')
      }

      const { searchParams } = new URL(request.url)
      const format = searchParams.get('format') || 'json'
      const filename = searchParams.get('filename')

      // If filename provided, download that specific backup file
      if (filename) {
        const buffer = await backupService.getJsonBackupBuffer(filename)
        await auditAdapter.log({
          userId: user.id,
          userName: user.name,
          action: 'BACKUP',
          entity: 'backup',
          details: `Descarga de backup: ${filename}`,
        })
        const isJson = filename.endsWith('.json')
        return ResponsePresenter.binary(
          buffer,
          isJson ? 'application/json' : 'application/x-sqlite3',
          filename,
        )
      }

      // Otherwise, create and download a fresh backup
      if (format === 'sqlite') {
        const buffer = await backupService.getDatabaseBuffer()
        const dateStr = new Date().toISOString().split('T')[0]
        await auditAdapter.log({
          userId: user.id,
          userName: user.name,
          action: 'BACKUP',
          entity: 'backup',
          details: `Descarga de backup SQLite - ${buffer.length} bytes`,
        })
        return ResponsePresenter.binary(
          buffer,
          'application/x-sqlite3',
          `TallerTech_backup_${dateStr}.db`,
        )
      }

      // JSON format - create and download
      const result = await backupService.createJsonBackup()
      const buffer = await backupService.getJsonBackupBuffer(result.filename)
      await auditAdapter.log({
        userId: user.id,
        userName: user.name,
        action: 'BACKUP',
        entity: 'backup',
        details: `Descarga de backup JSON - ${result.filename}`,
      })
      return ResponsePresenter.binary(
        buffer,
        'application/json',
        result.filename,
      )
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }

  /**
   * POST /api/backup - Create a new backup (returns metadata)
   * Body: { format: 'json'|'sqlite', description?: string }
   */
  static async create(request: NextRequest) {
    try {
      const user = await cookieSession.getSessionUser(request)
      if (!user) {
        throw new AuthenticationError('No autenticado')
      }
      if (user.role !== 'admin' && user.role !== 'owner') {
        throw new AuthorizationError('Solo administradores pueden crear backups')
      }

      const body = await request.json()
      const format = body.format || 'json'
      const description = body.description

      let result
      if (format === 'json') {
        result = await backupService.createJsonBackup(description)
      } else {
        result = await backupService.createSqliteBackup(description)
      }

      await auditAdapter.log({
        userId: user.id,
        userName: user.name,
        action: 'BACKUP',
        entity: 'backup',
        details: `Backup ${format.toUpperCase()} creado: ${result.filename}`,
      })

      return ResponsePresenter.success({
        ...result,
        format,
        message: `Backup ${format.toUpperCase()} creado exitosamente`,
      })
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }

  /**
   * POST /api/backup/restore - Restore database from backup
   * Multipart form: file (SQLite) OR JSON body with backup data
   */
  static async restore(request: NextRequest) {
    try {
      const user = await cookieSession.getSessionUser(request)
      if (!user) {
        throw new AuthenticationError('No autenticado')
      }
      if (user.role !== 'admin' && user.role !== 'owner') {
        throw new AuthorizationError('Solo administradores pueden restaurar backups')
      }

      const contentType = request.headers.get('content-type') || ''

      let result

      if (contentType.includes('multipart/form-data')) {
        // SQLite file upload
        const formData = await request.formData()
        const file = formData.get('file') as File | null
        if (!file) {
          throw new ValidationError('No se proporcionó archivo')
        }

        if (file.name.endsWith('.json')) {
          // JSON file upload - parse and restore
          const text = await file.text()
          const backupData = JSON.parse(text)
          result = await backupService.restoreFromJsonBackup(backupData)
        } else {
          // SQLite file upload
          const buffer = Buffer.from(await file.arrayBuffer())
          result = await backupService.restoreFromBuffer(buffer)
        }
      } else {
        // JSON body with backup data
        const backupData = await request.json()
        result = await backupService.restoreFromJsonBackup(backupData)
      }

      await auditAdapter.log({
        userId: user.id,
        userName: user.name,
        action: 'RESTORE',
        entity: 'backup',
        details: result.success
          ? 'Restauración exitosa'
          : `Restauración fallida: ${result.message}`,
      })

      return ResponsePresenter.success(result)
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }

  /**
   * GET /api/backup/stats - Get database stats and backup history
   */
  static async stats(request: NextRequest) {
    try {
      const [statsResult, backupsResult] = await Promise.all([
        useCases.getBackupStats.execute(request),
        useCases.listBackups.execute(request),
      ])
      return ResponsePresenter.success({ ...statsResult, backups: backupsResult })
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }

  /**
   * DELETE /api/backup - Delete a backup file
   * Body: { filename: string }
   */
  static async deleteBackup(request: NextRequest) {
    try {
      const user = await cookieSession.getSessionUser(request)
      if (!user) {
        throw new AuthenticationError('No autenticado')
      }
      if (user.role !== 'admin' && user.role !== 'owner') {
        throw new AuthorizationError('Solo administradores pueden eliminar backups')
      }

      const body = await request.json()
      const { filename } = body
      if (!filename) {
        throw new ValidationError('Nombre de archivo requerido')
      }

      await backupService.deleteBackup(filename)

      await auditAdapter.log({
        userId: user.id,
        userName: user.name,
        action: 'DELETE',
        entity: 'backup',
        details: `Backup eliminado: ${filename}`,
      })

      return ResponsePresenter.success({ message: 'Backup eliminado exitosamente' })
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }
}
