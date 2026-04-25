// ============================================================
// Get Settings Use Case
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type { SettingsRepository } from '@/domain/repositories'
import type { SessionPort } from '@/application/ports'
import { ValidationError } from '@/domain/errors'

export class GetSettingsUseCase {
  constructor(
    private settingsRepository: SettingsRepository,
    private sessionPort: SessionPort,
  ) {}

  async execute(sessionRequest?: Request) {
    // 1. Authenticate
    const user = sessionRequest
      ? await this.sessionPort.getSessionUser(sessionRequest)
      : null
    if (!user) {
      throw new ValidationError('No autenticado')
    }

    // 2. Get all settings
    const settings = await this.settingsRepository.getAll()

    // 3. Return result
    return settings
  }
}
