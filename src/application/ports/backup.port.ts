// ============================================================
// Backup Port - Interface for database backup operations
// Clean Architecture: Application Business Rules Layer
// ============================================================

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

export interface BackupPort {
  // Create backups
  createBackup(description?: string): Promise<string>
  createJsonBackup(description?: string): Promise<{
    filename: string
    size: number
    checksum: string
    stats: Record<string, number>
  }>

  // List / history
  listBackups(): Promise<Array<{ name: string; size: number; createdAt: Date }>>
  getBackupHistory(): Promise<BackupRecord[]>

  // Stats
  getDatabaseStats(): Promise<{
    fileSize: number
    tables: Record<string, number>
    lastBackup: string | null
  }>

  // Restore
  restoreFromJsonBackup(backupData: any): Promise<{
    success: boolean
    message: string
    stats?: Record<string, number>
  }>

  // Delete
  deleteBackup(filename: string): Promise<boolean>
}
