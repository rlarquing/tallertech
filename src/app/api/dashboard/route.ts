import { NextRequest } from 'next/server'
import { DashboardController } from '@/interfaces/http/controllers/dashboard.controller'

export async function GET(request: NextRequest) {
  return DashboardController.get(request)
}
