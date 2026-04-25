'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useAppStore, type UserInfo, type WorkshopInfo } from '@/lib/store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Wrench, Mail, Lock, User, Loader2, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { offlineFetch } from '@/lib/offline-fetch'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, setUser, isAuthenticated, setWorkshops, setCurrentWorkshopId, currentWorkshopId } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form fields
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')

  // Check session on mount
  const checkSession = useCallback(async () => {
    try {
      const res = await offlineFetch('/api/auth/session')
      if (res.ok) {
        const data = await res.json()
        if (data.isAuthenticated && data.user) {
          setUser(data.user as UserInfo)
        } else if (data.user) {
          setUser(data.user as UserInfo)
        }
      }
    } catch {
      // Session check failed, stay on login
    } finally {
      setLoading(false)
    }
  }, [setUser])

  // Fetch user's workshops
  const fetchWorkshops = useCallback(async () => {
    try {
      const res = await offlineFetch('/api/workshops')
      if (res.ok) {
        const data = await res.json()
        const ws = (data.data || []) as WorkshopInfo[]
        setWorkshops(ws)
        if (ws.length > 0 && !currentWorkshopId) {
          setCurrentWorkshopId(ws[0].id)
        }
      }
    } catch {
      // Silently fail - workshops are optional
    }
  }, [setWorkshops, setCurrentWorkshopId, currentWorkshopId])

  useEffect(() => {
    checkSession()
  }, [checkSession])

  // Fetch workshops when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchWorkshops()
    }
  }, [isAuthenticated, user, fetchWorkshops])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const res = await offlineFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesión')
        return
      }

      setUser(data.user as UserInfo)
      // Fetch workshops after successful login
      try {
        const wsRes = await offlineFetch('/api/workshops')
        if (wsRes.ok) {
          const wsData = await wsRes.json()
          const ws = (wsData.data || []) as WorkshopInfo[]
          setWorkshops(ws)
          if (ws.length > 0) {
            setCurrentWorkshopId(ws[0].id)
          }
        }
      } catch {
        // Silently fail
      }
    } catch {
      setError('Error de conexión. Intente de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const res = await offlineFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          password: registerPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al crear cuenta')
        return
      }

      setUser(data.user as UserInfo)
      // Fetch workshops after successful registration
      try {
        const wsRes = await offlineFetch('/api/workshops')
        if (wsRes.ok) {
          const wsData = await wsRes.json()
          const ws = (wsData.data || []) as WorkshopInfo[]
          setWorkshops(ws)
          if (ws.length > 0) {
            setCurrentWorkshopId(ws[0].id)
          }
        }
      } catch {
        // Silently fail
      }
    } catch {
      setError('Error de conexión. Intente de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError(null)
    setSubmitting(true)

    try {
      // Load Google Identity Services
      if (typeof window === 'undefined' || !window.google) {
        setError('Google Sign-In no está disponible. Use credenciales.')
        setSubmitting(false)
        return
      }

      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setError('No se pudo mostrar Google Sign-In. Use credenciales.')
          setSubmitting(false)
        }
      })
    } catch {
      setError('Error al iniciar con Google.')
      setSubmitting(false)
    }
  }

  // Handle Google credential response
  const handleGoogleCredential = useCallback(async (response: { credential: string }) => {
    try {
      const res = await offlineFetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.credential }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al autenticar con Google')
        return
      }

      setUser(data.user as UserInfo)
      // Fetch workshops after Google auth
      try {
        const wsRes = await offlineFetch('/api/workshops')
        if (wsRes.ok) {
          const wsData = await wsRes.json()
          const ws = (wsData.data || []) as WorkshopInfo[]
          setWorkshops(ws)
          if (ws.length > 0) {
            setCurrentWorkshopId(ws[0].id)
          }
        }
      } catch {
        // Silently fail
      }
    } catch {
      setError('Error de conexión con Google.')
    } finally {
      setSubmitting(false)
    }
  }, [setUser, setWorkshops, setCurrentWorkshopId])

  // Initialize Google Sign-In
  useEffect(() => {
    if (typeof window === 'undefined') return

    const initGoogle = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
          callback: handleGoogleCredential,
          auto_select: false,
        })
      }
    }

    // Load Google script if not already loaded
    if (!window.google) {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = initGoogle
      document.head.appendChild(script)
    } else {
      initGoogle()
    }
  }, [handleGoogleCredential])

  // Loading state - check session
  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Image
              src="/logo-generated.png"
              alt="TallerTech"
              width={64}
              height={64}
              className="rounded-2xl shadow-lg"
            />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Cargando...</span>
          </div>
        </div>
      </div>
    )
  }

  // Authenticated - show main app
  if (isAuthenticated && user) {
    return <>{children}</>
  }

  // Not authenticated - show login/register
  return (
    <div className="flex min-h-svh items-center justify-center bg-gradient-to-br from-emerald-50 via-background to-emerald-50 dark:from-emerald-950/20 dark:via-background dark:to-emerald-950/20 p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="relative">
            <Image
              src="/logo-generated.png"
              alt="TallerTech"
              width={64}
              height={64}
              className="rounded-2xl shadow-lg shadow-primary/25"
            />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              TallerTech
            </h1>
            <p className="text-sm text-muted-foreground">
              Sistema de Gestión para Talleres
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <Card className="border-border/50 shadow-xl">
          <Tabs
            value={authMode}
            onValueChange={(v) => {
              setAuthMode(v as 'login' | 'register')
              setError(null)
            }}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="register">Registrarse</TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Bienvenido de vuelta</CardTitle>
                <CardDescription>
                  Ingrese sus credenciales para acceder al sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  {error && (
                    <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {error}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="correo@ejemplo.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-9"
                        required
                        disabled={submitting}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-9"
                        required
                        disabled={submitting}
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Iniciando sesión...
                      </>
                    ) : (
                      'Iniciar Sesión'
                    )}
                  </Button>

                  {/* Divider */}
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        o continuar con
                      </span>
                    </div>
                  </div>

                  {/* Google Sign-In Button */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    disabled={submitting}
                    onClick={handleGoogleLogin}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Iniciar con Google
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Demo: admin@tallertech.com / admin123
                  </p>
                </form>
              </CardContent>
            </TabsContent>

            {/* Register Form */}
            <TabsContent value="register">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Crear cuenta</CardTitle>
                <CardDescription>
                  Regístrese para comenzar a usar el sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  {error && (
                    <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {error}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Nombre</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Su nombre completo"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        className="pl-9"
                        required
                        disabled={submitting}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="correo@ejemplo.com"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        className="pl-9"
                        required
                        disabled={submitting}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        className="pl-9"
                        required
                        minLength={6}
                        disabled={submitting}
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creando cuenta...
                      </>
                    ) : (
                      'Crear Cuenta'
                    )}
                  </Button>

                  {/* Divider */}
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        o registrarse con
                      </span>
                    </div>
                  </div>

                  {/* Google Sign-In Button */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    disabled={submitting}
                    onClick={handleGoogleLogin}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Registrarse con Google
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          TallerTech © {new Date().getFullYear()} — Sistema de Gestión
        </p>
      </div>
    </div>
  )
}
