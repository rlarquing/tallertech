import { NextRequest } from 'next/server'
import { AuthController } from '@/interfaces/http/controllers/auth.controller'

export async function GET(request: NextRequest) {
  return AuthController.session(request)
}
