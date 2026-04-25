'use client'

import { AuthProvider } from '@/components/app/auth-provider'
import { AppShell } from '@/components/app/app-shell'

export default function Home() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
