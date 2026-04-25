// ============================================================
// Backup Service Infrastructure - Complete database backup and restore
// Clean Architecture: Infrastructure Layer - Services
// Supports JSON (primary) and SQLite file (local-only) formats
// Compatible with both local SQLite and Turso cloud databases
// ============================================================

import { readFile, writeFile, copyFile, mkdir, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { createHash } from 'crypto'
import { prisma } from '../persistence/prisma/prisma-client'

// ─── Environment Detection ────────────────────────────────────

function isTurso(): boolean {
  const url = process.env.DATABASE_URL || ''
  return url.startsWith('libsql://')
}

function isLocalSqlite(): boolean {
  const url = process.env.DATABASE_URL || ''
  return url.startsWith('file:')
}

// Resolve DB path from DATABASE_URL env variable (local SQLite only)
function resolveDbPath(): string | null {
  if (!isLocalSqlite()) return null
  const dbUrl = process.env.DATABASE_URL || ''
  const filePath = dbUrl.slice(5) // Remove 'file:'
  if (path.isAbsolute(filePath)) {
    return filePath
  }
  return path.resolve(process.cwd(), filePath)
}

const DB_PATH = resolveDbPath()
const DB_DIR = DB_PATH ? path.dirname(DB_PATH) : path.join(process.cwd(), 'db')
const BACKUP_DIR = path.join(DB_DIR, 'backups')
const HISTORY_FILE = path.join(BACKUP_DIR, 'backup-history.json')

// ─── Types ──────────────────────────────────────────────────────

export interface JsonBackupData {
  version: string
  app: string
  createdAt: string
  checksum: string
  description: string
  stats: Record<string, number>
  data: {
    users: any[]
    workshops: any[]
    workshopUsers: any[]
    categories: any[]
    suppliers: any[]
    products: any[]
    customers: any[]
    sales: any[]
    saleItems: any[]
    repairOrders: any[]
    repairParts: any[]
    expenses: any[]
    stockMovements: any[]
    settings: any[]
    auditLogs: any[]
  }
}

export interface BackupRecord {
  id: string
  filename: string
  format: 'json' | 'sqlite'
  description: string
  size: number
  checksum: string
  stats: Record<string, number>
  createdAt: string
}

// ─── Backup Service ─────────────────────────────────────────────

export class BackupService {
  // ─── JSON Backup (Primary - works with both local & Turso) ──

  /**
   * Create a structured JSON backup of all database data
   * This format is validatable, human-readable, and version-independent
   * Works with both local SQLite and Turso cloud databases
   */
  async createJsonBackup(description?: string): Promise<{
    filename: string
    size: number
    checksum: string
    stats: Record<string, number>
    path: string
  }> {
    await this.ensureBackupDir()

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `tallertech_backup_${timestamp}.json`
    const backupPath = path.join(BACKUP_DIR, filename)

    // Export all data from database
    const data = await this.exportAllData()
    const stats = this.calculateStats(data)

    // Build backup object
    const backup: JsonBackupData = {
      version: '1.0',
      app: 'TallerTech',
      createdAt: new Date().toISOString(),
      checksum: '', // Will be calculated below
      description: description || 'Backup manual',
      stats,
      data,
    }

    // Calculate checksum of the data (before checksum field is set)
    const dataString = JSON.stringify(backup.data)
    backup.checksum = createHash('sha256').update(dataString).digest('hex')

    // Write backup file
    const content = JSON.stringify(backup, null, 2)
    await writeFile(backupPath, content, 'utf-8')

    const size = Buffer.byteLength(content, 'utf-8')

    // Record in backup history
    const record: BackupRecord = {
      id: `backup_${timestamp}`,
      filename,
      format: 'json',
      description: description || 'Backup manual',
      size,
      checksum: backup.checksum,
      stats,
      createdAt: new Date().toISOString(),
    }
    await this.addToHistory(record)

    return { filename, size, checksum: backup.checksum, stats, path: backupPath }
  }

  /**
   * Validate a JSON backup structure and checksum
   */
  async validateJsonBackup(backupData: JsonBackupData): Promise<{
    valid: boolean
    errors: string[]
  }> {
    const errors: string[] = []

    // Check version
    if (!backupData.version) {
      errors.push('Versión de backup no especificada')
    }

    // Check app
    if (backupData.app !== 'TallerTech') {
      errors.push('Archivo de backup no es de TallerTech')
    }

    // Check data exists
    if (!backupData.data) {
      errors.push('No se encontraron datos en el backup')
      return { valid: false, errors }
    }

    // Verify checksum
    const dataString = JSON.stringify(backupData.data)
    const calculatedChecksum = createHash('sha256').update(dataString).digest('hex')
    if (calculatedChecksum !== backupData.checksum) {
      errors.push('Checksum inválido - el archivo puede estar corrupto')
    }

    // Check required data sections
    const requiredSections = ['users', 'workshops', 'products', 'sales', 'customers']
    for (const section of requiredSections) {
      if (!Array.isArray(backupData.data[section as keyof typeof backupData.data])) {
        errors.push(`Sección de datos faltante: ${section}`)
      }
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Restore database from a JSON backup
   * Works with both local SQLite and Turso cloud databases
   */
  async restoreFromJsonBackup(backupData: JsonBackupData): Promise<{
    success: boolean
    message: string
    stats?: Record<string, number>
  }> {
    // Validate first
    const validation = await this.validateJsonBackup(backupData)
    if (!validation.valid) {
      return {
        success: false,
        message: `Backup inválido: ${validation.errors.join(', ')}`,
      }
    }

    try {
      // Create safety backup before restoring
      const safetyBackup = await this.createJsonBackup(
        'Auto-backup antes de restauración'
      )

      // Delete all existing data in correct order (respecting foreign keys)
      await this.deleteAllData()

      // Import data in correct order (respecting foreign key dependencies)
      await this.importAllData(backupData.data)

      // Record the restore in history
      const stats = this.calculateStats(backupData.data)
      await this.addToHistory({
        id: `restore_${new Date().toISOString().replace(/[:.]/g, '-')}`,
        filename: 'restore',
        format: 'json',
        description: `Restauración desde backup (seguridad: ${safetyBackup.filename})`,
        size: 0,
        checksum: '',
        stats,
        createdAt: new Date().toISOString(),
      })

      return {
        success: true,
        message: `Base de datos restaurada exitosamente. Backup de seguridad: ${safetyBackup.filename}`,
        stats,
      }
    } catch (error) {
      return {
        success: false,
        message: `Error al restaurar: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      }
    }
  }

  // ─── SQLite Backup (Local-only - NOT available with Turso) ───

  /**
   * Create a raw SQLite file backup
   * Only available when using local SQLite (not Turso)
   */
  async createSqliteBackup(description?: string): Promise<{
    filename: string
    size: number
    path: string
  }> {
    if (isTurso() || !DB_PATH) {
      throw new Error('SQLite file backup no está disponible con Turso. Use JSON backup en su lugar.')
    }

    await this.ensureBackupDir()

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `tallertech_backup_${timestamp}.db`
    const backupPath = path.join(BACKUP_DIR, filename)

    await copyFile(DB_PATH, backupPath)

    const buffer = await readFile(backupPath)
    const size = buffer.length
    const checksum = createHash('sha256').update(buffer).digest('hex')

    await this.addToHistory({
      id: `backup_${timestamp}`,
      filename,
      format: 'sqlite',
      description: description || 'Backup SQLite manual',
      size,
      checksum,
      stats: {},
      createdAt: new Date().toISOString(),
    })

    return { filename, size, path: backupPath }
  }

  /**
   * Get the raw database file buffer for download (SQLite)
   * Only available when using local SQLite
   */
  async getDatabaseBuffer(): Promise<Buffer> {
    if (isTurso() || !DB_PATH) {
      throw new Error('Descarga de archivo SQLite no disponible con Turso. Use JSON backup.')
    }
    return readFile(DB_PATH)
  }

  /**
   * Get the JSON backup file buffer for download
   */
  async getJsonBackupBuffer(filename: string): Promise<Buffer> {
    const backupPath = path.join(BACKUP_DIR, filename)
    if (!existsSync(backupPath)) {
      throw new Error('Archivo de backup no encontrado')
    }
    return readFile(backupPath)
  }

  /**
   * Restore from uploaded SQLite backup buffer
   * Only available when using local SQLite
   */
  async restoreFromBuffer(buffer: Buffer): Promise<{
    success: boolean
    message: string
  }> {
    if (isTurso() || !DB_PATH) {
      throw new Error('Restauración de archivo SQLite no disponible con Turso. Use JSON restore.')
    }

    try {
      // Create safety backup before restoring
      const safetyBackup = await this.createJsonBackup(
        'Auto-backup antes de restauración SQLite'
      )

      // Disconnect Prisma to release DB file lock so we can overwrite it
      await prisma.$disconnect()

      // Write the new database file
      await writeFile(DB_PATH, buffer)

      // Reconnect Prisma to the new database
      await prisma.$connect()

      return {
        success: true,
        message: `Base de datos restaurada exitosamente. Backup de seguridad: ${safetyBackup.filename}`,
      }
    } catch (error) {
      // Ensure Prisma is reconnected even on error
      try { await prisma.$connect() } catch { /* ignore */ }
      return {
        success: false,
        message: `Error al restaurar: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      }
    }
  }

  // ─── Backup History ────────────────────────────────────────

  /**
   * Get backup history from filesystem (independent of DB state)
   */
  async getBackupHistory(): Promise<BackupRecord[]> {
    try {
      if (!existsSync(HISTORY_FILE)) {
        return []
      }
      const content = await readFile(HISTORY_FILE, 'utf-8')
      return JSON.parse(content)
    } catch {
      return []
    }
  }

  /**
   * Delete a backup file and remove from history
   */
  async deleteBackup(filename: string): Promise<boolean> {
    const backupPath = path.join(BACKUP_DIR, filename)
    if (existsSync(backupPath)) {
      await unlink(backupPath)
    }
    await this.removeFromHistory(filename)
    return true
  }

  /**
   * Get database statistics
   * Compatible with both local SQLite and Turso
   */
  async getDatabaseStats(): Promise<{
    fileSize: number
    tables: Array<{ name: string; count: number }>
    lastBackup: string | null
  }> {
    // Get file size (only for local SQLite)
    let fileSize = 0
    if (DB_PATH && existsSync(DB_PATH)) {
      const buffer = await readFile(DB_PATH)
      fileSize = buffer.length
    } else if (isTurso()) {
      // For Turso, estimate size from record counts
      fileSize = -1 // Indicates cloud database, size not available
    }

    const tables = [
      { name: 'usuarios', count: await prisma.user.count() },
      { name: 'talleres', count: await prisma.workshop.count() },
      { name: 'productos', count: await prisma.product.count() },
      { name: 'categorías', count: await prisma.category.count() },
      { name: 'proveedores', count: await prisma.supplier.count() },
      { name: 'clientes', count: await prisma.customer.count() },
      { name: 'ventas', count: await prisma.sale.count() },
      { name: 'reparaciones', count: await prisma.repairOrder.count() },
      { name: 'gastos', count: await prisma.expense.count() },
      { name: 'auditoría', count: await prisma.auditLog.count() },
    ]

    const history = await this.getBackupHistory()
    const lastBackup = history.length > 0 ? history[0].createdAt : null

    return { fileSize, tables, lastBackup }
  }

  /**
   * Check if SQLite file operations are available
   */
  isSqliteFileAvailable(): boolean {
    return !isTurso() && DB_PATH !== null
  }

  /**
   * Check if using Turso cloud database
   */
  isUsingTurso(): boolean {
    return isTurso()
  }

  // ─── Private Helpers ───────────────────────────────────────

  private async ensureBackupDir() {
    if (!existsSync(BACKUP_DIR)) {
      await mkdir(BACKUP_DIR, { recursive: true })
    }
  }

  private async addToHistory(record: BackupRecord) {
    await this.ensureBackupDir()
    const history = await this.getBackupHistory()
    history.unshift(record) // Add to beginning (newest first)
    // Keep only last 100 records
    if (history.length > 100) {
      history.length = 100
    }
    await writeFile(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8')
  }

  private async removeFromHistory(filename: string) {
    const history = await this.getBackupHistory()
    const filtered = history.filter((r) => r.filename !== filename)
    await writeFile(HISTORY_FILE, JSON.stringify(filtered, null, 2), 'utf-8')
  }

  private async exportAllData(): Promise<JsonBackupData['data']> {
    const [
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
      expenses,
      stockMovements,
      settings,
      auditLogs,
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
      prisma.expense.findMany(),
      prisma.stockMovement.findMany(),
      prisma.setting.findMany(),
      prisma.auditLog.findMany(),
    ])

    return {
      users: users.map(this.serializeDates),
      workshops: workshops.map(this.serializeDates),
      workshopUsers: workshopUsers.map(this.serializeDates),
      categories: categories.map(this.serializeDates),
      suppliers: suppliers.map(this.serializeDates),
      products: products.map(this.serializeDates),
      customers: customers.map(this.serializeDates),
      sales: sales.map(this.serializeDates),
      saleItems: saleItems.map(this.serializeDates),
      repairOrders: repairOrders.map(this.serializeDates),
      repairParts: repairParts.map(this.serializeDates),
      expenses: expenses.map(this.serializeDates),
      stockMovements: stockMovements.map(this.serializeDates),
      settings: settings.map(this.serializeDates),
      auditLogs: auditLogs.map(this.serializeDates),
    }
  }

  private calculateStats(data: JsonBackupData['data']): Record<string, number> {
    return {
      users: data.users.length,
      workshops: data.workshops.length,
      workshopUsers: data.workshopUsers.length,
      categories: data.categories.length,
      suppliers: data.suppliers.length,
      products: data.products.length,
      customers: data.customers.length,
      sales: data.sales.length,
      saleItems: data.saleItems.length,
      repairOrders: data.repairOrders.length,
      repairParts: data.repairParts.length,
      expenses: data.expenses.length,
      stockMovements: data.stockMovements.length,
      settings: data.settings.length,
      auditLogs: data.auditLogs.length,
    }
  }

  /**
   * Serialize Date objects to ISO strings for JSON export
   */
  private serializeDates(record: any): any {
    const result: any = {}
    for (const [key, value] of Object.entries(record)) {
      if (value instanceof Date) {
        result[key] = value.toISOString()
      } else {
        result[key] = value
      }
    }
    return result
  }

  /**
   * Delete all data in correct order (respecting foreign key constraints)
   */
  private async deleteAllData() {
    // Order matters: child tables first, then parent tables
    await prisma.$transaction([
      prisma.repairPart.deleteMany(),
      prisma.saleItem.deleteMany(),
      prisma.stockMovement.deleteMany(),
      prisma.auditLog.deleteMany(),
      prisma.setting.deleteMany(),
      prisma.expense.deleteMany(),
      prisma.repairOrder.deleteMany(),
      prisma.sale.deleteMany(),
      prisma.product.deleteMany(),
      prisma.customer.deleteMany(),
      prisma.category.deleteMany(),
      prisma.supplier.deleteMany(),
      prisma.workshopUser.deleteMany(),
      prisma.workshop.deleteMany(),
      prisma.user.deleteMany(),
    ])
  }

  /**
   * Import data in correct order (respecting foreign key dependencies)
   * Note: SQLite does not support skipDuplicates in createMany,
   * but since we deleteAllData() first, there should be no duplicates.
   */
  private async importAllData(data: JsonBackupData['data']) {
    // Order: parent tables first, then children
    // 1. Users (no FK dependencies)
    if (data.users.length > 0) {
      await prisma.user.createMany({ data: data.users })
    }

    // 2. Workshops (no FK dependencies)
    if (data.workshops.length > 0) {
      await prisma.workshop.createMany({ data: data.workshops })
    }

    // 3. WorkshopUsers (depends on User + Workshop)
    if (data.workshopUsers.length > 0) {
      await prisma.workshopUser.createMany({ data: data.workshopUsers })
    }

    // 4. Categories (depends on Workshop)
    if (data.categories.length > 0) {
      await prisma.category.createMany({ data: data.categories })
    }

    // 5. Suppliers (depends on Workshop)
    if (data.suppliers.length > 0) {
      await prisma.supplier.createMany({ data: data.suppliers })
    }

    // 6. Products (depends on Workshop, Category, Supplier)
    if (data.products.length > 0) {
      await prisma.product.createMany({ data: data.products })
    }

    // 7. Customers (depends on Workshop)
    if (data.customers.length > 0) {
      await prisma.customer.createMany({ data: data.customers })
    }

    // 8. Sales (depends on Workshop, Customer)
    if (data.sales.length > 0) {
      await prisma.sale.createMany({ data: data.sales })
    }

    // 9. SaleItems (depends on Sale, Product)
    if (data.saleItems.length > 0) {
      await prisma.saleItem.createMany({ data: data.saleItems })
    }

    // 10. RepairOrders (depends on Workshop, Customer)
    if (data.repairOrders.length > 0) {
      await prisma.repairOrder.createMany({ data: data.repairOrders })
    }

    // 11. RepairParts (depends on RepairOrder, Product)
    if (data.repairParts.length > 0) {
      await prisma.repairPart.createMany({ data: data.repairParts })
    }

    // 12. Expenses (depends on Workshop)
    if (data.expenses.length > 0) {
      await prisma.expense.createMany({ data: data.expenses })
    }

    // 13. StockMovements (depends on Product)
    if (data.stockMovements.length > 0) {
      await prisma.stockMovement.createMany({ data: data.stockMovements })
    }

    // 14. Settings (depends on Workshop)
    if (data.settings.length > 0) {
      await prisma.setting.createMany({ data: data.settings })
    }

    // 15. AuditLogs (depends on Workshop)
    if (data.auditLogs.length > 0) {
      await prisma.auditLog.createMany({ data: data.auditLogs })
    }
  }
}

export const backupService = new BackupService()
