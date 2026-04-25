import { NextRequest } from 'next/server'
import { SupplierController } from '@/interfaces/http/controllers/supplier.controller'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return SupplierController.update(request, id)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return SupplierController.delete(request, id)
}
