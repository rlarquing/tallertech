import { NextRequest } from 'next/server'
import { BIController } from '@/interfaces/http/controllers/bi.controller'

export async function GET(request: NextRequest) {
  return BIController.getOwnerDashboard(request)
}
