'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Users,
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Phone,
  Mail,
  MapPin,
  FileText,
  Loader2,
  UserPlus,
  ShoppingCart,
  Wrench,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { offlineFetch } from '@/lib/offline-fetch'
import { customerSchema } from '@/lib/validations'

interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  dni: string | null
  notes: string | null
  active: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    sales: number
    repairOrders: number
  }
  sales?: Array<{
    id: string
    code: string
    total: number
    status: string
    createdAt: string
    items: Array<{ name: string; quantity: number; total: number }>
  }>
  repairOrders?: Array<{
    id: string
    code: string
    device: string
    issue: string
    status: string
    totalCost: number
    createdAt: string
  }>
}

interface CustomerForm {
  name: string
  phone: string
  email: string
  address: string
  dni: string
  notes: string
}

const emptyForm: CustomerForm = {
  name: '',
  phone: '',
  email: '',
  address: '',
  dni: '',
  notes: '',
}

export function CustomersView() {
  const { toast } = useToast()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // Quick stats
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [newThisMonth, setNewThisMonth] = useState(0)

  // Dialogs
  const [formOpen, setFormOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null)
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null)
  const [form, setForm] = useState<CustomerForm>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const limit = 20

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        search,
        page: String(page),
        limit: String(limit),
      })
      const res = await offlineFetch(`/api/customers?${params}`)
      if (res.ok) {
        const data = await res.json()
        setCustomers(data.data)
        setTotal(data.total)
      }
    } catch {
      toast({ title: 'Error', description: 'Error al cargar clientes', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [search, page, toast])

  const fetchStats = useCallback(async () => {
    try {
      const res = await offlineFetch('/api/customers?limit=9999')
      if (res.ok) {
        const data = await res.json()
        setTotalCustomers(data.total)
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const newCount = data.data.filter(
          (c: Customer) => new Date(c.createdAt) >= monthStart
        ).length
        setNewThisMonth(newCount)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const openAddDialog = () => {
    setEditingCustomer(null)
    setForm(emptyForm)
    setValidationErrors({})
    setFormOpen(true)
  }

  const openEditDialog = (customer: Customer) => {
    setEditingCustomer(customer)
    setForm({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      dni: customer.dni || '',
      notes: customer.notes || '',
    })
    setValidationErrors({})
    setFormOpen(true)
  }

  const openDetailDialog = async (customer: Customer) => {
    setDetailCustomer(customer)
    setDetailOpen(true)
    setDetailLoading(true)
    try {
      const res = await offlineFetch(`/api/customers/${customer.id}`)
      if (res.ok) {
        const data = await res.json()
        setDetailCustomer(data)
      }
    } catch {
      // ignore
    } finally {
      setDetailLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = customerSchema.safeParse(form)
    if (!result.success) {
      const errors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const key = issue.path.join('.')
        if (!errors[key]) errors[key] = issue.message
      }
      setValidationErrors(errors)
      return
    }
    setValidationErrors({})
    setSubmitting(true)
    try {
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers'
      const method = editingCustomer ? 'PUT' : 'POST'
      const res = await offlineFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: 'Error', description: data.error || 'Error al guardar', variant: 'destructive' })
        return
      }
      toast({
        title: editingCustomer ? 'Cliente actualizado' : 'Cliente creado',
        description: editingCustomer ? 'Los datos se actualizaron correctamente' : 'El cliente se creó correctamente',
      })
      setFormOpen(false)
      fetchCustomers()
      fetchStats()
    } catch {
      toast({ title: 'Error', description: 'Error de conexión', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteCustomer) return
    try {
      const res = await offlineFetch(`/api/customers/${deleteCustomer.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Error al eliminar', variant: 'destructive' })
        return
      }
      toast({ title: 'Cliente eliminado', description: 'El cliente fue desactivado' })
      setDeleteOpen(false)
      setDeleteCustomer(null)
      fetchCustomers()
      fetchStats()
    } catch {
      toast({ title: 'Error', description: 'Error de conexión', variant: 'destructive' })
    }
  }

  const totalPages = Math.ceil(total / limit)

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Clientes</p>
                <p className="text-2xl font-bold">{totalCustomers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nuevos este Mes</p>
                <p className="text-2xl font-bold">{newThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, teléfono, DNI..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <Button onClick={openAddDialog} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Cargando clientes...</span>
            </div>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">No se encontraron clientes</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="hidden md:table-cell">Teléfono</TableHead>
                      <TableHead className="hidden lg:table-cell">Email</TableHead>
                      <TableHead className="hidden sm:table-cell">DNI</TableHead>
                      <TableHead className="hidden md:table-cell text-center">Compras</TableHead>
                      <TableHead className="hidden md:table-cell text-center">Reparaciones</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id} className="cursor-pointer" onClick={() => openDetailDialog(customer)}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell className="hidden md:table-cell">{customer.phone || '—'}</TableCell>
                        <TableCell className="hidden lg:table-cell">{customer.email || '—'}</TableCell>
                        <TableCell className="hidden sm:table-cell">{customer.dni || '—'}</TableCell>
                        <TableCell className="hidden md:table-cell text-center">
                          <Badge variant="secondary">{customer._count?.sales || 0}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-center">
                          <Badge variant="secondary">{customer._count?.repairOrders || 0}</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openDetailDialog(customer) }}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalle
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(customer) }}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={(e) => { e.stopPropagation(); setDeleteCustomer(customer); setDeleteOpen(true) }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    {((page - 1) * limit) + 1} - {Math.min(page * limit, total)} de {total}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                      Anterior
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
            <DialogDescription>
              {editingCustomer ? 'Modifique los datos del cliente' : 'Ingrese los datos del nuevo cliente'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => { setForm({ ...form, name: e.target.value }); setValidationErrors((prev) => { const next = {...prev}; delete next.name; return next }) }}
                  placeholder="Nombre completo"
                  required
                />
                {validationErrors.name && <p className="text-sm text-destructive">{validationErrors.name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => { setForm({ ...form, phone: e.target.value }); setValidationErrors((prev) => { const next = {...prev}; delete next.phone; return next }) }}
                    placeholder="+54 11 5555-0000"
                  />
                  {validationErrors.phone && <p className="text-sm text-destructive">{validationErrors.phone}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dni">DNI</Label>
                  <Input
                    id="dni"
                    value={form.dni}
                    onChange={(e) => { setForm({ ...form, dni: e.target.value }); setValidationErrors((prev) => { const next = {...prev}; delete next.dni; return next }) }}
                    placeholder="12345678"
                  />
                  {validationErrors.dni && <p className="text-sm text-destructive">{validationErrors.dni}</p>}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => { setForm({ ...form, email: e.target.value }); setValidationErrors((prev) => { const next = {...prev}; delete next.email; return next }) }}
                  placeholder="correo@ejemplo.com"
                />
                {validationErrors.email && <p className="text-sm text-destructive">{validationErrors.email}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => { setForm({ ...form, address: e.target.value }); setValidationErrors((prev) => { const next = {...prev}; delete next.address; return next }) }}
                  placeholder="Calle y número"
                />
                {validationErrors.address && <p className="text-sm text-destructive">{validationErrors.address}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => { setForm({ ...form, notes: e.target.value }); setValidationErrors((prev) => { const next = {...prev}; delete next.notes; return next }) }}
                  placeholder="Notas adicionales..."
                  rows={3}
                />
                {validationErrors.notes && <p className="text-sm text-destructive">{validationErrors.notes}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingCustomer ? 'Guardar Cambios' : 'Crear Cliente'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Detalle del Cliente</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : detailCustomer ? (
            <ScrollArea className="max-h-[65vh] pr-2">
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">{detailCustomer.name}</h3>
                  <div className="grid gap-2">
                    {detailCustomer.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{detailCustomer.phone}</span>
                      </div>
                    )}
                    {detailCustomer.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{detailCustomer.email}</span>
                      </div>
                    )}
                    {detailCustomer.address && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{detailCustomer.address}</span>
                      </div>
                    )}
                    {detailCustomer.dni && (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>DNI: {detailCustomer.dni}</span>
                      </div>
                    )}
                    {detailCustomer.notes && (
                      <div className="mt-2 rounded-lg bg-muted p-3 text-sm">
                        <p className="font-medium text-muted-foreground mb-1">Notas</p>
                        <p>{detailCustomer.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Sales History */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold">Historial de Compras</h4>
                    <Badge variant="secondary">{detailCustomer.sales?.length || 0}</Badge>
                  </div>
                  {detailCustomer.sales && detailCustomer.sales.length > 0 ? (
                    <div className="space-y-2">
                      {detailCustomer.sales.map((sale) => (
                        <div key={sale.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <p className="text-sm font-medium">{sale.code}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(sale.createdAt)}</p>
                            <p className="text-xs text-muted-foreground">
                              {sale.items.map(i => `${i.name} x${i.quantity}`).join(', ')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(sale.total)}</p>
                            <Badge variant={sale.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                              {sale.status === 'completed' ? 'Completada' : sale.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin compras registradas</p>
                  )}
                </div>

                <Separator />

                {/* Repair History */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold">Historial de Reparaciones</h4>
                    <Badge variant="secondary">{detailCustomer.repairOrders?.length || 0}</Badge>
                  </div>
                  {detailCustomer.repairOrders && detailCustomer.repairOrders.length > 0 ? (
                    <div className="space-y-2">
                      {detailCustomer.repairOrders.map((repair) => (
                        <div key={repair.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <p className="text-sm font-medium">{repair.code} — {repair.device}</p>
                            <p className="text-xs text-muted-foreground">{repair.issue}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(repair.createdAt)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(repair.totalCost)}</p>
                            <Badge variant="outline" className="text-xs">
                              {repair.status === 'received' ? 'Recibido' :
                               repair.status === 'diagnosing' ? 'Diagnosticando' :
                               repair.status === 'waiting_parts' ? 'Esperando repuestos' :
                               repair.status === 'repairing' ? 'Reparando' :
                               repair.status === 'ready' ? 'Listo' :
                               repair.status === 'delivered' ? 'Entregado' :
                               repair.status === 'cancelled' ? 'Cancelado' : repair.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin reparaciones registradas</p>
                  )}
                </div>
              </div>
            </ScrollArea>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Cerrar</Button>
            {detailCustomer && (
              <Button onClick={() => { setDetailOpen(false); openEditDialog(detailCustomer) }}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de que desea eliminar a &quot;{deleteCustomer?.name}&quot;? El cliente será desactivado del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteCustomer(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
