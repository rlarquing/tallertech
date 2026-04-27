'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useAppStore, type UserInfo, type WorkshopInfo } from '@/lib/store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Mail, Lock, User, Loader2, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { offlineFetch } from '@/lib/offline-fetch'
import { loginSchema, registerSchema } from '@/lib/validations'

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
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

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

  const clearFieldError = (field: string) => {
    setValidationErrors((prev) => {
      const { [field]: _, ...rest } = prev
      return rest
    })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate with Zod
    const result = loginSchema.safeParse({ email: loginEmail, password: loginPassword })
    if (!result.success) {
      const errors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const field = issue.path.join('.')
        if (!errors[field]) errors[field] = issue.message
      }
      setValidationErrors(errors)
      return
    }
    setValidationErrors({})
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

    // Validate with Zod
    const result = registerSchema.safeParse({ name: registerName, email: registerEmail, password: registerPassword })
    if (!result.success) {
      const errors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const field = issue.path.join('.')
        if (!errors[field]) errors[field] = issue.message
      }
      setValidationErrors(errors)
      return
    }
    setValidationErrors({})
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
              setValidationErrors({})
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
                        onChange={(e) => { setLoginEmail(e.target.value); clearFieldError('email') }}
                        className="pl-9"
                        required
                        disabled={submitting}
                      />
                    </div>
                    {validationErrors.email && (
                      <p className="text-xs text-destructive">{validationErrors.email}</p>
                    )}
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
                        onChange={(e) => { setLoginPassword(e.target.value); clearFieldError('password') }}
                        className="pl-9"
                        required
                        disabled={submitting}
                      />
                    </div>
                    {validationErrors.password && (
                      <p className="text-xs text-destructive">{validationErrors.password}</p>
                    )}
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
                        onChange={(e) => { setRegisterName(e.target.value); clearFieldError('name') }}
                        className="pl-9"
                        required
                        disabled={submitting}
                      />
                    </div>
                    {validationErrors.name && (
                      <p className="text-xs text-destructive">{validationErrors.name}</p>
                    )}
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
                        onChange={(e) => { setRegisterEmail(e.target.value); clearFieldError('email') }}
                        className="pl-9"
                        required
                        disabled={submitting}
                      />
                    </div>
                    {validationErrors.email && (
                      <p className="text-xs text-destructive">{validationErrors.email}</p>
                    )}
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
                        onChange={(e) => { setRegisterPassword(e.target.value); clearFieldError('password') }}
                        className="pl-9"
                        required
                        minLength={6}
                        disabled={submitting}
                      />
                    </div>
                    {validationErrors.password && (
                      <p className="text-xs text-destructive">{validationErrors.password}</p>
                    )}
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
