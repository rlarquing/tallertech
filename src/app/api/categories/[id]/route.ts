import { NextRequest } from 'next/server'
import { CategoryController } from '@/interfaces/http/controllers/category.controller'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return CategoryController.update(request, id)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return CategoryController.delete(request, id)
}
