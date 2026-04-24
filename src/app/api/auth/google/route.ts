// ============================================================
// Google OAuth API - POST /api/auth/google
// Handles Google Sign-In by verifying the ID token
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createSessionCookie } from '@/lib/auth'
import { auditService } from '@/application/services/audit-service'

interface GoogleUserInfo {
  sub: string
  email: string
  name: string
  picture?: string
  email_verified: boolean
}

async function verifyGoogleToken(token: string): Promise<GoogleUserInfo | null> {
  try {
    // Use Google's tokeninfo endpoint to verify the token
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`
    )

    if (!response.ok) {
      console.error('[Google Auth] Token verification failed:', response.status)
      return null
    }

    const data = await response.json()

    // Basic validation
    if (!data.email || !data.email_verified) {
      console.error('[Google Auth] Email not verified or missing')
      return null
    }

    return {
      sub: data.sub,
      email: data.email,
      name: data.name || data.email.split('@')[0],
      picture: data.picture || undefined,
      email_verified: data.email_verified,
    }
  } catch (error) {
    console.error('[Google Auth] Token verification error:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Token de Google es requerido' },
        { status: 400 }
      )
    }

    // Verify the Google token
    const googleUser = await verifyGoogleToken(token)
    if (!googleUser) {
      return NextResponse.json(
        { error: 'Token de Google inválido' },
        { status: 401 }
      )
    }

    // Find or create user
    let user = await db.user.findUnique({
      where: { email: googleUser.email },
    })

    if (user) {
      // Update existing user with Google info if needed
      if (user.provider !== 'google' || user.image !== googleUser.picture) {
        user = await db.user.update({
          where: { id: user.id },
          data: {
            provider: 'google',
            image: googleUser.picture || user.image,
          },
        })
      }

      if (!user.active) {
        return NextResponse.json(
          { error: 'Cuenta desactivada' },
          { status: 401 }
        )
      }
    } else {
      // Create new user from Google info
      user = await db.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          password: '', // No password for Google users
          provider: 'google',
          image: googleUser.picture,
          role: 'admin', // Default role
          active: true,
        },
      })
    }

    // Create session
    const sessionCookie = createSessionCookie({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.image,
        provider: user.provider,
      },
      message: 'Login con Google exitoso',
    })

    response.cookies.set(sessionCookie)

    // Audit log
    await auditService.log({
      userId: user.id,
      userName: user.name,
      action: user.createdAt === user.updatedAt ? 'REGISTER' : 'LOGIN',
      entity: 'user',
      entityId: user.id,
      details: `Autenticación con Google - ${googleUser.email}`,
      ip: request.headers.get('x-forwarded-for') || undefined,
    })

    return response
  } catch (error) {
    console.error('[Google Auth] Error:', error)
    return NextResponse.json(
      { error: 'Error al autenticar con Google' },
      { status: 500 }
    )
  }
}
