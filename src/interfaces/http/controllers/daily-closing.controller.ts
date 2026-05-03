// ============================================================
// DailyClosing Controller - HTTP adapter for daily closing endpoints
// Clean Architecture: Interface Adapters Layer
// ============================================================

import { NextRequest } from 'next/server'
import '@/infrastructure/container'
import { UseCaseContainer } from '@/application/container'
import { ResponsePresenter } from '../presenters/response.presenter'
import { validateWithSchema, dailyClosingSchema, closeDailyClosingSchema } from '@/lib/validations'

const useCases = UseCaseContainer.getInstance()

export class DailyClosingController {
  static async list(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const result = await useCases.getDailyClosings.execute(
        {
          workshopId: searchParams.get('workshopId') || '',
          userId: searchParams.get('userId') || '',
          dateFrom: searchParams.get('dateFrom') || '',
          dateTo: searchParams.get('dateTo') || '',
          status: searchParams.get('status') || '',
          page: parseInt(searchParams.get('page') || '1'),
          limit: parseInt(searchParams.get('limit') || '20'),
        },
        request,
      )
      return ResponsePresenter.paginated(
        result.data,
        result.total,
        result.page,
        result.limit,
      )
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }

  static async create(request: NextRequest) {
    try {
      const rawBody = await request.json()
      const body = validateWithSchema(dailyClosingSchema, rawBody)
      const result = await useCases.createDailyClosing.execute(body, request)
      return ResponsePresenter.created(result)
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }

  static async close(request: NextRequest, id: string) {
    try {
      let notes: string | undefined
      try {
        const body = await request.json()
        const validated = validateWithSchema(closeDailyClosingSchema, body)
        notes = validated.notes as string | undefined
      } catch {
        // Body might be empty, which is OK
      }
      const result = await useCases.closeDailyClosing.execute({ id, notes }, request)
      return ResponsePresenter.success(result)
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }

  static async getSummary(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const result = await useCases.getDailyClosingSummary.execute(
        {
          workshopId: searchParams.get('workshopId') || '',
          date: searchParams.get('date') || new Date().toISOString().split('T')[0],
          userId: searchParams.get('userId') || '',
        },
        request,
      )
      return ResponsePresenter.success(result)
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }
}
