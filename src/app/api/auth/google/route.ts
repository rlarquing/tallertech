import { NextRequest } from 'next/server'
import { AuthController } from '@/interfaces/http/controllers/auth.controller'

export async function POST(request: NextRequest) {
  return AuthController.googleAuth(request)
}
