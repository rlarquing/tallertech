// ============================================================
// Backup API - GET /api/backup (download), POST /api/backup (create)
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { backupService } from '@/application/services/backup-service'
import { auditService } from '@/application/services/audit-service'
import { getSessionUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Solo administradores pueden descargar backups' }, { status: 403 })
    }

    const buffer = await backupService.getDatabaseBuffer()
    const dateStr = new Date().toISOString().split('T')[0]

    // Log the backup action
    await auditService.log({
      userId: user.id,
      userName: user.name,
      action: 'BACKUP',
      entity: 'backup',
      details: `Descarga de backup - ${buffer.length} bytes`,
    })

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/x-sqlite3',
        'Content-Disposition': `attachment; filename="TallerTech_backup_${dateStr}.db"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('[Backup API] Error:', error)
    return NextResponse.json(
      { error: 'Error al crear backup' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Solo administradores pueden restaurar backups' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await backupService.restoreFromBuffer(buffer)

    // Log the restore action
    await auditService.log({
      userId: user.id,
      userName: user.name,
      action: 'RESTORE',
      entity: 'backup',
      details: result.success
        ? `Restauración exitosa desde archivo: ${file.name}`
        : `Restauración fallida: ${result.message}`,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Backup API] Restore error:', error)
    return NextResponse.json(
      { error: 'Error al restaurar backup' },
      { status: 500 }
    )
  }
}
