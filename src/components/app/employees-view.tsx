'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Users,
  Plus,
  MoreHorizontal,
  Loader2,
  Mail,
  Shield,
  UserPlus,
  Trash2,
  ShoppingCart,
  Wrench,
  DollarSign,
  CalendarDays,
  Pencil,
  Key,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { offlineFetch } from '@/lib/offline-fetch'
import { useAppStore } from '@/lib/store'

interface Member {
  id: string
  userId: string
  userName: string
  userEmail: string
  userImage?: string | null
  role: string
  joinedAt: string
}

interface CreateEmployeeForm {
  name: string
  email: string
  password: string
  role: string
}

interface EditEmployeeForm {
  name: string
  email: string
  password: string
}

const emptyCreateForm: CreateEmployeeForm = {
  name: '',
  email: '',
  password: '',
  role: 'employee',
}

const roleLabels: Record<string, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  employee: 'Empleado',
}

const roleBadgeClasses: Record<string, string> = {
  owner: 'bg-primary/10 text-primary',
  admin: 'bg-chart-2/10 text-chart-2',
  employee: 'bg-muted text-muted-foreground',
}

export function EmployeesView() {
  const { toast } = useToast()
  const { currentWorkshopId, workshops, user } = useAppStore()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  // Create employee dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CreateEmployeeForm>(emptyCreateForm)
  const [creating, setCreating] = useState(false)

  // Edit employee dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editMember, setEditMember] = useState<Member | null>(null)
  const [editForm, setEditForm] = useState<EditEmployeeForm>({ name: '', email: '', password: '' })
  const [editing, setEditing] = useState(false)

  // Remove employee dialog
  const [removeMember, setRemoveMember] = useState<Member | null>(null)
  const [removeOpen, setRemoveOpen] = useState(false)

  // Activity data
  const [employeeActivities, setEmployeeActivities] = useState<Record<string, { salesCount: number; salesTotal: number; repairsCount: number }>>({})
  const [activitiesLoading, setActivitiesLoading] = useState(false)

  const currentWorkshop = workshops.find(w => w.id === currentWorkshopId)
  const isOwner = currentWorkshop?.role === 'owner' || currentWorkshop?.role === 'admin'

  const fetchMembers = useCallback(async () => {
    if (!currentWorkshopId) return
    setLoading(true)
    try {
      const res = await offlineFetch(`/api/workshops/${currentWorkshopId}/members`)
      if (res.ok) {
        const data = await res.json()
        setMembers(data.data || data)
      }
    } catch {
      toast({ title: 'Error', description: 'Error al cargar miembros', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [currentWorkshopId, toast])

  const fetchEmployeeActivities = useCallback(async () => {
    if (!currentWorkshopId) return
    setActivitiesLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const res = await offlineFetch(
        `/api/daily-closings/summary?workshopId=${currentWorkshopId}&date=${today}`
      )
      if (res.ok) {
        const activities: Record<string, { salesCount: number; salesTotal: number; repairsCount: number }> = {}
        for (const member of members) {
          try {
            const empRes = await offlineFetch(
              `/api/daily-closings/summary?workshopId=${currentWorkshopId}&date=${today}&userId=${member.userId}`
            )
            if (empRes.ok) {
              const empData = await empRes.json()
              activities[member.userId] = {
                salesCount: empData.data?.salesCount ?? empData.salesCount ?? 0,
                salesTotal: empData.data?.salesTotal ?? empData.salesTotal ?? 0,
                repairsCount: empData.data?.repairsCount ?? empData.repairsCount ?? 0,
              }
            }
          } catch {
            activities[member.userId] = { salesCount: 0, salesTotal: 0, repairsCount: 0 }
          }
        }
        setEmployeeActivities(activities)
      }
    } catch {
      // Silently fail for activity summary
    } finally {
      setActivitiesLoading(false)
    }
  }, [currentWorkshopId, members])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  useEffect(() => {
    if (members.length > 0) {
      fetchEmployeeActivities()
    }
  }, [members.length, fetchEmployeeActivities])

  // ─── Create Employee ──────────────────────────────────────

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentWorkshopId) return

    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      toast({ title: 'Error', description: 'Todos los campos son requeridos', variant: 'destructive' })
      return
    }
    if (createForm.password.length < 6) {
      toast({ title: 'Error', description: 'La contraseña debe tener al menos 6 caracteres', variant: 'destructive' })
      return
    }

    setCreating(true)
    try {
      const res = await offlineFetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createForm.name,
          email: createForm.email,
          password: createForm.password,
          role: createForm.role,
          workshopId: currentWorkshopId,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: 'Error', description: data.error || 'Error al crear empleado', variant: 'destructive' })
        return
      }
      toast({ title: 'Empleado creado', description: `${createForm.name} fue agregado al taller` })
      setCreateDialogOpen(false)
      setCreateForm(emptyCreateForm)
      fetchMembers()
    } catch {
      toast({ title: 'Error', description: 'Error de conexión', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  // ─── Edit Employee ────────────────────────────────────────

  const openEditDialog = (member: Member) => {
    setEditMember(member)
    setEditForm({ name: member.userName, email: member.userEmail, password: '' })
    setEditDialogOpen(true)
  }

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editMember || !currentWorkshopId) return

    if (!editForm.name.trim() || !editForm.email.trim()) {
      toast({ title: 'Error', description: 'Nombre y email son requeridos', variant: 'destructive' })
      return
    }

    setEditing(true)
    try {
      const body: Record<string, string> = {
        name: editForm.name,
        email: editForm.email,
        workshopId: currentWorkshopId,
      }
      if (editForm.password && editForm.password.length >= 6) {
        body.password = editForm.password
      }

      const res = await offlineFetch(`/api/employees/${editMember.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: 'Error', description: data.error || 'Error al actualizar empleado', variant: 'destructive' })
        return
      }
      toast({ title: 'Empleado actualizado', description: `Datos de ${editForm.name} actualizados` })
      setEditDialogOpen(false)
      setEditMember(null)
      fetchMembers()
    } catch {
      toast({ title: 'Error', description: 'Error de conexión', variant: 'destructive' })
    } finally {
      setEditing(false)
    }
  }

  // ─── Update Role ──────────────────────────────────────────

  const handleUpdateRole = async (member: Member, newRole: string) => {
    if (!currentWorkshopId) return
    try {
      const res = await offlineFetch(
        `/api/workshops/${currentWorkshopId}/members/${member.userId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole }),
        }
      )
      const data = await res.json()
      if (!res.ok) {
        toast({ title: 'Error', description: data.error || 'Error al actualizar rol', variant: 'destructive' })
        return
      }
      toast({ title: 'Rol actualizado', description: `Rol de ${member.userName} cambiado a ${roleLabels[newRole]}` })
      fetchMembers()
    } catch {
      toast({ title: 'Error', description: 'Error de conexión', variant: 'destructive' })
    }
  }

  // ─── Remove Member ────────────────────────────────────────

  const handleRemoveMember = async () => {
    if (!removeMember || !currentWorkshopId) return
    try {
      const res = await offlineFetch(
        `/api/workshops/${currentWorkshopId}/members/${removeMember.userId}`,
        { method: 'DELETE' }
      )
      const data = await res.json()
      if (!res.ok) {
        toast({ title: 'Error', description: data.error || 'Error al eliminar miembro', variant: 'destructive' })
        return
      }
      toast({ title: 'Miembro eliminado', description: `${removeMember.userName} fue eliminado del taller` })
      setRemoveOpen(false)
      setRemoveMember(null)
      fetchMembers()
    } catch {
      toast({ title: 'Error', description: 'Error de conexión', variant: 'destructive' })
    }
  }

  // ─── Helpers ──────────────────────────────────────────────

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(val)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // ─── No Workshop ──────────────────────────────────────────

  if (!currentWorkshopId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Building2Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Selecciona un Taller</h2>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Debes seleccionar un taller para gestionar los empleados.
        </p>
      </div>
    )
  }

  // ─── Main View ────────────────────────────────────────────

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Empleados del Taller</h2>
          <p className="text-sm text-muted-foreground">
            {currentWorkshop?.name || 'Taller'} — {members.length} miembro{members.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isOwner && (
          <Button onClick={() => { setCreateForm(emptyCreateForm); setCreateDialogOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Empleado
          </Button>
        )}
      </div>

      <Separator />

      {/* Members List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Cargando miembros...</span>
        </div>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">No se encontraron miembros</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {members.map((member) => {
            const activity = employeeActivities[member.userId]
            const isCurrentUser = user?.id === member.userId
            return (
              <Card key={member.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Member Info */}
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        {member.userImage && <AvatarImage src={member.userImage} alt={member.userName} />}
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                          {getInitials(member.userName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{member.userName}</p>
                          {isCurrentUser && (
                            <Badge variant="outline" className="text-xs">Tú</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{member.userEmail}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className={roleBadgeClasses[member.role] || ''}>
                            <Shield className="mr-1 h-3 w-3" />
                            {roleLabels[member.role] || member.role}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {formatDate(member.joinedAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {isOwner && member.role !== 'owner' && (
                      <div className="flex items-center gap-2">
                        <Select
                          value={member.role}
                          onValueChange={(v) => handleUpdateRole(member, v)}
                        >
                          <SelectTrigger className="w-[140px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="employee">Empleado</SelectItem>
                          </SelectContent>
                        </Select>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(member)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => { setRemoveMember(member); setRemoveOpen(true) }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>

                  {/* Activity Summary */}
                  {activity && (
                    <div className="mt-4 pt-3 border-t grid grid-cols-3 gap-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                          <ShoppingCart className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Ventas hoy</p>
                          <p className="text-sm font-semibold">{activity.salesCount}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-chart-2/10">
                          <Wrench className="h-4 w-4 text-chart-2" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Reparaciones hoy</p>
                          <p className="text-sm font-semibold">{activity.repairsCount}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-chart-4/10">
                          <DollarSign className="h-4 w-4 text-chart-4" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total ventas</p>
                          <p className="text-sm font-semibold">{formatCurrency(activity.salesTotal)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {activitiesLoading && !activity && (
                    <div className="mt-4 pt-3 border-t">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Cargando actividad...
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ─── Create Employee Dialog ──────────────────────────── */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Empleado</DialogTitle>
            <DialogDescription>
              Cree una cuenta para el nuevo empleado y agréguelo al taller
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateEmployee}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="create-name">Nombre completo *</Label>
                <Input
                  id="create-name"
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="Juan Pérez"
                  required
                  disabled={creating}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-email">Email *</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                  required
                  disabled={creating}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-password">Contraseña *</Label>
                <Input
                  id="create-password"
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  disabled={creating}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-role">Rol</Label>
                <Select value={createForm.role} onValueChange={(v) => setCreateForm({ ...createForm, role: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="employee">Empleado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={creating}>
                Cancelar
              </Button>
              <Button type="submit" disabled={creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Empleado
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Employee Dialog ────────────────────────────── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Empleado</DialogTitle>
            <DialogDescription>
              Modifique los datos del empleado. Deje la contraseña vacía si no desea cambiarla.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditEmployee}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nombre completo *</Label>
                <Input
                  id="edit-name"
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Juan Pérez"
                  required
                  disabled={editing}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                  required
                  disabled={editing}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-password">Nueva Contraseña</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="edit-password"
                    type="password"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    placeholder="Dejar vacío para no cambiar"
                    className="pl-9"
                    minLength={6}
                    disabled={editing}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Mínimo 6 caracteres. Dejar vacío para mantener la actual.</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} disabled={editing}>
                Cancelar
              </Button>
              <Button type="submit" disabled={editing}>
                {editing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Remove Confirmation ─────────────────────────────── */}
      <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar miembro?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de que desea eliminar a &quot;{removeMember?.userName}&quot; del taller?
              El usuario perderá acceso a este taller.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRemoveMember(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function Building2Icon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </svg>
  )
}
