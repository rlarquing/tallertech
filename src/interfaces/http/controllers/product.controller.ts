// ============================================================
// Product Controller - HTTP adapter for product endpoints
// Clean Architecture: Interface Adapters Layer
// ============================================================

import { NextRequest } from 'next/server'
import '@/infrastructure/container'
import { UseCaseContainer } from '@/application/container'
import { ResponsePresenter } from '../presenters/response.presenter'

const useCases = UseCaseContainer.getInstance()

export class ProductController {
  static async list(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const result = await useCases.getProducts.execute(
        {
          search: searchParams.get('search') || '',
          categoryId: searchParams.get('categoryId') || '',
          type: searchParams.get('type') || '',
          lowStock: searchParams.get('lowStock') === 'true',
          active: searchParams.get('active') || '',
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
      const body = await request.json()
      const result = await useCases.createProduct.execute(body, request)
      return ResponsePresenter.created(result)
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }

  static async getById(request: NextRequest, id: string) {
    try {
      const result = await useCases.getProducts.execute({ id } as never, request)
      return ResponsePresenter.success(result)
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }

  static async update(request: NextRequest, id: string) {
    try {
      const body = await request.json()
      const result = await useCases.updateProduct.execute(
        { ...body, id },
        request,
      )
      return ResponsePresenter.success(result)
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }

  static async delete(request: NextRequest, id: string) {
    try {
      await useCases.deleteProduct.execute(id, request)
      return ResponsePresenter.success({ message: 'Producto desactivado exitosamente' })
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }
}
