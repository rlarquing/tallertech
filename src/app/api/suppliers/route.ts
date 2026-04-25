import { NextRequest } from 'next/server'
import { SupplierController } from '@/interfaces/http/controllers/supplier.controller'

export async function GET(request: NextRequest) {
  return SupplierController.list(request)
}

export async function POST(request: NextRequest) {
  return SupplierController.create(request)
}
