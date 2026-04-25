import { NextRequest } from 'next/server'
import { RepairController } from '@/interfaces/http/controllers/repair.controller'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return RepairController.getById(request, id)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return RepairController.update(request, id)
}
