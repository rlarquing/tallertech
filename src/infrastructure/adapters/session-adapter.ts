// ============================================================
// Session Adapter - Adapts CookieSession to implement SessionPort
// Clean Architecture: Infrastructure Layer - Adapters
// ============================================================

import type { SessionPort } from '@/application/ports'
import { CookieSession } from '@/infrastructure/auth/cookie-session'

export class SessionAdapter implements SessionPort {
  private cookieSession: CookieSession

  constructor() {
    this.cookieSession = new CookieSession()
  }

  async getSessionUser(request: Request): Promise<{
    id: string
    email: string
    name: string
    role: string
    image?: string | null
  } | null> {
    return this.cookieSession.getSessionUser(request)
  }
}
