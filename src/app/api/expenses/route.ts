import { NextRequest } from 'next/server'
import { ExpenseController } from '@/interfaces/http/controllers/expense.controller'

export async function GET(request: NextRequest) {
  return ExpenseController.list(request)
}

export async function POST(request: NextRequest) {
  return ExpenseController.create(request)
}
