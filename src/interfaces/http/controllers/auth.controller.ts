// ============================================================
// Auth Controller - HTTP adapter for authentication endpoints
// Clean Architecture: Interface Adapters Layer
// ============================================================

import { NextRequest } from 'next/server'
import '@/infrastructure/container'
import { UseCaseContainer } from '@/application/container'
import { ResponsePresenter } from '../presenters/response.presenter'
import { CookieSession } from '@/infrastructure/auth/cookie-session'
import { ValidationError, AuthenticationError } from '@/domain/errors'

const cookieSession = new CookieSession()
const useCases = UseCaseContainer.getInstance()

export class AuthController {
  static async login(request: NextRequest) {
    try {
      const body = await request.json()
      const ip = request.headers.get('x-forwarded-for') || undefined
      const result = await useCases.login.execute(body, ip)
      const response = ResponsePresenter.success(result)
      const sessionCookie = cookieSession.createSessionCookie(result.user)
      response.cookies.set(sessionCookie)
      return response
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }

  static async register(request: NextRequest) {
    try {
      const body = await request.json()
      const ip = request.headers.get('x-forwarded-for') || undefined
      const result = await useCases.register.execute(body, ip)
      const response = ResponsePresenter.created(result)
      const sessionCookie = cookieSession.createSessionCookie(result.user)
      response.cookies.set(sessionCookie)
      return response
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }

  static async googleAuth(request: NextRequest) {
    try {
      const body = await request.json()
      const { token } = body

      if (!token) {
        throw new ValidationError('Token de Google es requerido')
      }

      // Verify Google token
      const googleUser = await AuthController.verifyGoogleToken(token)
      if (!googleUser) {
        throw new AuthenticationError('Token de Google inválido')
      }

      const ip = request.headers.get('x-forwarded-for') || undefined
      const result = await useCases.googleAuth.execute(
        {
          email: googleUser.email,
          name: googleUser.name,
          image: googleUser.picture,
        },
        ip,
      )
      const response = ResponsePresenter.success(result)
      const sessionCookie = cookieSession.createSessionCookie(result.user)
      response.cookies.set(sessionCookie)
      return response
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }

  static async logout(request: NextRequest) {
    try {
      const result = await useCases.logout.execute(request)
      const response = ResponsePresenter.success(result)
      response.cookies.set(cookieSession.clearSessionCookie())
      return response
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }

  static async session(request: NextRequest) {
    try {
      const user = await cookieSession.getSessionUser(request)
      if (!user) {
        return ResponsePresenter.success({ isAuthenticated: false }, 401)
      }
      return ResponsePresenter.success({ isAuthenticated: true, user })
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }

  private static async verifyGoogleToken(token: string): Promise<{
    sub: string
    email: string
    name: string
    picture?: string
    email_verified: boolean
  } | null> {
    try {
      const response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`,
      )
      if (!response.ok) return null
      const data = await response.json()
      if (!data.email || !data.email_verified) return null
      return {
        sub: data.sub,
        email: data.email,
        name: data.name || data.email.split('@')[0],
        picture: data.picture || undefined,
        email_verified: data.email_verified,
      }
    } catch {
      return null
    }
  }
}
