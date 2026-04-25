// ============================================================
// Audit Controller - HTTP adapter for audit endpoints
// Clean Architecture: Interface Adapters Layer
// ============================================================

import { NextRequest } from 'next/server'
import '@/infrastructure/container'
import { UseCaseContainer } from '@/application/container'
import { ResponsePresenter } from '../presenters/response.presenter'

const useCases = UseCaseContainer.getInstance()

export class AuditController {
  static async list(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const result = await useCases.getAuditLogs.execute(
        {
          userId: searchParams.get('userId') || undefined,
          entity: searchParams.get('entity') || undefined,
          action: searchParams.get('action') || undefined,
          dateFrom: searchParams.get('dateFrom') || undefined,
          dateTo: searchParams.get('dateTo') || undefined,
          search: searchParams.get('search') || undefined,
          page: Math.floor(parseInt(searchParams.get('skip') || '0') / 50) + 1,
          limit: parseInt(searchParams.get('take') || '50'),
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

  static async stats(request: NextRequest) {
    try {
      const result = await useCases.getAuditStats.execute(request)
      return ResponsePresenter.success(result)
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }
}
