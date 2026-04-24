// ============================================================
// Backup Stats API - GET /api/backup/stats
// ============================================================

import { NextResponse } from 'next/server'
import { backupService } from '@/application/services/backup-service'
import { getSessionUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const stats = await backupService.getDatabaseStats()
    const backups = await backupService.listBackups()

    return NextResponse.json({ ...stats, backups })
  } catch (error) {
    console.error('[Backup Stats API] Error:', error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}
