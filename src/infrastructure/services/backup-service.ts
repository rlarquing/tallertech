// ============================================================
// Backup Service Infrastructure - Database backup and restore
// Clean Architecture: Infrastructure Layer - Services
//
// Supports two modes:
// 1. Local SQLite: File-based backup/restore (copy DB file)
// 2. Turso (libSQL): JSON-based backup/restore (export/import data)
// ============================================================

import { readFile, writeFile, copyFile, mkdir, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { prisma } from '../persistence/prisma/prisma-client'

const DB_PATH = path.join(process.cwd(), 'db', 'custom.db')
const BACKUP_DIR = path.join(process.cwd(), 'db', 'backups')

/**
 * Check if we're running with Turso (remote database)
 */
function isTursoMode(): boolean {
  return !!process.env.TURSO_DATABASE_URL
}

export class BackupService {
  /**
   * Create a database backup
   * - Local SQLite: copies the .db file
   * - Turso: exports all data as JSON
   */
  async createBackup(description?: string): Promise<{
    filename: string
    size: number
    path: string
  }> {
    if (isTursoMode()) {
      return this.createJsonBackup(description)
    }
    return this.createFileBackup(description)
  }

  /**
   * Restore database from a backup
   * - Local SQLite: copies the backup .db file over the current database
   * - Turso: imports JSON data into the database
   */
  async restoreBackup(backupFilePath: string): Promise<{
    success: boolean
    message: string
  }> {
    if (isTursoMode()) {
      return this.restoreJsonBackup(backupFilePath)
    }
    return this.restoreFileBackup(backupFilePath)
  }

  /**
   * Restore from uploaded backup buffer
   */
  async restoreFromBuffer(buffer: Buffer): Promise<{
    success: boolean
    message: string
  }> {
    if (isTursoMode()) {
      try {
        const jsonData = JSON.parse(buffer.toString())
        return this.importJsonData(jsonData)
      } catch (error) {
        return {
          success: false,
          message: `Error al parsear backup JSON: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        }
      }
    }
    return this.restoreFileFromBuffer(buffer)
  }

  /**
   * Get the raw database file buffer for download
   * - Local SQLite: reads the .db file
   * - Turso: exports all data as JSON buffer
   */
  async getDatabaseBuffer(): Promise<Buffer> {
    if (isTursoMode()) {
      const data = await this.exportAllData()
      return Buffer.from(JSON.stringify(data, null, 2))
    }
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
    if (!isTursoMode()) {
      const backupPath = path.join(BACKUP_DIR, filename)
      if (existsSync(backupPath)) {
        await unlink(backupPath)
      }
    }
    // Remove from settings
    const key = `backup_${filename.replace('tallertech_backup_', '').replace(/\.(db|json)$/, '')}`
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
    const tables = [
      { name: 'users', count: await prisma.user.count() },
      { name: 'workshops', count: await prisma.workshop.count() },
      { name: 'workshopUsers', count: await prisma.workshopUser.count() },
      { name: 'products', count: await prisma.product.count() },
      { name: 'categories', count: await prisma.category.count() },
      { name: 'suppliers', count: await prisma.supplier.count() },
      { name: 'customers', count: await prisma.customer.count() },
      { name: 'sales', count: await prisma.sale.count() },
      { name: 'saleItems', count: await prisma.saleItem.count() },
      { name: 'repairOrders', count: await prisma.repairOrder.count() },
      { name: 'repairParts', count: await prisma.repairPart.count() },
      { name: 'expenses', count: await prisma.expense.count() },
      { name: 'auditLogs', count: await prisma.auditLog.count() },
      { name: 'stockMovements', count: await prisma.stockMovement.count() },
      { name: 'settings', count: await prisma.setting.count() },
    ]

    let fileSize = 0
    if (!isTursoMode() && existsSync(DB_PATH)) {
      const buffer = await readFile(DB_PATH)
      fileSize = buffer.length
    } else {
      // Estimate size from JSON export
      const data = await this.exportAllData()
      fileSize = Buffer.byteLength(JSON.stringify(data))
    }

    return { fileSize, tables }
  }

  // ─── Private: Local SQLite methods ──────────────────────────────

  private async createFileBackup(description?: string): Promise<{
    filename: string
    size: number
    path: string
  }> {
    if (!existsSync(BACKUP_DIR)) {
      await mkdir(BACKUP_DIR, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `tallertech_backup_${timestamp}.db`
    const backupPath = path.join(BACKUP_DIR, filename)

    await copyFile(DB_PATH, backupPath)

    const stat = await readFile(backupPath).then((buf) => buf.length)

    await this.recordBackupInSettings(filename, stat, description || 'Backup manual')

    return { filename, size: stat, path: backupPath }
  }

  private async restoreFileBackup(backupFilePath: string): Promise<{
    success: boolean
    message: string
  }> {
    if (!existsSync(backupFilePath)) {
      return { success: false, message: 'Archivo de backup no encontrado' }
    }

    try {
      const safetyBackup = await this.createFileBackup('Auto-backup antes de restauración')
      await prisma.$disconnect()
      await copyFile(backupFilePath, DB_PATH)
      await prisma.$connect()

      return {
        success: true,
        message: `Base de datos restaurada exitosamente. Backup de seguridad: ${safetyBackup.filename}`,
      }
    } catch (error) {
      try { await prisma.$connect() } catch { /* ignore */ }
      return {
        success: false,
        message: `Error al restaurar: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      }
    }
  }

  private async restoreFileFromBuffer(buffer: Buffer): Promise<{
    success: boolean
    message: string
  }> {
    try {
      const safetyBackup = await this.createFileBackup('Auto-backup antes de restauración')
      await prisma.$disconnect()
      await writeFile(DB_PATH, buffer)
      await prisma.$connect()

      return {
        success: true,
        message: `Base de datos restaurada exitosamente. Backup de seguridad: ${safetyBackup.filename}`,
      }
    } catch (error) {
      try { await prisma.$connect() } catch { /* ignore */ }
      return {
        success: false,
        message: `Error al restaurar: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      }
    }
  }

  // ─── Private: Turso JSON methods ────────────────────────────────

  private async createJsonBackup(description?: string): Promise<{
    filename: string
    size: number
    path: string
  }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `tallertech_backup_${timestamp}.json`

    const data = await this.exportAllData()
    const jsonStr = JSON.stringify(data, null, 2)
    const size = Buffer.byteLength(jsonStr)

    await this.recordBackupInSettings(filename, size, description || 'Backup manual (Turso)')

    return { filename, size, path: `json://${filename}` }
  }

  private async restoreJsonBackup(backupFilePath: string): Promise<{
    success: boolean
    message: string
  }> {
    // For Turso, backup files are stored in the database as settings metadata
    // The actual data needs to be re-imported
    return {
      success: false,
      message: 'Para restaurar en Turso, suba el archivo JSON de backup.',
    }
  }

  /**
   * Export all data from the database as a structured JSON object
   */
  private async exportAllData(): Promise<Record<string, unknown[]>> {
    const [
      users, workshops, workshopUsers, categories, suppliers,
      products, customers, sales, saleItems, repairOrders,
      repairParts, stockMovements, expenses, settings, auditLogs,
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.workshop.findMany(),
      prisma.workshopUser.findMany(),
      prisma.category.findMany(),
      prisma.supplier.findMany(),
      prisma.product.findMany(),
      prisma.customer.findMany(),
      prisma.sale.findMany(),
      prisma.saleItem.findMany(),
      prisma.repairOrder.findMany(),
      prisma.repairPart.findMany(),
      prisma.stockMovement.findMany(),
      prisma.expense.findMany(),
      prisma.setting.findMany(),
      prisma.auditLog.findMany(),
    ])

    return {
      _meta: [{
        version: '1.0',
        exportedAt: new Date().toISOString(),
        engine: isTursoMode() ? 'turso' : 'sqlite',
      }],
      users,
      workshops,
      workshopUsers,
      categories,
      suppliers,
      products,
      customers,
      sales,
      saleItems,
      repairOrders,
      repairParts,
      stockMovements,
      expenses,
      settings,
      auditLogs,
    }
  }

  /**
   * Import data from a JSON backup into the database
   */
  private async importJsonData(data: Record<string, unknown[]>): Promise<{
    success: boolean
    message: string
  }> {
    try {
      // Create a safety backup before restoring
      await this.createJsonBackup('Auto-backup antes de restauración')

      // Delete all existing data in correct order (respecting foreign keys)
      await prisma.$transaction([
        prisma.stockMovement.deleteMany(),
        prisma.repairPart.deleteMany(),
        prisma.repairOrder.deleteMany(),
        prisma.saleItem.deleteMany(),
        prisma.sale.deleteMany(),
        prisma.expense.deleteMany(),
        prisma.customer.deleteMany(),
        prisma.product.deleteMany(),
        prisma.category.deleteMany(),
        prisma.supplier.deleteMany(),
        prisma.setting.deleteMany(),
        prisma.auditLog.deleteMany(),
        prisma.workshopUser.deleteMany(),
        prisma.workshop.deleteMany(),
        prisma.user.deleteMany(),
      ])

      // Import data in correct order (respecting foreign keys)
      if (data.users?.length) {
        await prisma.user.createMany({ data: data.users as Record<string, unknown>[] as any })
      }
      if (data.workshops?.length) {
        await prisma.workshop.createMany({ data: data.workshops as Record<string, unknown>[] as any })
      }
      if (data.workshopUsers?.length) {
        await prisma.workshopUser.createMany({ data: data.workshopUsers as Record<string, unknown>[] as any })
      }
      if (data.categories?.length) {
        await prisma.category.createMany({ data: data.categories as Record<string, unknown>[] as any })
      }
      if (data.suppliers?.length) {
        await prisma.supplier.createMany({ data: data.suppliers as Record<string, unknown>[] as any })
      }
      if (data.products?.length) {
        await prisma.product.createMany({ data: data.products as Record<string, unknown>[] as any })
      }
      if (data.customers?.length) {
        await prisma.customer.createMany({ data: data.customers as Record<string, unknown>[] as any })
      }
      if (data.sales?.length) {
        await prisma.sale.createMany({ data: data.sales as Record<string, unknown>[] as any })
      }
      if (data.saleItems?.length) {
        await prisma.saleItem.createMany({ data: data.saleItems as Record<string, unknown>[] as any })
      }
      if (data.repairOrders?.length) {
        await prisma.repairOrder.createMany({ data: data.repairOrders as Record<string, unknown>[] as any })
      }
      if (data.repairParts?.length) {
        await prisma.repairPart.createMany({ data: data.repairParts as Record<string, unknown>[] as any })
      }
      if (data.stockMovements?.length) {
        await prisma.stockMovement.createMany({ data: data.stockMovements as Record<string, unknown>[] as any })
      }
      if (data.expenses?.length) {
        await prisma.expense.createMany({ data: data.expenses as Record<string, unknown>[] as any })
      }
      if (data.settings?.length) {
        await prisma.setting.createMany({ data: data.settings as Record<string, unknown>[] as any })
      }
      if (data.auditLogs?.length) {
        await prisma.auditLog.createMany({ data: data.auditLogs as Record<string, unknown>[] as any })
      }

      return {
        success: true,
        message: 'Base de datos restaurada exitosamente desde JSON.',
      }
    } catch (error) {
      return {
        success: false,
        message: `Error al restaurar: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      }
    }
  }

  /**
   * Record a backup in the settings table
   */
  private async recordBackupInSettings(filename: string, size: number, description: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const key = `backup_${timestamp}`

    // Find any workshop to use as the workshopId (settings require it)
    const firstWorkshop = await prisma.workshop.findFirst()

    await prisma.setting.upsert({
      where: {
        workshopId_key: {
          workshopId: firstWorkshop?.id || 'system',
          key,
        },
      },
      create: {
        workshopId: firstWorkshop?.id || 'system',
        key,
        value: JSON.stringify({
          filename,
          size,
          description,
          createdAt: new Date().toISOString(),
        }),
      },
      update: {
        value: JSON.stringify({
          filename,
          size,
          description,
          createdAt: new Date().toISOString(),
        }),
      },
    })
  }
}

export const backupService = new BackupService()
