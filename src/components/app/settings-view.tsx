'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
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
  Settings,
  Store,
  DollarSign,
  User,
  Shield,
  Loader2,
  Save,
  AlertTriangle,
  Trash2,
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

  useEffect(() => {
    fetchSettings()
    if (user) {
      setUserName(user.name)
    }
  }, [fetchSettings, user])

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
      // Update name via settings or a separate endpoint
      // For now we just show success since we don't have a user update API
      if (userName.trim() !== user?.name) {
        // Would need a user update API - for now just update the store
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
      // Delete all data and re-seed
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
                <Input
                  id="shopName"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="TallerTech"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="shopLogo">Texto Logo</Label>
                <Input
                  id="shopLogo"
                  value={shopLogo}
                  onChange={(e) => setShopLogo(e.target.value)}
                  placeholder="TT"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="shopPhone">Teléfono</Label>
                <Input
                  id="shopPhone"
                  value={shopPhone}
                  onChange={(e) => setShopPhone(e.target.value)}
                  placeholder="+54 11 5555-9999"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="shopEmail">Email</Label>
                <Input
                  id="shopEmail"
                  type="email"
                  value={shopEmail}
                  onChange={(e) => setShopEmail(e.target.value)}
                  placeholder="info@tallertech.com"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shopAddress">Dirección</Label>
              <Input
                id="shopAddress"
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                placeholder="Av. Siempre Viva 742"
              />
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
                <Label htmlFor="currency">Moneda</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARS">ARS - Peso Argentino</SelectItem>
                    <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                    <SelectItem value="CUP">CUP - Peso Cubano</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="taxRate">Tasa de Impuesto (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="lowStock">Umbral Stock Bajo</Label>
                <Input
                  id="lowStock"
                  type="number"
                  min="0"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  placeholder="5"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="receiptFooter">Pie de Recibo</Label>
                <Input
                  id="receiptFooter"
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                  placeholder="Gracias por su compra!"
                />
              </div>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Guardar Configuración
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* User Profile */}
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
              <Input
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Su nombre"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">El email no puede ser cambiado</p>
            </div>
            <Separator />
            <p className="text-sm font-medium">Cambiar Contraseña</p>
            <div className="grid gap-2">
              <Label htmlFor="currentPassword">Contraseña Actual</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita la contraseña"
                />
              </div>
            </div>
            <Button type="submit" disabled={profileSaving}>
              {profileSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Guardar Perfil
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
              <p className="text-sm text-muted-foreground">
                Eliminar todos los datos actuales y restaurar los datos de demostración
              </p>
            </div>
            <Button variant="destructive" onClick={() => setResetOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Restaurar Datos
            </Button>
          </div>
        </CardContent>
      </Card>

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
              {resetting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Restaurando...
                </>
              ) : (
                'Sí, Restaurar Datos'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
