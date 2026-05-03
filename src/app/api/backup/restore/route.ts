import { NextRequest } from 'next/server'
import { BackupController } from '@/interfaces/http/controllers/backup.controller'

export async function POST(request: NextRequest) {
  return BackupController.restore(request)
}
