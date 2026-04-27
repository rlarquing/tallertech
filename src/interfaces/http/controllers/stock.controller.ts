// ============================================================
// Stock Controller - HTTP adapter for stock adjustment endpoints
// Clean Architecture: Interface Adapters Layer
// ============================================================

import { NextRequest } from 'next/server'
import '@/infrastructure/container'
import { UseCaseContainer } from '@/application/container'
import { ResponsePresenter } from '../presenters/response.presenter'
import { validateWithSchema, stockAdjustmentSchema } from '@/lib/validations'
import { z } from 'zod'

const useCases = UseCaseContainer.getInstance()

// Schema for stock adjustment API request (includes productId)
const adjustStockRequestSchema = z.object({
  productId: z.string({ message: 'El ID del producto es requerido' })
    .min(1, { message: 'El ID del producto es requerido' }),
  type: z.enum(['in', 'out', 'adjustment', 'return'], {
    message: 'Tipo de movimiento inválido',
  }),
  quantity: z.number({ message: 'La cantidad debe ser un número' })
    .int({ message: 'La cantidad debe ser un número entero' })
    .gt(0, { message: 'La cantidad debe ser mayor a 0' })
    .max(999999, { message: 'La cantidad no puede exceder 999,999' }),
  reason: z.string().max(200, { message: 'La razón no puede exceder 200 caracteres' }).optional(),
  reference: z.string().max(100, { message: 'La referencia no puede exceder 100 caracteres' }).optional(),
})

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
      const rawBody = await request.json()
      const body = validateWithSchema(adjustStockRequestSchema, rawBody)
      const result = await useCases.adjustStock.execute(body, request)
      return ResponsePresenter.created(result)
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }
}
