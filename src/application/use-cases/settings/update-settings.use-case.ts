// ============================================================
// Update Settings Use Case
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { SettingsRepository } from '@/domain/repositories'
import type { AuditPort, SessionPort } from '@/application/ports'
import type { UpdateSettingsRequest } from '@/application/dtos'
import { ValidationError } from '@/domain/errors'

export class UpdateSettingsUseCase {
  constructor(
    private settingsRepository: SettingsRepository,
    private auditPort: AuditPort,
    private sessionPort: SessionPort,
  ) {}

  async execute(request: UpdateSettingsRequest, sessionRequest?: Request) {
    // 1. Authenticate
    const user = sessionRequest
      ? await this.sessionPort.getSessionUser(sessionRequest)
      : null
    if (!user) {
      throw new ValidationError('No autenticado')
    }

    // 2. Validate
    if (!request.settings || request.settings.length === 0) {
      throw new ValidationError('No se proporcionaron configuraciones para actualizar')
    }

    // 3. Update each setting
    for (const setting of request.settings) {
      await this.settingsRepository.set(setting.key, setting.value)
    }

    // 4. Log audit trail
    await this.auditPort.log({
      userId: user.id,
      userName: user.name,
      action: 'UPDATE',
      entity: 'settings',
      details: `Configuraciones actualizadas: ${request.settings.map((s) => s.key).join(', ')}`,
    })

    // 5. Return updated settings
    const allSettings = await this.settingsRepository.getAll()
    return allSettings
  }
}
