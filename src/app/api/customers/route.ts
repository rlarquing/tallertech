import { NextRequest } from 'next/server'
import { CustomerController } from '@/interfaces/http/controllers/customer.controller'

export async function GET(request: NextRequest) {
  return CustomerController.list(request)
}

export async function POST(request: NextRequest) {
  return CustomerController.create(request)
}
