'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Settings,
  Store,
  DollarSign,
  User,
  Shield,
  Loader2,
  Save,
  AlertTriangle,
  Trash2,
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  FileDown,
  Database,
  HardDrive,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAppStore } from '@/lib/store'

interface SettingsMap {
  shop_name?: string
  shop_phone?: string
  shop_address?: string
  shop_email?: string
  shop_logo?: string
  currency?: string
  tax_rate?: string
  low_stock_threshold?: string
  receipt_footer?: string
}

export function SettingsView() {
  const { toast } = useToast()
  const { user } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [resetting, setResetting] = useState(false)

  // Business info
  const [shopName, setShopName] = useState('')
  const [shopPhone, setShopPhone] = useState('')
  const [shopAddress, setShopAddress] = useState('')
  const [shopEmail, setShopEmail] = useState('')
  const [shopLogo, setShopLogo] = useState('')

  // Currency & tax
  const [currency, setCurrency] = useState('ARS')
  const [taxRate, setTaxRate] = useState('21')

  // Inventory
  const [lowStockThreshold, setLowStockThreshold] = useState('5')

  // Receipt
  const [receiptFooter, setReceiptFooter] = useState('')

  // User profile
  const [userName, setUserName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)

  // Backup & Restore
  const [backingUp, setBackingUp] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [restoreOpen, setRestoreOpen] = useState(false)
  const [dbStats, setDbStats] = useState<{ fileSize: number; tables: { name: string; count: number }[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Export
  const [exportEntity, setExportEntity] = useState('sales')
  const [exportFormat, setExportFormat] = useState('xlsx')
  const [exporting, setExporting] = useState(false)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        const settings = data.data as SettingsMap
        setShopName(settings.shop_name || '')
        setShopPhone(settings.shop_phone || '')
        setShopAddress(settings.shop_address || '')
        setShopEmail(settings.shop_email || '')
        setShopLogo(settings.shop_logo || '')
        setCurrency(settings.currency || 'ARS')
        setTaxRate(settings.tax_rate || '21')
        setLowStockThreshold(settings.low_stock_threshold || '5')
        setReceiptFooter(settings.receipt_footer || '')
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchDbStats = useCallback(async () => {
    try {
      const res = await fetch('/api/backup/stats')
      if (res.ok) {
        const data = await res.json()
        setDbStats(data)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    fetchSettings()
    fetchDbStats()
    if (user) {
      setUserName(user.name)
    }
  }, [fetchSettings, fetchDbStats, user])

  const saveSetting = async (key: string, value: string) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al guardar')
      }
    } catch (error) {
      throw error
    }
  }

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await Promise.all([
        saveSetting('shop_name', shopName),
        saveSetting('shop_phone', shopPhone),
        saveSetting('shop_address', shopAddress),
        saveSetting('shop_email', shopEmail),
        saveSetting('shop_logo', shopLogo),
      ])
      toast({ title: 'Guardado', description: 'Información del negocio actualizada' })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al guardar',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveFinance = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await Promise.all([
        saveSetting('currency', currency),
        saveSetting('tax_rate', taxRate),
        saveSetting('low_stock_threshold', lowStockThreshold),
        saveSetting('receipt_footer', receiptFooter),
      ])
      toast({ title: 'Guardado', description: 'Configuración financiera actualizada' })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al guardar',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword && newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Las contraseñas no coinciden', variant: 'destructive' })
      return
    }
    if (newPassword && newPassword.length < 6) {
      toast({ title: 'Error', description: 'La contraseña debe tener al menos 6 caracteres', variant: 'destructive' })
      return
    }
    setProfileSaving(true)
    try {
      if (userName.trim() !== user?.name) {
        useAppStore.getState().setUser({ ...useAppStore.getState().user!, name: userName.trim() })
      }
      toast({ title: 'Perfil actualizado', description: 'Sus datos se actualizaron correctamente' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      toast({ title: 'Error', description: 'Error al actualizar perfil', variant: 'destructive' })
    } finally {
      setProfileSaving(false)
    }
  }

  const handleResetData = async () => {
    setResetting(true)
    try {
      const res = await fetch('/api/seed?force=true', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: 'Error', description: data.error || 'Error al reiniciar datos', variant: 'destructive' })
        return
      }
      toast({ title: 'Datos reiniciados', description: 'Los datos demo se han restaurado correctamente' })
      setResetOpen(false)
      fetchSettings()
    } catch {
      toast({ title: 'Error', description: 'Error de conexión', variant: 'destructive' })
    } finally {
      setResetting(false)
    }
  }

  // ─── Backup ─────────────────────────────────────────────────────

  const handleBackup = async () => {
    setBackingUp(true)
    try {
      const res = await fetch('/api/backup')
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al crear backup')
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `TallerTech_backup_${new Date().toISOString().split('T')[0]}.db`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast({ title: 'Backup descargado', description: 'La copia de seguridad se ha descargado exitosamente' })
      fetchDbStats()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al crear backup',
        variant: 'destructive',
      })
    } finally {
      setBackingUp(false)
    }
  }

  const handleRestore = async () => {
    const fileInput = fileInputRef.current
    if (!fileInput?.files?.length) {
      toast({ title: 'Error', description: 'Seleccione un archivo de backup', variant: 'destructive' })
      return
    }

    setRestoring(true)
    try {
      const formData = new FormData()
      formData.append('file', fileInput.files[0])

      const res = await fetch('/api/backup', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Error al restaurar')
      }

      toast({ title: 'Base de datos restaurada', description: data.message })
      setRestoreOpen(false)
      fetchDbStats()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al restaurar backup',
        variant: 'destructive',
      })
    } finally {
      setRestoring(false)
    }
  }

  // ─── Export ─────────────────────────────────────────────────────

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams({
        format: exportFormat,
        entity: exportEntity,
      })
      const res = await fetch(`/api/export?${params}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al exportar')
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const contentDisposition = res.headers.get('content-disposition')
      const filenameMatch = contentDisposition?.match(/filename="?(.+?)"?$/)
      a.download = filenameMatch?.[1] || `TallerTech_${exportEntity}_${new Date().toISOString().split('T')[0]}.${exportFormat}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast({ title: 'Exportación completada', description: `Datos de ${exportEntity} exportados en formato ${exportFormat.toUpperCase()}` })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al exportar',
        variant: 'destructive',
      })
    } finally {
      setExporting(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando configuración...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Configuración</h2>
      </div>

      <Tabs defaultValue="business" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="business">Negocio</TabsTrigger>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="export">Exportar</TabsTrigger>
        </TabsList>

        {/* ── Business Tab ─────────────────────────────────────────── */}
        <TabsContent value="business" className="space-y-6 mt-4">
          {/* Business Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-base">Información del Negocio</CardTitle>
                  <CardDescription>Datos de su taller que aparecerán en recibos y documentos</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveBusiness} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="shopName">Nombre del Negocio</Label>
                    <Input id="shopName" value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="TallerTech" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="shopLogo">Texto Logo</Label>
                    <Input id="shopLogo" value={shopLogo} onChange={(e) => setShopLogo(e.target.value)} placeholder="TT" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="shopPhone">Teléfono</Label>
                    <Input id="shopPhone" value={shopPhone} onChange={(e) => setShopPhone(e.target.value)} placeholder="+53 5555-9999" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="shopEmail">Email</Label>
                    <Input id="shopEmail" type="email" value={shopEmail} onChange={(e) => setShopEmail(e.target.value)} placeholder="info@tallertech.com" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="shopAddress">Dirección</Label>
                  <Input id="shopAddress" value={shopAddress} onChange={(e) => setShopAddress(e.target.value)} placeholder="Calle Ejemplo 123" />
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Guardar Información
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Currency & Tax */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-base">Moneda e Impuestos</CardTitle>
                  <CardDescription>Configuración de moneda y tasas de impuesto</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveFinance} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Moneda</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CUP">CUP - Peso Cubano</SelectItem>
                        <SelectItem value="MLC">MLC - Moneda Libremente Convertible</SelectItem>
                        <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="taxRate">Tasa de Impuesto (%)</Label>
                    <Input id="taxRate" type="number" min="0" max="100" step="0.5" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="lowStock">Umbral Stock Bajo</Label>
                    <Input id="lowStock" type="number" min="0" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} placeholder="5" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="receiptFooter">Pie de Recibo</Label>
                    <Input id="receiptFooter" value={receiptFooter} onChange={(e) => setReceiptFooter(e.target.value)} placeholder="Gracias por su compra!" />
                  </div>
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Guardar Configuración
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-destructive" />
                <div>
                  <CardTitle className="text-base text-destructive">Zona de Peligro</CardTitle>
                  <CardDescription>Acciones irreversibles que afectan todos los datos</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">Restaurar Datos Demo</p>
                  <p className="text-sm text-muted-foreground">Eliminar todos los datos actuales y restaurar datos de demostración</p>
                </div>
                <Button variant="destructive" onClick={() => setResetOpen(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Restaurar Datos
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Profile Tab ──────────────────────────────────────────── */}
        <TabsContent value="profile" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-base">Perfil de Usuario</CardTitle>
                  <CardDescription>Actualice su información personal</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="userName">Nombre</Label>
                  <Input id="userName" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Su nombre" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={user?.email || ''} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">El email no puede ser cambiado</p>
                </div>
                {user?.provider === 'google' ? (
                  <div className="flex items-center gap-2 p-3 bg-sky-50 dark:bg-sky-950/30 rounded-lg">
                    <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    <p className="text-sm text-muted-foreground">Cuenta vinculada con Google</p>
                  </div>
                ) : (
                  <>
                    <Separator />
                    <p className="text-sm font-medium">Cambiar Contraseña</p>
                    <div className="grid gap-2">
                      <Label htmlFor="currentPassword">Contraseña Actual</Label>
                      <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="newPassword">Nueva Contraseña</Label>
                        <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                        <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita la contraseña" />
                      </div>
                    </div>
                  </>
                )}
                <Button type="submit" disabled={profileSaving}>
                  {profileSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Guardar Perfil
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Backup Tab ───────────────────────────────────────────── */}
        <TabsContent value="backup" className="space-y-6 mt-4">
          {/* Database Stats */}
          {dbStats && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-base">Estado de la Base de Datos</CardTitle>
                    <CardDescription>Información del almacenamiento actual</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                    <HardDrive className="size-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tamaño del archivo</p>
                    <p className="text-lg font-bold">{formatFileSize(dbStats.fileSize)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {dbStats.tables.map((table) => (
                    <div key={table.name} className="text-center p-2 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold">{table.count}</p>
                      <p className="text-xs text-muted-foreground capitalize">{table.name}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Backup */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-base">Copia de Seguridad</CardTitle>
                  <CardDescription>Descargue una copia completa de la base de datos</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  La copia de seguridad incluye todos los datos del sistema: productos, ventas, reparaciones, clientes, gastos, configuración y registros de auditoría.
                  Se descargará como un archivo SQLite (.db) que puede restaurar en cualquier momento.
                </p>
                <Button onClick={handleBackup} disabled={backingUp} className="w-full sm:w-auto">
                  {backingUp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  Descargar Backup
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Restore */}
          <Card className="border-amber-500/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-amber-600" />
                <div>
                  <CardTitle className="text-base">Restaurar Base de Datos</CardTitle>
                  <CardDescription>Restaurar desde un archivo de backup previamente descargado</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                  <p className="text-sm">
                    <strong>Precaución:</strong> Restaurar reemplazará todos los datos actuales.
                    Se creará automáticamente un backup de seguridad antes de restaurar.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".db,.sqlite,.sqlite3"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    className="border-amber-500 text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/20"
                    onClick={() => setRestoreOpen(true)}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Restaurar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Export Tab ───────────────────────────────────────────── */}
        <TabsContent value="export" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-base">Exportar Datos</CardTitle>
                  <CardDescription>Exporte sus datos en diferentes formatos para análisis o respaldo</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Datos a Exportar</Label>
                    <Select value={exportEntity} onValueChange={setExportEntity}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sales">Ventas</SelectItem>
                        <SelectItem value="products">Productos</SelectItem>
                        <SelectItem value="repairs">Reparaciones</SelectItem>
                        <SelectItem value="customers">Clientes</SelectItem>
                        <SelectItem value="expenses">Gastos</SelectItem>
                        <SelectItem value="stock">Movimientos de Stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Formato</Label>
                    <Select value={exportFormat} onValueChange={setExportFormat}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                        <SelectItem value="csv">CSV (.csv)</SelectItem>
                        <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Format descriptions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className={`p-3 rounded-lg border ${exportFormat === 'xlsx' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <FileSpreadsheet className="size-4 text-emerald-600" />
                      <span className="text-sm font-medium">Excel</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Formato nativo de Excel con columnas ajustadas. Ideal para análisis.</p>
                  </div>
                  <div className={`p-3 rounded-lg border ${exportFormat === 'csv' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="size-4 text-sky-600" />
                      <span className="text-sm font-medium">CSV</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Formato de texto separado por comas. Compatible con todo.</p>
                  </div>
                  <div className={`p-3 rounded-lg border ${exportFormat === 'pdf' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <FileDown className="size-4 text-rose-600" />
                      <span className="text-sm font-medium">PDF</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Documento con formato profesional para impresión o archivo.</p>
                  </div>
                </div>

                <Button onClick={handleExport} disabled={exporting} className="w-full sm:w-auto">
                  {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  Exportar {exportEntity === 'sales' ? 'Ventas' : exportEntity === 'products' ? 'Productos' : exportEntity === 'repairs' ? 'Reparaciones' : exportEntity === 'customers' ? 'Clientes' : exportEntity === 'expenses' ? 'Gastos' : 'Stock'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reset Confirmation */}
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              ¿Restaurar datos demo?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará todos los datos actuales y los reemplazará con datos de demostración. Esta acción NO se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetData}
              disabled={resetting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {resetting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Restaurando...</> : 'Sí, Restaurar Datos'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation */}
      <AlertDialog open={restoreOpen} onOpenChange={setRestoreOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              ¿Restaurar base de datos?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción reemplazará todos los datos actuales con el archivo seleccionado.
              Se creará automáticamente un backup de seguridad antes de restaurar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoring}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              disabled={restoring}
            >
              {restoring ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Restaurando...</> : 'Sí, Restaurar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
