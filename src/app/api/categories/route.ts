import { NextRequest } from 'next/server'
import { CategoryController } from '@/interfaces/http/controllers/category.controller'

export async function GET(request: NextRequest) {
  return CategoryController.list(request)
}

export async function POST(request: NextRequest) {
  return CategoryController.create(request)
}
