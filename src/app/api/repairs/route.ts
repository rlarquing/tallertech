import { NextRequest } from 'next/server'
import { RepairController } from '@/interfaces/http/controllers/repair.controller'

export async function GET(request: NextRequest) {
  return RepairController.list(request)
}

export async function POST(request: NextRequest) {
  return RepairController.create(request)
}
