// ============================================================
// BI Controller - HTTP adapter for BI endpoints
// Clean Architecture: Interface Adapters Layer
// ============================================================

import { NextRequest } from 'next/server'
import '@/infrastructure/container'
import { UseCaseContainer } from '@/application/container'
import { ResponsePresenter } from '../presenters/response.presenter'

const useCases = UseCaseContainer.getInstance()

export class BIController {
  static async getWorkshopBI(request: NextRequest, workshopId: string) {
    try {
      const result = await useCases.getWorkshopBI.execute(workshopId, request)
      return ResponsePresenter.success(result)
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }

  static async getOwnerDashboard(request: NextRequest) {
    try {
      const result = await useCases.getOwnerDashboard.execute({}, request)
      return ResponsePresenter.success(result)
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }
}
