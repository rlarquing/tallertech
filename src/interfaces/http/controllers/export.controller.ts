// ============================================================
// Export Controller - HTTP adapter for data export endpoints
// Clean Architecture: Interface Adapters Layer
// ============================================================

import { NextRequest } from 'next/server'
import '@/infrastructure/container'
import { UseCaseContainer } from '@/application/container'
import { ResponsePresenter } from '../presenters/response.presenter'

const useCases = UseCaseContainer.getInstance()

function getExportMetadata(format: string, entity: string) {
  const entityLabels: Record<string, string> = {
    sales: 'Ventas',
    products: 'Productos',
    repairs: 'Reparaciones',
    customers: 'Clientes',
    expenses: 'Gastos',
    stock: 'Movimientos_de_Stock',
  }
  const entityLabel = entityLabels[entity] || entity
  const dateStr = new Date().toISOString().split('T')[0]
  const filename = `TallerTech_${entityLabel}_${dateStr}`

  const contentTypes: Record<string, string> = {
    csv: 'text/csv; charset=utf-8',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    pdf: 'application/pdf',
  }
  const extensions: Record<string, string> = { csv: '.csv', xlsx: '.xlsx', pdf: '.pdf' }

  return {
    contentType: contentTypes[format] || 'application/octet-stream',
    filename: `${filename}${extensions[format] || ''}`,
  }
}

export class ExportController {
  static async export(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const format = searchParams.get('format') as 'pdf' | 'csv' | 'xlsx'
      const entity = searchParams.get('entity') || ''
      const dateFrom = searchParams.get('dateFrom') || undefined
      const dateTo = searchParams.get('dateTo') || undefined

      const buffer = await useCases.exportData.execute(
        { format, entity, dateFrom, dateTo },
        request,
      )

      const { contentType, filename } = getExportMetadata(format, entity)
      return ResponsePresenter.binary(
        Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer as Uint8Array),
        contentType,
        filename,
      )
    } catch (error) {
      return ResponsePresenter.error(error)
    }
  }
}
