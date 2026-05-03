import { NextRequest } from 'next/server'
import { DailyClosingController } from '@/interfaces/http/controllers/daily-closing.controller'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return DailyClosingController.close(request, id)
}
