import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ message: 'TallerTech API v2 - Clean Architecture' })
}
