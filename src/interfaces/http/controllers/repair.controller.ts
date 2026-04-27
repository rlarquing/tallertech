// ============================================================
// Repair Controller - HTTP adapter for repair endpoints
// Clean Architecture: Interface Adapters Layer
// ============================================================

import { NextRequest } from 'next/server'
import '@/infrastructure/container'
import { UseCaseContainer } from '@/application/container'
import { ResponsePresenter } from '../presenters/response.presenter'
import { validateWithSchema, repairSchema, repairUpdateSchema, repairPartSchema } from '@/lib/validations'

const useCases = UseCaseContainer.getInstance()

export class RepairController {
  static async list(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const result = await useCases.getRepairs.execute(
        {
          search: searchParams.get('search') || '',
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
      const body = validateWithSchema(repairSchema, rawBody)
      const result = await useCases.createRepair.execute(body, request)
      return ResponsePresenter.created(result)
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }

  static async getById(request: NextRequest, id: string) {
    try {
      const result = await useCases.getRepairs.execute(
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
      const body = validateWithSchema(repairUpdateSchema, rawBody)
      const result = await useCases.updateRepair.execute(
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
      await useCases.deleteRepair.execute(id, _request)
      return ResponsePresenter.success({ message: 'Reparación eliminada exitosamente' })
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }

  static async addPart(request: NextRequest, id: string) {
    try {
      const rawBody = await request.json()
      const body = validateWithSchema(repairPartSchema, rawBody)
      const result = await useCases.addRepairPart.execute(id, body, request)
      return ResponsePresenter.created(result)
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }
}
