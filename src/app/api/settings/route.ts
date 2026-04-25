import { NextRequest } from 'next/server'
import { SettingsController } from '@/interfaces/http/controllers/settings.controller'

export async function GET(request: NextRequest) {
  return SettingsController.get(request)
}

export async function POST(request: NextRequest) {
  return SettingsController.update(request)
}
