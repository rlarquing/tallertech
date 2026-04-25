import { NextRequest } from 'next/server'
import { BIController } from '@/interfaces/http/controllers/bi.controller'

export async function GET(request: NextRequest, { params }: { params: Promise<{ workshopId: string }> }) {
  const { workshopId } = await params
  return BIController.getWorkshopBI(request, workshopId)
}
