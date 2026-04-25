import { NextRequest } from 'next/server'
import { StockController } from '@/interfaces/http/controllers/stock.controller'

export async function GET(request: NextRequest) {
  return StockController.list(request)
}

export async function POST(request: NextRequest) {
  return StockController.adjust(request)
}
