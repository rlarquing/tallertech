// ============================================================
// Backup Service - Database backup and restore
// Clean Architecture: Application Business Rules Layer
// ============================================================

import { readFile, writeFile, copyFile, mkdir, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { db } from '@/lib/db'

const DB_PATH = path.join(process.cwd(), 'db', 'custom.db')
const BACKUP_DIR = path.join(process.cwd(), 'db', 'backups')

class BackupService {
  /**
   * Create a database backup
   */
  async createBackup(description?: string): Promise<{ filename: string; size: number; path: string }> {
    // Ensure backup directory exists
    if (!existsSync(BACKUP_DIR)) {
      await mkdir(BACKUP_DIR, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `tallertech_backup_${timestamp}.db`
    const backupPath = path.join(BACKUP_DIR, filename)

    // Copy the current database file
    await copyFile(DB_PATH, backupPath)

    // Get file size
    const stat = await readFile(backupPath).then((buf) => buf.length)

    // Record backup in database
    await db.setting.upsert({
      where: { key: `backup_${timestamp}` },
      create: {
        key: `backup_${timestamp}`,
        value: JSON.stringify({
          filename,
          size: stat,
          description: description || 'Backup manual',
          createdAt: new Date().toISOString(),
        }),
      },
      update: {
        value: JSON.stringify({
          filename,
          size: stat,
          description: description || 'Backup manual',
          createdAt: new Date().toISOString(),
        }),
      },
    })

    return { filename, size: stat, path: backupPath }
  }

  /**
   * Restore database from a backup file
   */
  async restoreBackup(backupFilePath: string): Promise<{ success: boolean; message: string }> {
    if (!existsSync(backupFilePath)) {
      return { success: false, message: 'Archivo de backup no encontrado' }
    }

    try {
      // Create a safety backup before restoring
      const safetyBackup = await this.createBackup('Auto-backup antes de restauración')

      // Close Prisma connection
      await db.$disconnect()

      // Copy backup file over the current database
      await copyFile(backupFilePath, DB_PATH)

      // Reconnect
      await db.$connect()

      return {
        success: true,
        message: `Base de datos restaurada exitosamente. Backup de seguridad creado: ${safetyBackup.filename}`,
      }
    } catch (error) {
      // Try to reconnect
      try {
        await db.$connect()
      } catch {
        // Ignore reconnection error
      }
      return {
        success: false,
        message: `Error al restaurar: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      }
    }
  }

  /**
   * Restore from uploaded backup buffer
   */
  async restoreFromBuffer(buffer: Buffer): Promise<{ success: boolean; message: string }> {
    try {
      // Create a safety backup before restoring
      const safetyBackup = await this.createBackup('Auto-backup antes de restauración')

      // Close Prisma connection
      await db.$disconnect()

      // Write the buffer as the new database
      await writeFile(DB_PATH, buffer)

      // Reconnect
      await db.$connect()

      return {
        success: true,
        message: `Base de datos restaurada exitosamente. Backup de seguridad: ${safetyBackup.filename}`,
      }
    } catch (error) {
      try {
        await db.$connect()
      } catch {
        // Ignore
      }
      return {
        success: false,
        message: `Error al restaurar: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      }
    }
  }

  /**
   * Get the raw database file buffer for download
   */
  async getDatabaseBuffer(): Promise<Buffer> {
    return readFile(DB_PATH)
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<Array<{ filename: string; size: number; description: string; createdAt: string }>> {
    const settings = await db.setting.findMany({
      where: { key: { startsWith: 'backup_' } },
      orderBy: { key: 'desc' },
    })

    return settings.map((s) => {
      try {
        return JSON.parse(s.value)
      } catch {
        return { filename: s.key, size: 0, description: 'Unknown', createdAt: '' }
      }
    })
  }

  /**
   * Delete a backup file
   */
  async deleteBackup(filename: string): Promise<boolean> {
    const backupPath = path.join(BACKUP_DIR, filename)
    if (existsSync(backupPath)) {
      await unlink(backupPath)
    }
    // Remove from settings
    const key = `backup_${filename.replace('tallertech_backup_', '').replace('.db', '')}`
    await db.setting.deleteMany({ where: { key } })
    return true
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<{
    fileSize: number
    tables: Array<{ name: string; count: number }>
  }> {
    const buffer = await readFile(DB_PATH)
    const tables = [
      { name: 'users', count: await db.user.count() },
      { name: 'products', count: await db.product.count() },
      { name: 'categories', count: await db.category.count() },
      { name: 'suppliers', count: await db.supplier.count() },
      { name: 'customers', count: await db.customer.count() },
      { name: 'sales', count: await db.sale.count() },
      { name: 'repairOrders', count: await db.repairOrder.count() },
      { name: 'expenses', count: await db.expense.count() },
      { name: 'auditLogs', count: await db.auditLog.count() },
      { name: 'stockMovements', count: await db.stockMovement.count() },
    ]

    return { fileSize: buffer.length, tables }
  }
}

export const backupService = new BackupService()
