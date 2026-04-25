import { NextRequest } from 'next/server'
import { RepairController } from '@/interfaces/http/controllers/repair.controller'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return RepairController.addPart(request, id)
}
