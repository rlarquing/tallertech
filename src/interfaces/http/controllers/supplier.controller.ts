// ============================================================
// Supplier Controller - HTTP adapter for supplier endpoints
// Clean Architecture: Interface Adapters Layer
// ============================================================

import { NextRequest } from 'next/server'
import '@/infrastructure/container'
import { UseCaseContainer } from '@/application/container'
import { ResponsePresenter } from '../presenters/response.presenter'
import { validateWithSchema, supplierSchema } from '@/lib/validations'

const useCases = UseCaseContainer.getInstance()

export class SupplierController {
  static async list(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const result = await useCases.getSuppliers.execute(
        {
          search: searchParams.get('search') || '',
          page: parseInt(searchParams.get('page') || '1'),
          limit: parseInt(searchParams.get('limit') || '50'),
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
      const body = validateWithSchema(supplierSchema, rawBody)
      const result = await useCases.createSupplier.execute(body, request)
      return ResponsePresenter.created(result)
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }

  static async getById(request: NextRequest, id: string) {
    try {
      const result = await useCases.getSuppliers.execute(
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
      const body = validateWithSchema(supplierSchema, rawBody)
      const result = await useCases.updateSupplier.execute(
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
      await useCases.deleteSupplier.execute(id, _request)
      return ResponsePresenter.success({ message: 'Proveedor desactivado exitosamente' })
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }
}
