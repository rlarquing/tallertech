// ============================================================
// Backup Adapter - Adapts BackupService to implement BackupPort
// Clean Architecture: Infrastructure Layer - Adapters
// ============================================================

import type { BackupPort } from '@/application/ports'
import { BackupService } from '@/infrastructure/services/backup-service'

export class BackupAdapter implements BackupPort {
  private service: BackupService

  constructor() {
    this.service = new BackupService()
  }

  async createBackup(): Promise<string> {
    const result = await this.service.createBackup()
    return result.path
  }

  async listBackups(): Promise<Array<{ name: string; size: number; createdAt: Date }>> {
    const backups = await this.service.listBackups()
    return backups.map((b) => ({
      name: b.filename,
      size: b.size,
      createdAt: new Date(b.createdAt),
    }))
  }

  async getDatabaseStats(): Promise<{ fileSize: number; tables: Record<string, number> }> {
    const stats = await this.service.getDatabaseStats()
    const tablesMap: Record<string, number> = {}
    for (const table of stats.tables) {
      tablesMap[table.name] = table.count
    }
    return { fileSize: stats.fileSize, tables: tablesMap }
  }
}
