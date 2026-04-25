import { NextRequest } from 'next/server'
import { ExportController } from '@/interfaces/http/controllers/export.controller'

export async function GET(request: NextRequest) {
  return ExportController.export(request)
}
