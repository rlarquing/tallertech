// ============================================================
// Backup Adapter - Adapts BackupService to implement BackupPort
// Clean Architecture: Infrastructure Layer - Adapters
// ============================================================

import type { BackupPort, BackupRecord } from '@/application/ports'
import { BackupService } from '@/infrastructure/services/backup-service'

export class BackupAdapter implements BackupPort {
  private service: BackupService

  constructor() {
    this.service = new BackupService()
  }

  async createBackup(description?: string): Promise<string> {
    const result = await this.service.createBackup(description)
    return result.path
  }

  async createJsonBackup(description?: string): Promise<{
    filename: string
    size: number
    checksum: string
    stats: Record<string, number>
  }> {
    const result = await this.service.createBackup(description)
    const stats = await this.service.getDatabaseStats()
    const statsMap: Record<string, number> = {}
    for (const table of stats.tables) {
      statsMap[table.name] = table.count
    }
    // Simple checksum based on filename + size (BackupService doesn't compute one)
    const checksum = `${result.filename}:${result.size}`
    return {
      filename: result.filename,
      size: result.size,
      checksum,
      stats: statsMap,
    }
  }

  async listBackups(): Promise<Array<{ name: string; size: number; createdAt: Date }>> {
    const history = await this.service.listBackups()
    return history.map((b) => ({
      name: b.filename,
      size: b.size,
      createdAt: b.createdAt ? new Date(b.createdAt) : new Date(),
    }))
  }

  async getBackupHistory(): Promise<BackupRecord[]> {
    const history = await this.service.listBackups()
    return history.map((b, idx) => ({
      id: `backup_${idx}`,
      filename: b.filename,
      format: 'json' as const,
      description: b.description || '',
      size: b.size,
      checksum: `${b.filename}:${b.size}`,
      stats: {},
      createdAt: b.createdAt || new Date().toISOString(),
    }))
  }

  async getDatabaseStats(): Promise<{ fileSize: number; tables: Record<string, number>; lastBackup: string | null }> {
    const stats = await this.service.getDatabaseStats()
    const tablesMap: Record<string, number> = {}
    for (const table of stats.tables) {
      tablesMap[table.name] = table.count
    }
    const history = await this.service.listBackups()
    const lastBackup = history.length > 0 ? (history[0].createdAt || null) : null
    return { fileSize: stats.fileSize, tables: tablesMap, lastBackup }
  }

  async restoreFromJsonBackup(backupData: unknown): Promise<{
    success: boolean
    message: string
    stats?: Record<string, number>
  }> {
    // If backupData is a Buffer, use restoreFromBuffer; otherwise treat as JSON object
    if (Buffer.isBuffer(backupData)) {
      return this.service.restoreFromBuffer(backupData)
    }
    // If it's a JSON object, convert to buffer and restore
    try {
      const buffer = Buffer.from(JSON.stringify(backupData))
      return this.service.restoreFromBuffer(buffer)
    } catch (error) {
      return {
        success: false,
        message: `Error al restaurar backup: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      }
    }
  }

  async deleteBackup(filename: string): Promise<boolean> {
    return this.service.deleteBackup(filename)
  }
}
