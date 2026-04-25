// ============================================================
// Customer Controller - HTTP adapter for customer endpoints
// Clean Architecture: Interface Adapters Layer
// ============================================================

import { NextRequest } from 'next/server'
import '@/infrastructure/container'
import { UseCaseContainer } from '@/application/container'
import { ResponsePresenter } from '../presenters/response.presenter'

const useCases = UseCaseContainer.getInstance()

export class CustomerController {
  static async list(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const result = await useCases.getCustomers.execute(
        {
          search: searchParams.get('search') || '',
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
      const result = await useCases.createCustomer.execute(body, request)
      return ResponsePresenter.created(result)
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }

  static async getById(request: NextRequest, id: string) {
    try {
      const result = await useCases.getCustomers.execute(
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
      const body = await request.json()
      const result = await useCases.updateCustomer.execute(
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
      await useCases.deleteCustomer.execute(id, _request)
      return ResponsePresenter.success({ message: 'Cliente desactivado exitosamente' })
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }
}
