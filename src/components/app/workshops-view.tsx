'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Building2,
  Plus,
  Pencil,
  BarChart3,
  Users,
  Power,
  PowerOff,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  Globe,
  Crown,
  Shield,
  UserCircle,
  Trash2,
  Loader2,
  Store,
  UserPlus,
  AlertTriangle,
} from 'lucide-react'
import { offlineFetch } from '@/lib/offline-fetch'
import { workshopSchema } from '@/lib/validations'
import { z } from 'zod'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Workshop {
  id: string
  name: string
  slug: string
  description?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  currency: string
  timezone: string
  active: boolean
  createdAt: string
  updatedAt: string
  _count?: { members: number }
}

interface WorkshopMember {
  id: string
  userId: string
  workshopId: string
  role: string
  joinedAt: string
  user: {
    id: string
    name: string
    email: string
    image?: string | null
  }
}

interface WorkshopFormData {
  name: string
  description: string
  address: string
  phone: string
  email: string
  currency: string
  timezone: string
}

const emptyForm: WorkshopFormData = {
  name: '',
  description: '',
  address: '',
  phone: '',
  email: '',
  currency: 'CUP',
  timezone: 'America/Havana',
}

const roleLabels: Record<string, string> = {
  owner: 'Dueño',
  admin: 'Administrador',
  employee: 'Empleado',
}

const roleIcons: Record<string, React.ElementType> = {
  owner: Crown,
  admin: Shield,
  employee: UserCircle,
}

const roleBadgeClasses: Record<string, string> = {
  owner: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  admin: 'bg-violet-100 text-chart-2 dark:bg-violet-900/40 dark:text-violet-300',
  employee: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
}

