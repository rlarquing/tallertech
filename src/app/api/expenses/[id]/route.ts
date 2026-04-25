import { NextRequest } from 'next/server'
import { ExpenseController } from '@/interfaces/http/controllers/expense.controller'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return ExpenseController.update(request, id)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return ExpenseController.delete(request, id)
}
