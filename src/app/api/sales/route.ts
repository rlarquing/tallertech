import { NextRequest } from 'next/server'
import { SaleController } from '@/interfaces/http/controllers/sale.controller'

export async function GET(request: NextRequest) {
  return SaleController.list(request)
}

export async function POST(request: NextRequest) {
  return SaleController.create(request)
}
