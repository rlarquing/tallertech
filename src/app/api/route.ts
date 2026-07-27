import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ message: 'GesTaPlus API - Gestión inteligente para tu taller' })
}
