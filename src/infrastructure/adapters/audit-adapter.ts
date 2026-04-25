// ============================================================
// Audit Adapter - Adapts AuditService to implement AuditPort
// Clean Architecture: Infrastructure Layer - Adapters
// ============================================================

import type { AuditPort } from '@/application/ports'
import { AuditService } from '@/infrastructure/services/audit-service'

export class AuditAdapter implements AuditPort {
  private service: AuditService

  constructor() {
    this.service = new AuditService()
  }

  async log(entry: {
    userId: string
    userName: string
    action: string
    entity: string
    entityId?: string | null
    details?: string | null
    ip?: string | null
  }): Promise<void> {
    await this.service.log(entry)
  }
}
