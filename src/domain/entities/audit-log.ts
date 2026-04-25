/**
 * AuditLog Entity
 * Immutable record of a system action for traceability.
 */
export class AuditLog {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly userName: string,
    public readonly action: string,
    public readonly entity: string,
    public readonly entityId: string | null,
    public readonly details: string | null,
    public readonly ip: string | null,
    public readonly createdAt: Date,
  ) {}

  static create(params: {
    id: string
    userId: string
    userName: string
    action: string
    entity: string
    entityId?: string | null
    details?: string | null
    ip?: string | null
    createdAt?: Date
  }): AuditLog {
    return new AuditLog(
      params.id,
      params.userId,
      params.userName,
      params.action,
      params.entity,
      params.entityId ?? null,
      params.details ?? null,
      params.ip ?? null,
      params.createdAt || new Date(),
    )
  }

  /** Audit logs are immutable - no setters or update methods */

  /** Check if this log is for a CREATE action */
  isCreate(): boolean {
    return this.action === 'CREATE'
  }

  /** Check if this log is for an UPDATE action */
  isUpdate(): boolean {
    return this.action === 'UPDATE'
  }

  /** Check if this log is for a DELETE action */
  isDelete(): boolean {
    return this.action === 'DELETE'
  }

  /** Check if this log is for a LOGIN action */
  isLogin(): boolean {
    return this.action === 'LOGIN'
  }

  /** Serialize to a plain object matching the original interface shape */
  toPlainObject() {
    return {
      id: this.id,
      userId: this.userId,
      userName: this.userName,
      action: this.action,
      entity: this.entity,
      entityId: this.entityId,
      details: this.details,
      ip: this.ip,
      createdAt: this.createdAt,
    }
  }
}
