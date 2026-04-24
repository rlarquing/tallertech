// ============================================================
// Export API - GET /api/export
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { exportData } from '@/application/services/export-service'
import { auditService } from '@/application/services/audit-service'
import { getSessionUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') as 'pdf' | 'csv' | 'xlsx'
    const entity = searchParams.get('entity')
    const dateFrom = searchParams.get('dateFrom') || undefined
    const dateTo = searchParams.get('dateTo') || undefined

    if (!format || !entity) {
      return NextResponse.json(
        { error: 'Parámetros format y entity son requeridos' },
        { status: 400 }
      )
    }

    if (!['pdf', 'csv', 'xlsx'].includes(format)) {
      return NextResponse.json(
        { error: 'Formato no soportado. Use: pdf, csv, xlsx' },
        { status: 400 }
      )
    }

    if (!['sales', 'products', 'repairs', 'customers', 'expenses', 'stock'].includes(entity)) {
      return NextResponse.json(
        { error: 'Entidad no soportada. Use: sales, products, repairs, customers, expenses, stock' },
        { status: 400 }
      )
    }

    const result = await exportData({ format, entity, dateFrom, dateTo })

    // Log the export action
    await auditService.log({
      userId: user.id,
      userName: user.name,
      action: 'EXPORT',
      entity,
      details: `Exportación ${format.toUpperCase()} de ${entity}`,
    })

    return new NextResponse(result.buffer, {
      headers: {
        'Content-Type': result.contentType,
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'Content-Length': result.buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('[Export API] Error:', error)
    return NextResponse.json(
      { error: 'Error al exportar datos' },
      { status: 500 }
    )
  }
}
