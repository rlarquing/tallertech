// ============================================================
// Logout Use Case - Log user logout event
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { AuditPort, SessionPort } from '@/application/ports'

export class LogoutUseCase {
  constructor(
    private auditPort: AuditPort,
    private sessionPort: SessionPort,
  ) {}

  async execute(request?: Request): Promise<{ message: string }> {
    // 1. Get session user if available
    const user = request ? await this.sessionPort.getSessionUser(request) : null

    // 2. Log audit trail
    if (user) {
      await this.auditPort.log({
        userId: user.id,
        userName: user.name,
        action: 'LOGOUT',
        entity: 'auth',
        details: 'Cierre de sesión',
      })
    }

    // 3. Return response
    return { message: 'Sesión cerrada correctamente' }
  }
}
