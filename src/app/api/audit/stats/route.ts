// ============================================================
// Audit Stats API - GET /api/audit/stats
// ============================================================

import { NextResponse } from 'next/server'
import { auditService } from '@/application/services/audit-service'
import { getSessionUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const stats = await auditService.getStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('[Audit Stats API] Error:', error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas de auditoría' },
      { status: 500 }
    )
  }
}
