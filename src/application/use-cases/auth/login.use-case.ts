// ============================================================
// Login Use Case - Authenticate user with credentials
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { AuthRepository } from '@/domain/repositories'
import type { AuditPort, PasswordPort } from '@/application/ports'
import type { LoginRequest, AuthResponse } from '@/application/dtos'
import { AuthenticationError, ValidationError } from '@/domain/errors'

export class LoginUseCase {
  constructor(
    private authRepository: AuthRepository,
    private auditPort: AuditPort,
    private passwordPort: PasswordPort,
  ) {}

  async execute(request: LoginRequest, ip?: string): Promise<AuthResponse> {
    // 1. Validate input
    if (!request.email || !request.password) {
      throw new ValidationError('Email y contraseña son requeridos')
    }

    // 2. Find user by email
    const user = await this.authRepository.findByEmail(request.email)
    if (!user) {
      throw new AuthenticationError('Credenciales inválidas')
    }

    // 3. Check if user is active
    if (!user.active) {
      throw new AuthenticationError('Usuario desactivado')
    }

    // 4. Verify password
    if (!this.passwordPort.verify(request.password, user.password)) {
      throw new AuthenticationError('Credenciales inválidas')
    }

    // 5. Log audit trail
    await this.auditPort.log({
      userId: user.id,
      userName: user.name,
      action: 'LOGIN',
      entity: 'auth',
      details: 'Inicio de sesión exitoso',
      ip,
    })

    // 6. Return response
    return {
      user: user.toPublicInfo(),
      message: 'Sesión iniciada correctamente',
    }
  }
}
