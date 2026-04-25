// ============================================================
// Settings Controller - HTTP adapter for settings endpoints
// Clean Architecture: Interface Adapters Layer
// ============================================================

import { NextRequest } from 'next/server'
import '@/infrastructure/container'
import { UseCaseContainer } from '@/application/container'
import { ResponsePresenter } from '../presenters/response.presenter'

const useCases = UseCaseContainer.getInstance()

export class SettingsController {
  static async get(request: NextRequest) {
    try {
      const result = await useCases.getSettings.execute(request)
      return ResponsePresenter.success({ data: result })
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }

  static async update(request: NextRequest) {
    try {
      const body = await request.json()
      // Support both old single-key format and new multi-key format
      if (body.key && body.value !== undefined) {
        // Old format: { key, value } → convert to new format
        const result = await useCases.updateSettings.execute(
          { settings: [{ key: body.key, value: String(body.value) }] },
          request,
        )
        return ResponsePresenter.success(result)
      }
      // New format: { settings: [{ key, value }] }
      const result = await useCases.updateSettings.execute(body, request)
      return ResponsePresenter.success(result)
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }
}
