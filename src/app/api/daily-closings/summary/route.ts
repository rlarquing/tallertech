import { NextRequest } from 'next/server'
import { DailyClosingController } from '@/interfaces/http/controllers/daily-closing.controller'

export async function GET(request: NextRequest) {
  return DailyClosingController.getSummary(request)
}
