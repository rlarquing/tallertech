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
    const result = await this.service.createSqliteBackup(description)
    return result.path
  }

  async createJsonBackup(description?: string): Promise<{
    filename: string
    size: number
    checksum: string
    stats: Record<string, number>
  }> {
    return this.service.createJsonBackup(description)
  }

  async listBackups(): Promise<Array<{ name: string; size: number; createdAt: Date }>> {
    const history = await this.service.getBackupHistory()
    return history.map((b: BackupRecord) => ({
      name: b.filename,
      size: b.size,
      createdAt: new Date(b.createdAt),
    }))
  }

  async getBackupHistory(): Promise<BackupRecord[]> {
    return this.service.getBackupHistory()
  }

  async getDatabaseStats(): Promise<{ fileSize: number; tables: Record<string, number>; lastBackup: string | null }> {
    const stats = await this.service.getDatabaseStats()
    const tablesMap: Record<string, number> = {}
    for (const table of stats.tables) {
      tablesMap[table.name] = table.count
    }
    return { fileSize: stats.fileSize, tables: tablesMap, lastBackup: stats.lastBackup }
  }

  async restoreFromJsonBackup(backupData: any): Promise<{
    success: boolean
    message: string
    stats?: Record<string, number>
  }> {
    return this.service.restoreFromJsonBackup(backupData)
  }

  async deleteBackup(filename: string): Promise<boolean> {
    return this.service.deleteBackup(filename)
  }
}
