// ============================================================
// Stock Controller - HTTP adapter for stock adjustment endpoints
// Clean Architecture: Interface Adapters Layer
// ============================================================

import { NextRequest } from 'next/server'
import '@/infrastructure/container'
import { UseCaseContainer } from '@/application/container'
import { ResponsePresenter } from '../presenters/response.presenter'

const useCases = UseCaseContainer.getInstance()

export class StockController {
  static async list(request: NextRequest) {
    try {
      // Stock list is a GET that reads stock movements
      // Delegate to product repository via getProducts use case with stock filters
      const { searchParams } = new URL(request.url)
      const result = await useCases.getProducts.execute(
        {
          search: searchParams.get('productId') || '',
          type: searchParams.get('type') || '',
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

  static async adjust(request: NextRequest) {
    try {
      const body = await request.json()
      const result = await useCases.adjustStock.execute(body, request)
      return ResponsePresenter.created(result)
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }
}