const currencyLabels: Record<string, string> = {
  CUP: 'CUP - Peso Cubano',
  MLC: 'MLC - Moneda Libremente Convertible',
  USD: 'USD - Dólar Americano',
  EUR: 'EUR - Euro',
  ARS: 'ARS - Peso Argentino',
  BOB: 'BOB - Boliviano',
  MXN: 'MXN - Peso Mexicano',
  COP: 'COP - Peso Colombiano',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 60)
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function WorkshopsSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function WorkshopsView() {
  const { toast } = useToast()
  const { setCurrentView, setCurrentWorkshopId, workshops, setWorkshops, user } = useAppStore()

  // Data state
  const [workshopList, setWorkshopList] = useState<Workshop[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog states
  const [formOpen, setFormOpen] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null)
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null)
  const [deactivatingWorkshop, setDeactivatingWorkshop] = useState<Workshop | null>(null)
  const [formData, setFormData] = useState<WorkshopFormData>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Members state
  const [members, setMembers] = useState<WorkshopMember[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('employee')
  const [addingMember, setAddingMember] = useState(false)
  const [changingRole, setChangingRole] = useState<string | null>(null)
  const [memberEmailError, setMemberEmailError] = useState('')

  // Fetch workshops
  const fetchWorkshops = useCallback(async () => {
    setLoading(true)
    try {
      const res = await offlineFetch('/api/workshops')
      if (res.ok) {
        const data = await res.json()
        const list = data.data || []
        setWorkshopList(list)
        setWorkshops(
          list.map((w: Workshop) => ({
            id: w.id,
            name: w.name,
            slug: w.slug,
            role: (w as { role?: string }).role || 'employee',
            active: w.active,
          }))
        )
      }
    } catch {
      toast({ title: 'Error', description: 'Error al cargar talleres', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast, setWorkshops])

  useEffect(() => {
    fetchWorkshops()
  }, [fetchWorkshops])

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setFormData((prev) => ({ ...prev, name }))
  }

  // Open create dialog
  const handleAdd = () => {
    setEditingWorkshop(null)
    setFormData(emptyForm)
    setValidationErrors({})
    setFormOpen(true)
  }

  // Open edit dialog
  const handleEdit = (workshop: Workshop) => {
    setEditingWorkshop(workshop)
    setFormData({
      name: workshop.name,
      description: workshop.description || '',
      address: workshop.address || '',
      phone: workshop.phone || '',
      email: workshop.email || '',
      currency: workshop.currency || 'CUP',
      timezone: workshop.timezone || 'America/Havana',
    })
    setValidationErrors({})
    setFormOpen(true)
  }

  // Open members dialog
  const handleMembers = async (workshop: Workshop) => {
    setSelectedWorkshop(workshop)
    setMembersOpen(true)
    setMembersLoading(true)
    try {
      const res = await offlineFetch(`/api/workshops/${workshop.id}/members`)
      if (res.ok) {
        const data = await res.json()
        setMembers(data.data || [])
      }
    } catch {
      toast({ title: 'Error', description: 'Error al cargar miembros', variant: 'destructive' })
    } finally {
      setMembersLoading(false)
    }
  }

  // Open deactivate/activate dialog
  const handleToggleActive = (workshop: Workshop) => {
    setDeactivatingWorkshop(workshop)
    setDeactivateOpen(true)
  }

  // Navigate to BI
  const handleViewBI = (workshop: Workshop) => {
    setCurrentWorkshopId(workshop.id)
    setCurrentView('workshop-bi')
  }

  // Submit workshop form (create/update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate with Zod
    const result = workshopSchema.safeParse({
      name: formData.name,
      description: formData.description || undefined,
      address: formData.address || undefined,
      phone: formData.phone || undefined,
      email: formData.email || undefined,
      currency: formData.currency,
      timezone: formData.timezone,
    })
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
      const payload = {
        name: formData.name,
        slug: generateSlug(formData.name),
        description: formData.description || null,
        address: formData.address || null,
        phone: formData.phone || null,
        email: formData.email || null,
        currency: formData.currency,
        timezone: formData.timezone,
      }

      const url = editingWorkshop ? `/api/workshops/${editingWorkshop.id}` : '/api/workshops'
      const method = editingWorkshop ? 'PUT' : 'POST'

      const res = await offlineFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({ title: 'Error', description: data.error || 'Error al guardar taller', variant: 'destructive' })
        return
      }

      toast({
        title: editingWorkshop ? 'Taller actualizado' : 'Taller creado',
        description: editingWorkshop
          ? 'El taller se ha actualizado exitosamente'
          : 'El taller se ha creado exitosamente',
      })

      setFormOpen(false)
      fetchWorkshops()
    } catch {
      toast({ title: 'Error', description: 'Error de conexión', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  // Confirm toggle active
  const confirmToggleActive = async () => {
    if (!deactivatingWorkshop) return
    setSubmitting(true)

    try {
      const res = await offlineFetch(`/api/workshops/${deactivatingWorkshop.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !deactivatingWorkshop.active }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Error al cambiar estado', variant: 'destructive' })
        return
      }

      toast({
        title: deactivatingWorkshop.active ? 'Taller desactivado' : 'Taller activado',
        description: deactivatingWorkshop.active
          ? 'El taller ha sido desactivado'
          : 'El taller ha sido activado',
      })

      setDeactivateOpen(false)
      setDeactivatingWorkshop(null)
      fetchWorkshops()
    } catch {
      toast({ title: 'Error', description: 'Error de conexión', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  // Add member
  const handleAddMember = async () => {
    if (!selectedWorkshop || !newMemberEmail.trim()) return

    // Validate email
    const emailResult = z.string().min(1, { message: 'El email es requerido' }).email({ message: 'Formato de email inválido' }).safeParse(newMemberEmail.trim())
    if (!emailResult.success) {
      setMemberEmailError(emailResult.error.issues[0]?.message || 'Email inválido')
      return
    }
    setMemberEmailError('')
    setAddingMember(true)

    try {
      const res = await offlineFetch(`/api/workshops/${selectedWorkshop.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newMemberEmail.trim(), role: newMemberRole }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({ title: 'Error', description: data.error || 'Error al agregar miembro', variant: 'destructive' })
        return
      }

      toast({ title: 'Miembro agregado', description: 'El miembro se ha agregado exitosamente' })
      setNewMemberEmail('')
      setNewMemberRole('employee')
      setMemberEmailError('')
      // Refresh members
      const membersRes = await offlineFetch(`/api/workshops/${selectedWorkshop.id}/members`)
      if (membersRes.ok) {
        const membersData = await membersRes.json()
        setMembers(membersData.data || [])
      }
    } catch {
      toast({ title: 'Error', description: 'Error de conexión', variant: 'destructive' })
    } finally {
      setAddingMember(false)
    }
  }

  // Change member role
  const handleChangeRole = async (memberId: string, newRole: string) => {
    if (!selectedWorkshop) return
    setChangingRole(memberId)

    try {
      const res = await offlineFetch(`/api/workshops/${selectedWorkshop.id}/members/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Error al cambiar rol', variant: 'destructive' })
        return
      }

      toast({ title: 'Rol actualizado', description: 'El rol del miembro se ha actualizado' })
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      )
    } catch {
      toast({ title: 'Error', description: 'Error de conexión', variant: 'destructive' })
    } finally {
      setChangingRole(null)
    }
  }

  // Remove member
  const handleRemoveMember = async (memberId: string) => {
    if (!selectedWorkshop) return

    try {
      const res = await offlineFetch(`/api/workshops/${selectedWorkshop.id}/members/${memberId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Error al eliminar miembro', variant: 'destructive' })
        return
      }

      toast({ title: 'Miembro eliminado', description: 'El miembro ha sido eliminado del taller' })
      setMembers((prev) => prev.filter((m) => m.id !== memberId))
    } catch {
      toast({ title: 'Error', description: 'Error de conexión', variant: 'destructive' })
    }
  }

  // Get workshop role for current user
  const getWorkshopRole = (workshop: Workshop): string => {
    const ws = workshops.find((w) => w.id === workshop.id)
    return ws?.role || 'employee'
  }

  const isOwner = (workshop: Workshop): boolean => {
    return getWorkshopRole(workshop) === 'owner'
  }

  if (loading) {
    return <WorkshopsSkeleton />
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Mis Talleres</h2>
          <p className="text-sm text-muted-foreground">
            Gestiona tus talleres y consulta su rendimiento
          </p>
        </div>
        <Button onClick={handleAdd} className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
          <Plus className="mr-2 size-4" />
          Nuevo Taller
        </Button>
      </div>

      {/* Workshops Grid */}
      {workshopList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-muted mb-4">
              <Store className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No tienes talleres</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">
              Crea tu primer taller para comenzar a gestionar ventas, reparaciones e inventario.
            </p>
            <Button
              onClick={handleAdd}
              variant="outline"
              className="mt-4 border-primary text-primary hover:bg-primary/5"
            >
              <Plus className="mr-2 size-4" />
              Crear Taller
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {workshopList.map((workshop) => {
            const role = getWorkshopRole(workshop)
            const RoleIcon = roleIcons[role] || UserCircle
            const memberCount = workshop._count?.members || 0

            return (
              <Card
                key={workshop.id}
                className={`relative overflow-hidden transition-shadow hover:shadow-md ${
                  !workshop.active ? 'opacity-60' : ''
                }`}
              >
                {/* Active status indicator */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${
                    workshop.active ? 'bg-primary' : 'bg-gray-400'
                  }`}
                />

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Building2 className="size-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">{workshop.name}</CardTitle>
                        <p className="text-xs text-muted-foreground font-mono">/{workshop.slug}</p>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] px-1.5 py-0 shrink-0 ${roleBadgeClasses[role]}`}
                    >
                      <RoleIcon className="mr-1 size-3" />
                      {roleLabels[role] || role}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Details */}
                  <div className="space-y-1.5 text-sm">
                    {workshop.address && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="size-3.5 shrink-0" />
                        <span className="truncate">{workshop.address}</span>
                      </div>
                    )}
                    {workshop.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="size-3.5 shrink-0" />
                        <span>{workshop.phone}</span>
                      </div>
                    )}
                    {workshop.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="size-3.5 shrink-0" />
                        <span className="truncate">{workshop.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Badges row */}
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-xs">
                      <DollarSign className="mr-1 size-3" />
                      {workshop.currency}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Users className="mr-1 size-3" />
                      {memberCount} miembro{memberCount !== 1 ? 's' : ''}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        workshop.active
                          ? 'border-primary text-primary'
                          : 'border-gray-400 text-gray-500'
                      }`}
                    >
                      {workshop.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(workshop)}
                      className="text-xs h-8"
                    >
                      <Pencil className="mr-1 size-3" />
                      Editar
                    </Button>
                    {isOwner(workshop) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMembers(workshop)}
                        className="text-xs h-8"
                      >
                        <Users className="mr-1 size-3" />
                        Miembros
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewBI(workshop)}
                      className="text-xs h-8 border-primary text-primary hover:bg-primary/5"
                    >
                      <BarChart3 className="mr-1 size-3" />
                      BI
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(workshop)}
                      className={`text-xs h-8 ${
                        workshop.active
                          ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                          : 'text-primary hover:text-primary/80 hover:bg-primary/5'
                      }`}
                    >
                      {workshop.active ? (
                        <>
                          <PowerOff className="mr-1 size-3" />
                          Desactivar
                        </>
                      ) : (
                        <>
                          <Power className="mr-1 size-3" />
                          Activar
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ─── Create/Edit Workshop Dialog ──────────────────────────────── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingWorkshop ? 'Editar Taller' : 'Nuevo Taller'}
            </DialogTitle>
            <DialogDescription>
              {editingWorkshop
                ? 'Modifica los datos del taller'
                : 'Completa los datos para crear un nuevo taller'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="ws-name">Nombre del Taller *</Label>
                <Input
                  id="ws-name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ej: Taller Reparaciones Centro"
                  required
                />
                {validationErrors.name && (
                  <p className="text-xs text-destructive">{validationErrors.name}</p>
                )}
                {formData.name && (
                  <p className="text-xs text-muted-foreground">
                    Slug: <span className="font-mono">{generateSlug(formData.name)}</span>
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="ws-description">Descripción</Label>
                <Textarea
                  id="ws-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción breve del taller"
                  rows={2}
                />
              </div>

              {/* Address */}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="ws-address">Dirección</Label>
                <Input
                  id="ws-address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Calle, número, ciudad"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="ws-phone">Teléfono</Label>
                <Input
                  id="ws-phone"
                  value={formData.phone}
                  onChange={(e) => { setFormData({ ...formData, phone: e.target.value }); setValidationErrors((prev) => { const { phone, ...rest } = prev; return rest }) }}
                  placeholder="+53 5555-9999"
                />
                {validationErrors.phone && (
                  <p className="text-xs text-destructive">{validationErrors.phone}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="ws-email">Email</Label>
                <Input
                  id="ws-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setValidationErrors((prev) => { const { email, ...rest } = prev; return rest }) }}
                  placeholder="info@taller.com"
                />
                {validationErrors.email && (
                  <p className="text-xs text-destructive">{validationErrors.email}</p>
                )}
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <Label>Moneda</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(v) => { setFormData({ ...formData, currency: v }); setValidationErrors((prev) => { const { currency, ...rest } = prev; return rest }) }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CUP">CUP - Peso Cubano</SelectItem>
                    <SelectItem value="MLC">MLC - Moneda Libremente Convertible</SelectItem>
                    <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="ARS">ARS - Peso Argentino</SelectItem>
                    <SelectItem value="BOB">BOB - Boliviano</SelectItem>
                    <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                    <SelectItem value="COP">COP - Peso Colombiano</SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors.currency && (
                  <p className="text-xs text-destructive">{validationErrors.currency}</p>
                )}
              </div>

              {/* Timezone */}
              <div className="space-y-2">
                <Label>Zona Horaria</Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(v) => setFormData({ ...formData, timezone: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Havana">Cuba (UTC-5)</SelectItem>
                    <SelectItem value="America/Buenos_Aires">Argentina (UTC-3)</SelectItem>
                    <SelectItem value="America/Bogota">Colombia (UTC-5)</SelectItem>
                    <SelectItem value="America/Mexico_City">México (UTC-6)</SelectItem>
                    <SelectItem value="America/La_Paz">Bolivia (UTC-4)</SelectItem>
                    <SelectItem value="America/Lima">Perú (UTC-5)</SelectItem>
                    <SelectItem value="America/Santiago">Chile (UTC-4)</SelectItem>
                    <SelectItem value="Europe/Madrid">España (UTC+1)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting || !formData.name.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                {editingWorkshop ? 'Guardar Cambios' : 'Crear Taller'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Deactivate/Activate Confirmation ─────────────────────────── */}
      <AlertDialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              {deactivatingWorkshop?.active ? '¿Desactivar taller?' : '¿Activar taller?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deactivatingWorkshop?.active ? (
                <>
                  ¿Estás seguro de que deseas desactivar <strong>{deactivatingWorkshop?.name}</strong>?
                  El taller no estará disponible para operaciones hasta que se reactive.
                </>
              ) : (
                <>
                  ¿Deseas activar <strong>{deactivatingWorkshop?.name}</strong>?
                  El taller volverá a estar operativo.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmToggleActive}
              disabled={submitting}
              className={
                deactivatingWorkshop?.active
                  ? 'bg-destructive text-white hover:bg-destructive/90'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }
            >
              {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {deactivatingWorkshop?.active ? 'Desactivar' : 'Activar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Members Management Dialog ────────────────────────────────── */}
      <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="size-5" />
              Miembros de {selectedWorkshop?.name}
            </DialogTitle>
            <DialogDescription>
              Gestiona los miembros y sus roles en el taller
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Add Member Section */}
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-3 flex items-center gap-2">
                  <UserPlus className="size-4 text-primary" />
                  Agregar Miembro
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Email del usuario"
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => { setNewMemberEmail(e.target.value); setMemberEmailError('') }}
                    className="flex-1"
                  />
                  {memberEmailError && (
                    <p className="text-xs text-destructive sm:col-span-3">{memberEmailError}</p>
                  )}
                  <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="employee">Empleado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAddMember}
                    disabled={addingMember || !newMemberEmail.trim()}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
                  >
                    {addingMember ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Members Table */}
            {membersLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="size-9 rounded-full" />
                    <Skeleton className="h-5 flex-1" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                ))}
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No hay miembros en este taller
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="hidden sm:table-cell">Email</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead className="hidden md:table-cell">Desde</TableHead>
                      <TableHead className="w-[60px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => {
                      const MemberRoleIcon = roleIcons[member.role] || UserCircle
                      return (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                                {member.user.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </div>
                              <span className="font-medium text-sm">{member.user.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                            {member.user.email}
                          </TableCell>
                          <TableCell>
                            {member.role === 'owner' ? (
                              <Badge
                                variant="secondary"
                                className={`text-[10px] ${roleBadgeClasses.owner}`}
                              >
                                <Crown className="mr-1 size-3" />
                                Dueño
                              </Badge>
                            ) : (
                              <Select
                                value={member.role}
                                onValueChange={(v) => handleChangeRole(member.id, v)}
                                disabled={changingRole === member.id}
                              >
                                <SelectTrigger className="h-7 w-[130px] text-xs">
                                  {changingRole === member.id ? (
                                    <Loader2 className="size-3 animate-spin" />
                                  ) : (
                                    <SelectValue />
                                  )}
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Administrador</SelectItem>
                                  <SelectItem value="employee">Empleado</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                            {new Date(member.joinedAt).toLocaleDateString('es-BO', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </TableCell>
                          <TableCell>
                            {member.role !== 'owner' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleRemoveMember(member.id)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
