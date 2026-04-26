// ============================================================
// Auth Middleware - Authentication helper for protected routes
// Clean Architecture: Interface Adapters Layer
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { CookieSession } from '@/infrastructure/auth/cookie-session'

const sessionService = new CookieSession()

export async function requireAuth(
  request: NextRequest,
): Promise<
  { id: string; email: string; name: string; role: string; image?: string | null }
  | NextResponse
> {
  const user = await sessionService.getSessionUser(request)
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  return user
}
