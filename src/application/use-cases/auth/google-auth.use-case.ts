// ============================================================
// Google Auth Use Case - Authenticate via Google OAuth
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { AuthRepository } from '@/domain/repositories'
import type { AuditPort } from '@/application/ports'
import type { GoogleAuthRequest, AuthResponse } from '@/application/dtos'
import { ValidationError } from '@/domain/errors'

export class GoogleAuthUseCase {
  constructor(
    private authRepository: AuthRepository,
    private auditPort: AuditPort,
  ) {}

  async execute(request: GoogleAuthRequest, ip?: string): Promise<AuthResponse> {
    // 1. Validate input
    if (!request.email || !request.name) {
      throw new ValidationError('Email y nombre son requeridos para autenticación Google')
    }

    // 2. Find or create Google user
    const user = await this.authRepository.findOrCreateGoogleUser({
      email: request.email,
      name: request.name,
      image: request.image,
    })

    // 3. Check if user is active
    if (!user.active) {
      throw new ValidationError('Usuario desactivado')
    }

    // 4. Log audit trail
    await this.auditPort.log({
      userId: user.id,
      userName: user.name,
      action: 'LOGIN',
      entity: 'auth',
      details: 'Inicio de sesión con Google',
      ip,
    })

    // 5. Return response
    return {
      user: user.toPublicInfo(),
      message: 'Sesión iniciada con Google correctamente',
    }
  }
}
