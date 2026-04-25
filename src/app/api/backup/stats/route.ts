import { NextRequest } from 'next/server'
import { BackupController } from '@/interfaces/http/controllers/backup.controller'

export async function GET(request: NextRequest) {
  return BackupController.stats(request)
}
