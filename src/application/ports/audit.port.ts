// ============================================================
// Audit Port - Interface for audit logging
// Clean Architecture: Application Business Rules Layer
// ============================================================

export interface AuditPort {
  log(entry: {
    userId: string
    userName: string
    action: string
    entity: string
    entityId?: string | null
    details?: string | null
    ip?: string | null
  }): Promise<void>
}
