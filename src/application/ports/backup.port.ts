// ============================================================
// Backup Port - Interface for database backup operations
// Clean Architecture: Application Business Rules Layer
// ============================================================

export interface BackupPort {
  createBackup(): Promise<string>
  listBackups(): Promise<Array<{ name: string; size: number; createdAt: Date }>>
  getDatabaseStats(): Promise<{ fileSize: number; tables: Record<string, number> }>
}
