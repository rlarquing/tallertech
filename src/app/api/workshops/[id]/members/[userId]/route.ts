import { NextRequest } from 'next/server'
import { WorkshopController } from '@/interfaces/http/controllers/workshop.controller'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; userId: string }> }) {
  const { id, userId } = await params
  return WorkshopController.updateMember(request, id, userId)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; userId: string }> }) {
  const { id, userId } = await params
  return WorkshopController.removeMember(request, id, userId)
}
