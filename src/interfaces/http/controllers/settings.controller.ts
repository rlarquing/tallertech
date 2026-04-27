// ============================================================
// Settings Controller - HTTP adapter for settings endpoints
// Clean Architecture: Interface Adapters Layer
// ============================================================

import { NextRequest } from 'next/server'
import '@/infrastructure/container'
import { UseCaseContainer } from '@/application/container'
import { ResponsePresenter } from '../presenters/response.presenter'
import { z } from 'zod'

const useCases = UseCaseContainer.getInstance()

// Schema for settings update request
const updateSettingsRequestSchema = z.object({
  settings: z.array(
    z.object({
      key: z.string({ message: 'La clave es requerida' })
        .min(1, { message: 'La clave es requerida' })
        .max(100, { message: 'La clave no puede exceder 100 caracteres' }),
      value: z.string({ message: 'El valor es requerido' })
        .max(500, { message: 'El valor no puede exceder 500 caracteres' }),
    })
  ).min(1, { message: 'Debe proporcionar al menos una configuración' }),
})

// Also support single key-value format
const singleSettingSchema = z.object({
  key: z.string({ message: 'La clave es requerida' })
    .min(1, { message: 'La clave es requerida' })
    .max(100, { message: 'La clave no puede exceder 100 caracteres' }),
  value: z.unknown({ message: 'El valor es requerido' }),
})

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
      const rawBody = await request.json()
      // Support both old single-key format and new multi-key format
      if (rawBody.key && rawBody.value !== undefined) {
        // Old format: validate then convert to new format
        const validated = singleSettingSchema.parse(rawBody)
        const result = await useCases.updateSettings.execute(
          { settings: [{ key: validated.key, value: String(validated.value) }] },
          request,
        )
        return ResponsePresenter.success(result)
      }
      // New format: validate multi-key format
      const body = updateSettingsRequestSchema.parse(rawBody)
      const result = await useCases.updateSettings.execute(body, request)
      return ResponsePresenter.success(result)
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }
}
