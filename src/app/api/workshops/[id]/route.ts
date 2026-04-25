import { NextRequest } from 'next/server'
import { WorkshopController } from '@/interfaces/http/controllers/workshop.controller'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return WorkshopController.getById(request, id)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return WorkshopController.update(request, id)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return WorkshopController.delete(request, id)
}
