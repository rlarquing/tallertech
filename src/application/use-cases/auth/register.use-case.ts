// ============================================================
// Register Use Case - Create a new user account
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { AuthRepository } from '@/domain/repositories'
import type { AuditPort, PasswordPort } from '@/application/ports'
import type { RegisterRequest, AuthResponse } from '@/application/dtos'
import { ValidationError } from '@/domain/errors'

export class RegisterUseCase {
  constructor(
    private authRepository: AuthRepository,
    private auditPort: AuditPort,
    private passwordPort: PasswordPort,
  ) {}

  async execute(request: RegisterRequest, ip?: string): Promise<AuthResponse> {
    // 1. Validate input
    if (!request.email || !request.name || !request.password) {
      throw new ValidationError('Email, nombre y contraseña son requeridos')
    }

    if (request.password.length < 6) {
      throw new ValidationError('La contraseña debe tener al menos 6 caracteres')
    }

    // 2. Check if user already exists
    const existingUser = await this.authRepository.findByEmail(request.email)
    if (existingUser) {
      throw new ValidationError('Ya existe un usuario con este email')
    }

    // 3. Hash password
    const hashedPassword = this.passwordPort.hash(request.password)

    // 4. Create user
    const user = await this.authRepository.create({
      email: request.email,
      name: request.name,
      password: hashedPassword,
    })

    // 5. Log audit trail
    await this.auditPort.log({
      userId: user.id,
      userName: user.name,
      action: 'REGISTER',
      entity: 'auth',
      details: 'Registro de nuevo usuario',
      ip,
    })

    // 6. Return response
    return {
      user: user.toPublicInfo(),
      message: 'Usuario registrado correctamente',
    }
  }
}
