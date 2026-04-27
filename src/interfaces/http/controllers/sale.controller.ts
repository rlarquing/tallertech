// ============================================================
// Sale Controller - HTTP adapter for sale endpoints
// Clean Architecture: Interface Adapters Layer
// ============================================================

import { NextRequest } from 'next/server'
import '@/infrastructure/container'
import { UseCaseContainer } from '@/application/container'
import { ResponsePresenter } from '../presenters/response.presenter'
import { validateWithSchema, saleSchema } from '@/lib/validations'

const useCases = UseCaseContainer.getInstance()

export class SaleController {
  static async list(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const result = await useCases.getSales.execute(
        {
          search: searchParams.get('search') || '',
          status: searchParams.get('status') || '',
          dateFrom: searchParams.get('dateFrom') || '',
          dateTo: searchParams.get('dateTo') || '',
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
      const body = validateWithSchema(saleSchema, rawBody)
      const result = await useCases.createSale.execute(body, request)
      return ResponsePresenter.created(result)
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }

  static async getById(request: NextRequest, id: string) {
    try {
      const result = await useCases.getSales.execute(
        { search: id } as never,
        request,
      )
      return ResponsePresenter.success(result)
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }

  static async update(request: NextRequest, id: string) {
    try {
      const rawBody = await request.json()
      const body = validateWithSchema(saleSchema, rawBody)
      const result = await useCases.updateSale.execute(
        { ...body, id },
        request,
      )
      return ResponsePresenter.success(result)
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }

  static async delete(_request: NextRequest, id: string) {
    try {
      const result = await useCases.deleteSale.execute(id, _request)
      return ResponsePresenter.success(result)
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }
}
