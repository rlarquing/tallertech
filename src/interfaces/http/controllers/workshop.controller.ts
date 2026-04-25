// ============================================================
// Workshop Controller - HTTP adapter for workshop endpoints
// Clean Architecture: Interface Adapters Layer
// ============================================================

import { NextRequest } from 'next/server'
import '@/infrastructure/container'
import { UseCaseContainer } from '@/application/container'
import { ResponsePresenter } from '../presenters/response.presenter'

const useCases = UseCaseContainer.getInstance()

export class WorkshopController {
  static async list(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const result = await useCases.getWorkshops.execute(
        {
          search: searchParams.get('search') || '',
          active: searchParams.get('active') === 'true' ? true : searchParams.get('active') === 'false' ? false : undefined,
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

  static async getById(request: NextRequest, id: string) {
    try {
      const result = await useCases.getWorkshop.execute(id, request)
      return ResponsePresenter.success(result)
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }

  static async create(request: NextRequest) {
    try {
      const body = await request.json()
      const result = await useCases.createWorkshop.execute(body, request)
      return ResponsePresenter.created(result)
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }

  static async update(request: NextRequest, id: string) {
    try {
      const body = await request.json()
      const result = await useCases.updateWorkshop.execute(
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
      await useCases.deleteWorkshop.execute(id, request)
      return ResponsePresenter.success({ message: 'Taller desactivado exitosamente' })
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }

  static async getMembers(request: NextRequest, workshopId: string) {
    try {
      const result = await useCases.getWorkshopMembers.execute(workshopId, request)
      return ResponsePresenter.success(result)
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }

  static async addMember(request: NextRequest, workshopId: string) {
    try {
      const body = await request.json()
      const result = await useCases.addWorkshopMember.execute(
        { ...body, workshopId },
        request,
      )
      return ResponsePresenter.created(result)
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }

  static async removeMember(request: NextRequest, workshopId: string, userId: string) {
    try {
      await useCases.removeWorkshopMember.execute(workshopId, userId, request)
      return ResponsePresenter.success({ message: 'Miembro eliminado exitosamente' })
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }

  static async updateMember(request: NextRequest, workshopId: string, userId: string) {
    try {
      const body = await request.json()
      await useCases.updateWorkshopMember.execute(
        { ...body, workshopId, userId },
        request,
      )
      return ResponsePresenter.success({ message: 'Rol actualizado exitosamente' })
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }
}
