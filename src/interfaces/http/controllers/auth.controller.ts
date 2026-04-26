// ============================================================
// Auth Controller - HTTP adapter for authentication endpoints
// Clean Architecture: Interface Adapters Layer
// ============================================================

import { NextRequest } from 'next/server'
import '@/infrastructure/container'
import { UseCaseContainer } from '@/application/container'
import { ResponsePresenter } from '../presenters/response.presenter'
import { CookieSession } from '@/infrastructure/auth/cookie-session'

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
}
