import { NextRequest } from 'next/server'
import { AuditController } from '@/interfaces/http/controllers/audit.controller'

export async function GET(request: NextRequest) {
  return AuditController.list(request)
}
