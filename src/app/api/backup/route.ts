import { NextRequest } from 'next/server'
import { BackupController } from '@/interfaces/http/controllers/backup.controller'

export async function GET(request: NextRequest) {
  return BackupController.download(request)
}

export async function POST(request: NextRequest) {
  return BackupController.create(request)
}

export async function DELETE(request: NextRequest) {
  return BackupController.deleteBackup(request)
}
