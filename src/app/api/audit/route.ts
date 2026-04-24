// ============================================================
// Audit Log API - GET /api/audit
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { auditService } from '@/application/services/audit-service'
import { getSessionUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const params = {
      userId: searchParams.get('userId') || undefined,
      entity: searchParams.get('entity') || undefined,
      action: searchParams.get('action') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      search: searchParams.get('search') || undefined,
      skip: parseInt(searchParams.get('skip') || '0'),
      take: parseInt(searchParams.get('take') || '50'),
    }

    const result = await auditService.getLogs(params)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[Audit API] Error:', error)
    return NextResponse.json(
      { error: 'Error al obtener logs de auditoría' },
      { status: 500 }
    )
  }
}
