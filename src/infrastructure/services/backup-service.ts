// ============================================================
// Backup Service Infrastructure - Database backup and restore
// Clean Architecture: Infrastructure Layer - Services
// ============================================================

import { readFile, writeFile, copyFile, mkdir, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { prisma } from '../persistence/prisma/prisma-client'

const DB_PATH = path.join(process.cwd(), 'db', 'custom.db')
const BACKUP_DIR = path.join(process.cwd(), 'db', 'backups')

export class BackupService {
  /**
   * Create a database backup
   */
  async createBackup(description?: string): Promise<{
    filename: string
    size: number
    path: string
  }> {
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
    await prisma.setting.upsert({
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
  async restoreBackup(backupFilePath: string): Promise<{
    success: boolean
    message: string
  }> {
    if (!existsSync(backupFilePath)) {
      return { success: false, message: 'Archivo de backup no encontrado' }
    }

    try {
      // Create a safety backup before restoring
      const safetyBackup = await this.createBackup(
        'Auto-backup antes de restauración'
      )

      // Close Prisma connection
      await prisma.$disconnect()

      // Copy backup file over the current database
      await copyFile(backupFilePath, DB_PATH)

      // Reconnect
      await prisma.$connect()

      return {
        success: true,
        message: `Base de datos restaurada exitosamente. Backup de seguridad creado: ${safetyBackup.filename}`,
      }
    } catch (error) {
      // Try to reconnect
      try {
        await prisma.$connect()
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
  async restoreFromBuffer(buffer: Buffer): Promise<{
    success: boolean
    message: string
  }> {
    try {
      // Create a safety backup before restoring
      const safetyBackup = await this.createBackup(
        'Auto-backup antes de restauración'
      )

      // Close Prisma connection
      await prisma.$disconnect()

      // Write the buffer as the new database
      await writeFile(DB_PATH, buffer)

      // Reconnect
      await prisma.$connect()

      return {
        success: true,
        message: `Base de datos restaurada exitosamente. Backup de seguridad: ${safetyBackup.filename}`,
      }
    } catch (error) {
      try {
        await prisma.$connect()
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
  async listBackups(): Promise<
    Array<{
      filename: string
      size: number
      description: string
      createdAt: string
    }>
  > {
    const settings = await prisma.setting.findMany({
      where: { key: { startsWith: 'backup_' } },
      orderBy: { key: 'desc' },
    })

    return settings.map((s) => {
      try {
        return JSON.parse(s.value)
      } catch {
        return {
          filename: s.key,
          size: 0,
          description: 'Unknown',
          createdAt: '',
        }
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
    await prisma.setting.deleteMany({ where: { key } })
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
      { name: 'users', count: await prisma.user.count() },
      { name: 'products', count: await prisma.product.count() },
      { name: 'categories', count: await prisma.category.count() },
      { name: 'suppliers', count: await prisma.supplier.count() },
      { name: 'customers', count: await prisma.customer.count() },
      { name: 'sales', count: await prisma.sale.count() },
      { name: 'repairOrders', count: await prisma.repairOrder.count() },
      { name: 'expenses', count: await prisma.expense.count() },
      { name: 'auditLogs', count: await prisma.auditLog.count() },
      { name: 'stockMovements', count: await prisma.stockMovement.count() },
    ]

    return { fileSize: buffer.length, tables }
  }
}

export const backupService = new BackupService()
