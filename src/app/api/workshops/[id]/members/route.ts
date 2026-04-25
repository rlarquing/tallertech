import { NextRequest } from 'next/server'
import { WorkshopController } from '@/interfaces/http/controllers/workshop.controller'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return WorkshopController.getMembers(request, id)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return WorkshopController.addMember(request, id)
}
