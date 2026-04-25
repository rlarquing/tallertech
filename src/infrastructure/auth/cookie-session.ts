// ============================================================
// Cookie Session - Implements session management via cookies
// Clean Architecture: Infrastructure Layer - Auth
// ============================================================

import { cookies } from 'next/headers'

const SESSION_COOKIE = 'tallertech_session'

export interface SessionUser {
  id: string
  email: string
  name: string
  role: string
  image?: string | null
  provider?: string
}

export class CookieSession {
  /**
   * Get the currently authenticated user from the session cookie
   */
  async getSessionUser(request?: Request): Promise<SessionUser | null> {
    const cookieStore = await cookies()
    const session = cookieStore.get(SESSION_COOKIE)
    if (!session?.value) return null
    try {
      const decoded = Buffer.from(session.value, 'base64').toString()
      return JSON.parse(decoded)
    } catch {
      return null
    }
  }

  /**
   * Create a session cookie for a user
   */
  createSessionCookie(user: SessionUser) {
    const value = Buffer.from(JSON.stringify(user)).toString('base64')
    return {
      name: SESSION_COOKIE,
      value,
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    }
  }

  /**
   * Create a cookie that clears the session
   */
  clearSessionCookie() {
    return {
      name: SESSION_COOKIE,
      value: '',
      httpOnly: true,
      path: '/',
      maxAge: 0,
    }
  }
}

// Singleton instance for convenience
export const cookieSession = new CookieSession()
