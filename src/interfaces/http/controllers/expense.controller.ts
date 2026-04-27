// ============================================================
// Expense Controller - HTTP adapter for expense endpoints
// Clean Architecture: Interface Adapters Layer
// ============================================================

import { NextRequest } from 'next/server'
import '@/infrastructure/container'
import { UseCaseContainer } from '@/application/container'
import { ResponsePresenter } from '../presenters/response.presenter'
import { validateWithSchema, expenseSchema } from '@/lib/validations'

const useCases = UseCaseContainer.getInstance()

export class ExpenseController {
  static async list(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const result = await useCases.getExpenses.execute(
        {
          search: searchParams.get('search') || '',
          category: searchParams.get('category') || '',
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
      const body = validateWithSchema(expenseSchema, rawBody)
      const result = await useCases.createExpense.execute(body, request)
      return ResponsePresenter.created(result)
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }

  static async getById(request: NextRequest, id: string) {
    try {
      const result = await useCases.getExpenses.execute(
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
      const body = validateWithSchema(expenseSchema, rawBody)
      const result = await useCases.updateExpense.execute(
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
      await useCases.deleteExpense.execute(id, _request)
      return ResponsePresenter.success({ message: 'Gasto eliminado exitosamente' })
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }
}
