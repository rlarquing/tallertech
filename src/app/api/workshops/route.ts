import { NextRequest } from 'next/server'
import { WorkshopController } from '@/interfaces/http/controllers/workshop.controller'

export async function GET(request: NextRequest) {
  return WorkshopController.list(request)
}

export async function POST(request: NextRequest) {
  return WorkshopController.create(request)
}
