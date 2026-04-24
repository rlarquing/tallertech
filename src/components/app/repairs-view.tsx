'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Search,
  Plus,
  Wrench,
  Eye,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Printer,
  Package,
  ArrowRight,
  User,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

// ============================================================
// Types
// ============================================================

interface Customer {
  id: string
  name: string
  phone: string | null
  dni: string | null
}

interface RepairPart {
  id: string
  productId: string | null
  name: string
  quantity: number
  unitPrice: number
  total: number
  product: { name: string; quantity: number } | null
}

interface RepairOrder {
  id: string
  code: string
  customerId: string
  device: string
  brand: string | null
  imei: string | null
  issue: string
  diagnosis: string | null
  solution: string | null
  status: string
  priority: string
  costEstimate: number
  laborCost: number
  partsCost: number
  totalCost: number
  paymentMethod: string
  paid: boolean
  receivedAt: string
  estimatedReady: string | null
  completedAt: string | null
  deliveredAt: string | null
  notes: string | null
  createdAt: string
  customer: { id: string; name: string; phone: string | null }
  parts: RepairPart[]
}

interface Product {
  id: string
  name: string
  sku: string | null
  salePrice: number
  quantity: number
  type: string
}

// ============================================================
// Status & Priority Config
// ============================================================

const statusConfig: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
  received: { label: 'Recibida', color: 'text-gray-700 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-800', borderColor: 'border-gray-300 dark:border-gray-600' },
  diagnosing: { label: 'Diagnosticando', color: 'text-yellow-700 dark:text-yellow-300', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', borderColor: 'border-yellow-300 dark:border-yellow-700' },
  waiting_parts: { label: 'Esperando Piezas', color: 'text-orange-700 dark:text-orange-300', bgColor: 'bg-orange-100 dark:bg-orange-900/30', borderColor: 'border-orange-300 dark:border-orange-700' },
  repairing: { label: 'Reparando', color: 'text-blue-700 dark:text-blue-300', bgColor: 'bg-blue-100 dark:bg-blue-900/30', borderColor: 'border-blue-300 dark:border-blue-700' },
  ready: { label: 'Lista', color: 'text-green-700 dark:text-green-300', bgColor: 'bg-green-100 dark:bg-green-900/30', borderColor: 'border-green-300 dark:border-green-700' },
  delivered: { label: 'Entregada', color: 'text-emerald-700 dark:text-emerald-300', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', borderColor: 'border-emerald-300 dark:border-emerald-700' },
  cancelled: { label: 'Cancelada', color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-100 dark:bg-red-900/30', borderColor: 'border-red-300 dark:border-red-700' },
}

const statusWorkflow = ['received', 'diagnosing', 'waiting_parts', 'repairing', 'ready', 'delivered']

const priorityConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  low: { label: 'Baja', variant: 'secondary' },
  normal: { label: 'Normal', variant: 'outline' },
  high: { label: 'Alta', variant: 'default' },
  urgent: { label: 'Urgente', variant: 'destructive' },
}

const paymentLabels: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  mixto: 'Mixto',
}

// ============================================================
// Helpers
// ============================================================

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-CU', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)

// ============================================================
// Repairs View Component
// ============================================================

export function RepairsView() {
  // Filters
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Data
  const [repairs, setRepairs] = useState<RepairOrder[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const limit = 20

  // New repair dialog
  const [newRepairOpen, setNewRepairOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  // Edit repair dialog
  const [editRepairOpen, setEditRepairOpen] = useState(false)
  const [editingRepair, setEditingRepair] = useState<RepairOrder | null>(null)
  const [saving, setSaving] = useState(false)

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRepair, setDetailRepair] = useState<RepairOrder | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Add parts dialog
  const [addPartsOpen, setAddPartsOpen] = useState(false)
  const [addPartsRepairId, setAddPartsRepairId] = useState<string>('')
  const [partSearch, setPartSearch] = useState('')
  const [partProducts, setPartProducts] = useState<Product[]>([])
  const [partProductsLoading, setPartProductsLoading] = useState(false)
  const [addingPart, setAddingPart] = useState(false)

  // Customer search for new repair form
  const [customerSearch, setCustomerSearch] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customersLoading, setCustomersLoading] = useState(false)

  // New repair form
  const [formCustomerId, setFormCustomerId] = useState('')
  const [formCustomerName, setFormCustomerName] = useState('')
  const [formDevice, setFormDevice] = useState('')
  const [formBrand, setFormBrand] = useState('')
  const [formImei, setFormImei] = useState('')
  const [formIssue, setFormIssue] = useState('')
  const [formPriority, setFormPriority] = useState('normal')
  const [formCostEstimate, setFormCostEstimate] = useState('')

  // Edit form
  const [editDiagnosis, setEditDiagnosis] = useState('')
  const [editSolution, setEditSolution] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editLaborCost, setEditLaborCost] = useState('')
  const [editPaymentMethod, setEditPaymentMethod] = useState('efectivo')
  const [editPriority, setEditPriority] = useState('normal')

  const searchTimeout = useRef<ReturnType<typeof setTimeout>>()
  const customerSearchTimeout = useRef<ReturnType<typeof setTimeout>>()
  const partSearchTimeout = useRef<ReturnType<typeof setTimeout>>()

  // ============================================================
  // Fetch repairs
  // ============================================================

  const fetchRepairs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      if (searchQuery) params.set('search', searchQuery)

      const res = await fetch(`/api/repairs?${params}`)
      if (res.ok) {
        const data = await res.json()
        setRepairs(data.data || [])
        setTotal(data.total || 0)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, searchQuery])

  useEffect(() => {
    fetchRepairs()
  }, [fetchRepairs])

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      setPage(1)
    }, 400)
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current)
    }
  }, [searchQuery])

  // ============================================================
  // Customer search
  // ============================================================

  const searchCustomers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setCustomers([])
      return
    }
    setCustomersLoading(true)
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(query)}&limit=20`)
      if (res.ok) {
        const data = await res.json()
        setCustomers(data.data || [])
      }
    } catch {
      // ignore
    } finally {
      setCustomersLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!newRepairOpen) return
    if (customerSearchTimeout.current) clearTimeout(customerSearchTimeout.current)
    customerSearchTimeout.current = setTimeout(() => {
      searchCustomers(customerSearch)
    }, 300)
    return () => {
      if (customerSearchTimeout.current) clearTimeout(customerSearchTimeout.current)
    }
  }, [customerSearch, newRepairOpen, searchCustomers])

  // ============================================================
  // Part product search
  // ============================================================

  const searchPartProducts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setPartProducts([])
      return
    }
    setPartProductsLoading(true)
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=20&active=true`)
      if (res.ok) {
        const data = await res.json()
        setPartProducts(data.data || [])
      }
    } catch {
      // ignore
    } finally {
      setPartProductsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!addPartsOpen) return
    if (partSearchTimeout.current) clearTimeout(partSearchTimeout.current)
    partSearchTimeout.current = setTimeout(() => {
      searchPartProducts(partSearch)
    }, 300)
    return () => {
      if (partSearchTimeout.current) clearTimeout(partSearchTimeout.current)
    }
  }, [partSearch, addPartsOpen, searchPartProducts])

  // ============================================================
  // Create repair
  // ============================================================

  const createRepair = async () => {
    if (!formCustomerId || !formDevice || !formIssue) {
      toast.error('Cliente, dispositivo y problema son requeridos')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/repairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: formCustomerId,
          device: formDevice,
          brand: formBrand || undefined,
          imei: formImei || undefined,
          issue: formIssue,
          priority: formPriority,
          costEstimate: parseFloat(formCostEstimate) || 0,
        }),
      })
      if (res.ok) {
        toast.success('Orden de reparación creada')
        setNewRepairOpen(false)
        resetNewForm()
        fetchRepairs()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al crear reparación')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setCreating(false)
    }
  }

  const resetNewForm = () => {
    setFormCustomerId('')
    setFormCustomerName('')
    setFormDevice('')
    setFormBrand('')
    setFormImei('')
    setFormIssue('')
    setFormPriority('normal')
    setFormCostEstimate('')
    setCustomerSearch('')
    setCustomers([])
  }

  // ============================================================
  // Edit repair
  // ============================================================

  const openEditRepair = async (repairId: string) => {
    setDetailLoading(true)
    setEditRepairOpen(true)
    try {
      const res = await fetch(`/api/repairs/${repairId}`)
      if (res.ok) {
        const data: RepairOrder = await res.json()
        setEditingRepair(data)
        setEditDiagnosis(data.diagnosis || '')
        setEditSolution(data.solution || '')
        setEditStatus(data.status)
        setEditLaborCost(String(data.laborCost))
        setEditPaymentMethod(data.paymentMethod)
        setEditPriority(data.priority)
      }
    } catch {
      toast.error('Error al cargar reparación')
    } finally {
      setDetailLoading(false)
    }
  }

  const saveRepair = async () => {
    if (!editingRepair) return
    setSaving(true)
    try {
      const res = await fetch(`/api/repairs/${editingRepair.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnosis: editDiagnosis || undefined,
          solution: editSolution || undefined,
          status: editStatus,
          priority: editPriority,
          laborCost: parseFloat(editLaborCost) || 0,
          paymentMethod: editPaymentMethod,
        }),
      })
      if (res.ok) {
        toast.success('Reparación actualizada')
        setEditRepairOpen(false)
        fetchRepairs()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al actualizar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  // ============================================================
  // Status change
  // ============================================================

  const changeStatus = async (repairId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/repairs/${repairId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        toast.success(`Estado cambiado a ${statusConfig[newStatus]?.label || newStatus}`)
        fetchRepairs()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al cambiar estado')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  // ============================================================
  // View detail
  // ============================================================

  const viewDetail = async (repairId: string) => {
    setDetailOpen(true)
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/repairs/${repairId}`)
      if (res.ok) {
        const data = await res.json()
        setDetailRepair(data)
      }
    } catch {
      toast.error('Error al cargar detalle')
    } finally {
      setDetailLoading(false)
    }
  }

  // ============================================================
  // Add part to repair
  // ============================================================

  const addPart = async (product: Product, quantity: number) => {
    if (!addPartsRepairId) return
    setAddingPart(true)
    try {
      const res = await fetch(`/api/repairs/${addPartsRepairId}/parts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          name: product.name,
          quantity,
          unitPrice: product.salePrice,
        }),
      })
      if (res.ok) {
        toast.success('Pieza agregada')
        fetchRepairs()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al agregar pieza')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setAddingPart(false)
    }
  }

  // ============================================================
  // Print repair ticket
  // ============================================================

  const printRepair = (repair: RepairOrder) => {
    const content = `
      <html>
        <head><title>Reparación ${repair.code}</title>
        <style>
          body { font-family: monospace; padding: 20px; max-width: 300px; margin: auto; }
          h2 { text-align: center; margin-bottom: 5px; }
          .line { border-top: 1px dashed #000; margin: 10px 0; }
          .row { display: flex; justify-content: space-between; margin: 4px 0; }
          .total { font-size: 1.2em; font-weight: bold; }
        </style></head>
        <body>
          <h2>TallerTech</h2>
          <p style="text-align:center;">Orden de Reparación</p>
          <div class="line"></div>
          <div class="row"><span>Código:</span><span>${repair.code}</span></div>
          <div class="row"><span>Cliente:</span><span>${repair.customer.name}</span></div>
          <div class="row"><span>Dispositivo:</span><span>${repair.device}</span></div>
          ${repair.brand ? `<div class="row"><span>Marca:</span><span>${repair.brand}</span></div>` : ''}
          ${repair.imei ? `<div class="row"><span>IMEI:</span><span>${repair.imei}</span></div>` : ''}
          <div class="line"></div>
          <p><strong>Problema:</strong> ${repair.issue}</p>
          ${repair.diagnosis ? `<p><strong>Diagnóstico:</strong> ${repair.diagnosis}</p>` : ''}
          <div class="line"></div>
          <div class="row"><span>Estado:</span><span>${statusConfig[repair.status]?.label || repair.status}</span></div>
          <div class="row"><span>Prioridad:</span><span>${priorityConfig[repair.priority]?.label || repair.priority}</span></div>
          <div class="row"><span>Estimado:</span><span>$${repair.costEstimate.toFixed(2)}</span></div>
          <div class="line"></div>
          ${repair.parts.length > 0 ? repair.parts.map(p => `<div class="row"><span>${p.name} x${p.quantity}</span><span>$${p.total.toFixed(2)}</span></div>`).join('') : ''}
          ${repair.parts.length > 0 ? '<div class="line"></div>' : ''}
          <div class="row"><span>Mano de obra:</span><span>$${repair.laborCost.toFixed(2)}</span></div>
          <div class="row total"><span>Total:</span><span>$${repair.totalCost.toFixed(2)}</span></div>
          <div class="line"></div>
          <p style="text-align:center;font-size:0.8em;">Fecha: ${new Date(repair.receivedAt).toLocaleString('es-CU')}</p>
        </body>
      </html>
    `
    const win = window.open('', '_blank', 'width=400,height=600')
    if (win) {
      win.document.write(content)
      win.document.close()
      win.print()
    }
  }

  const totalPages = Math.ceil(total / limit)

  // ============================================================
  // Status badge component
  // ============================================================

  const StatusBadge = ({ status }: { status: string }) => {
    const config = statusConfig[status]
    if (!config) return <Badge variant="secondary">{status}</Badge>
    return (
      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${config.color} ${config.bgColor} ${config.borderColor}`}>
        {config.label}
      </span>
    )
  }

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      {/* Header & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* New Repair Button */}
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
              onClick={() => setNewRepairOpen(true)}
            >
              <Plus className="mr-2 size-4" />
              Nueva Reparación
            </Button>

            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por código, cliente o dispositivo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Tabs */}
      <Tabs value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
        <TabsList className="h-auto flex-wrap bg-muted/50">
          <TabsTrigger value="all" className="text-xs">Todas</TabsTrigger>
          <TabsTrigger value="received" className="text-xs">Recibidas</TabsTrigger>
          <TabsTrigger value="diagnosing" className="text-xs">Diagnosticando</TabsTrigger>
          <TabsTrigger value="waiting_parts" className="text-xs">Esperando Piezas</TabsTrigger>
          <TabsTrigger value="repairing" className="text-xs">Reparando</TabsTrigger>
          <TabsTrigger value="ready" className="text-xs">Listas</TabsTrigger>
          <TabsTrigger value="delivered" className="text-xs">Entregadas</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Desktop Table */}
      <Card className="hidden lg:block">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="size-4" />
              Órdenes de Reparación
            </CardTitle>
            <span className="text-sm text-muted-foreground">{total} órdenes</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : repairs.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Dispositivo</TableHead>
                    <TableHead>Problema</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead className="text-right">Costo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {repairs.map((repair) => (
                    <TableRow key={repair.id}>
                      <TableCell className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {repair.code}
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate">{repair.customer.name}</TableCell>
                      <TableCell className="max-w-[120px] truncate">{repair.device}</TableCell>
                      <TableCell className="max-w-[150px] truncate text-xs text-muted-foreground">{repair.issue}</TableCell>
                      <TableCell><StatusBadge status={repair.status} /></TableCell>
                      <TableCell>
                        <Badge variant={priorityConfig[repair.priority]?.variant || 'outline'} className="text-xs">
                          {priorityConfig[repair.priority]?.label || repair.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(repair.totalCost)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(repair.receivedAt).toLocaleDateString('es-CU')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => viewDetail(repair.id)}>
                              <Eye className="mr-2 size-4" /> Ver Detalle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditRepair(repair.id)}>
                              <Wrench className="mr-2 size-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => printRepair(repair)}>
                              <Printer className="mr-2 size-4" /> Imprimir
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setAddPartsRepairId(repair.id); setAddPartsOpen(true) }}>
                              <Package className="mr-2 size-4" /> Agregar Pieza
                            </DropdownMenuItem>
                            {repair.status !== 'delivered' && repair.status !== 'cancelled' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-emerald-600" onClick={() => {
                                  const currentIdx = statusWorkflow.indexOf(repair.status)
                                  if (currentIdx < statusWorkflow.length - 1) {
                                    changeStatus(repair.id, statusWorkflow[currentIdx + 1])
                                  }
                                }}>
                                  <ArrowRight className="mr-2 size-4" /> Avanzar Estado
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
                  <div className="flex gap-1">
                    <Button variant="outline" size="icon" className="size-8" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="size-8" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Wrench className="size-10 mb-2 opacity-40" />
              <p className="text-sm">No se encontraron reparaciones</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-lg" />)
        ) : repairs.length > 0 ? (
          repairs.map((repair) => (
            <Card key={repair.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">{repair.code}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={priorityConfig[repair.priority]?.variant || 'outline'} className="text-xs">
                      {priorityConfig[repair.priority]?.label || repair.priority}
                    </Badge>
                    <StatusBadge status={repair.status} />
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cliente:</span>
                    <span>{repair.customer.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dispositivo:</span>
                    <span>{repair.device}{repair.brand ? ` (${repair.brand})` : ''}</span>
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    <span className="font-medium text-foreground">Problema:</span> {repair.issue}
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Costo:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(repair.totalCost)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(repair.receivedAt).toLocaleString('es-CU')}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => viewDetail(repair.id)}>
                    <Eye className="mr-1 size-3" /> Ver
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditRepair(repair.id)}>
                    <Wrench className="mr-1 size-3" /> Editar
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="size-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => printRepair(repair)}>
                        <Printer className="mr-2 size-4" /> Imprimir
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setAddPartsRepairId(repair.id); setAddPartsOpen(true) }}>
                        <Package className="mr-2 size-4" /> Agregar Pieza
                      </DropdownMenuItem>
                      {repair.status !== 'delivered' && repair.status !== 'cancelled' && (
                        <DropdownMenuItem className="text-emerald-600" onClick={() => {
                          const currentIdx = statusWorkflow.indexOf(repair.status)
                          if (currentIdx < statusWorkflow.length - 1) {
                            changeStatus(repair.id, statusWorkflow[currentIdx + 1])
                          }
                        }}>
                          <ArrowRight className="mr-2 size-4" /> Avanzar
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Wrench className="size-10 mb-2 opacity-40" />
            <p className="text-sm">No se encontraron reparaciones</p>
          </div>
        )}

        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-2">
            <Button variant="outline" size="icon" className="size-8" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
            <Button variant="outline" size="icon" className="size-8" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* New Repair Dialog */}
      {/* ============================================================ */}

      <Dialog open={newRepairOpen} onOpenChange={(open) => { setNewRepairOpen(open); if (!open) resetNewForm() }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="size-5" />
              Nueva Reparación
            </DialogTitle>
            <DialogDescription>Complete los datos para registrar una nueva orden</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Customer */}
            <div className="space-y-2">
              <Label>Cliente *</Label>
              {formCustomerId ? (
                <div className="flex items-center gap-2 p-2 rounded-md border bg-muted/30">
                  <User className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium flex-1">{formCustomerName}</span>
                  <Button variant="ghost" size="icon" className="size-6" onClick={() => { setFormCustomerId(''); setFormCustomerName('') }}>
                    <X className="size-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar cliente por nombre, teléfono, DNI..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {customersLoading && <Skeleton className="h-8 w-full" />}
                  {customers.length > 0 && (
                    <ScrollArea className="max-h-32">
                      <div className="space-y-1">
                        {customers.map((c) => (
                          <button
                            key={c.id}
                            className="w-full flex items-center gap-2 rounded-md p-2 text-left hover:bg-muted transition-colors text-sm"
                            onClick={() => { setFormCustomerId(c.id); setFormCustomerName(c.name); setCustomerSearch(''); setCustomers([]) }}
                          >
                            <User className="size-4 text-muted-foreground" />
                            <span>{c.name}</span>
                            <span className="text-xs text-muted-foreground ml-auto">{c.phone || c.dni || ''}</span>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </>
              )}
            </div>

            {/* Device */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Dispositivo *</Label>
                <Input placeholder="Ej: iPhone 13" value={formDevice} onChange={(e) => setFormDevice(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Marca</Label>
                <Input placeholder="Ej: Apple" value={formBrand} onChange={(e) => setFormBrand(e.target.value)} />
              </div>
            </div>

            {/* IMEI */}
            <div className="space-y-2">
              <Label>IMEI</Label>
              <Input placeholder="Número de IMEI (opcional)" value={formImei} onChange={(e) => setFormImei(e.target.value)} />
            </div>

            {/* Issue */}
            <div className="space-y-2">
              <Label>Problema reportado *</Label>
              <Textarea placeholder="Describa el problema del dispositivo..." value={formIssue} onChange={(e) => setFormIssue(e.target.value)} rows={3} />
            </div>

            {/* Priority & Cost */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select value={formPriority} onValueChange={setFormPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Costo estimado</Label>
                <Input type="number" min={0} placeholder="0.00" value={formCostEstimate} onChange={(e) => setFormCostEstimate(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setNewRepairOpen(false); resetNewForm() }}>Cancelar</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={createRepair} disabled={creating}>
              {creating ? <><Loader2 className="mr-2 size-4 animate-spin" /> Guardando...</> : 'Crear Orden'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* Edit Repair Dialog */}
      {/* ============================================================ */}

      <Dialog open={editRepairOpen} onOpenChange={setEditRepairOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="size-5" />
              Editar Reparación
            </DialogTitle>
            <DialogDescription>
              {editingRepair?.code && (
                <span>Orden: <span className="font-mono">{editingRepair.code}</span> — {editingRepair.customer?.name} — {editingRepair.device}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : editingRepair ? (
            <div className="space-y-4">
              {/* Status */}
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="received">Recibida</SelectItem>
                    <SelectItem value="diagnosing">Diagnosticando</SelectItem>
                    <SelectItem value="waiting_parts">Esperando Piezas</SelectItem>
                    <SelectItem value="repairing">Reparando</SelectItem>
                    <SelectItem value="ready">Lista</SelectItem>
                    <SelectItem value="delivered">Entregada</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select value={editPriority} onValueChange={setEditPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Diagnosis */}
              <div className="space-y-2">
                <Label>Diagnóstico</Label>
                <Textarea placeholder="Diagnóstico técnico..." value={editDiagnosis} onChange={(e) => setEditDiagnosis(e.target.value)} rows={3} />
              </div>

              {/* Solution */}
              <div className="space-y-2">
                <Label>Solución</Label>
                <Textarea placeholder="Solución aplicada..." value={editSolution} onChange={(e) => setEditSolution(e.target.value)} rows={3} />
              </div>

              {/* Labor cost & Payment */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Costo mano de obra</Label>
                  <Input type="number" min={0} value={editLaborCost} onChange={(e) => setEditLaborCost(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Método de pago</Label>
                  <Select value={editPaymentMethod} onValueChange={setEditPaymentMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="mixto">Mixto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Existing parts */}
              {editingRepair.parts && editingRepair.parts.length > 0 && (
                <div className="space-y-2">
                  <Label>Piezas utilizadas</Label>
                  <div className="space-y-1">
                    {editingRepair.parts.map((part) => (
                      <div key={part.id} className="flex justify-between text-sm rounded-md border p-2">
                        <span>{part.name} x{part.quantity}</span>
                        <span className="font-semibold">{formatCurrency(part.total)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-semibold pt-1">
                      <span>Total piezas:</span>
                      <span>{formatCurrency(editingRepair.partsCost)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRepairOpen(false)}>Cancelar</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={saveRepair} disabled={saving}>
              {saving ? <><Loader2 className="mr-2 size-4 animate-spin" /> Guardando...</> : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* Detail Dialog */}
      {/* ============================================================ */}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="size-5" />
              Detalle de Reparación
            </DialogTitle>
            <DialogDescription>Información completa de la orden</DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : detailRepair ? (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Código:</span>
                  <span className="font-mono font-semibold">{detailRepair.code}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span>{detailRepair.customer.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Dispositivo:</span>
                  <span>{detailRepair.device}{detailRepair.brand ? ` (${detailRepair.brand})` : ''}</span>
                </div>
                {detailRepair.imei && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IMEI:</span>
                    <span className="font-mono text-xs">{detailRepair.imei}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estado:</span>
                  <StatusBadge status={detailRepair.status} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Prioridad:</span>
                  <Badge variant={priorityConfig[detailRepair.priority]?.variant || 'outline'} className="text-xs">
                    {priorityConfig[detailRepair.priority]?.label || detailRepair.priority}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Recibida:</span>
                  <span>{new Date(detailRepair.receivedAt).toLocaleString('es-CU')}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Problema</Label>
                  <p className="text-sm mt-1">{detailRepair.issue}</p>
                </div>
                {detailRepair.diagnosis && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Diagnóstico</Label>
                    <p className="text-sm mt-1">{detailRepair.diagnosis}</p>
                  </div>
                )}
                {detailRepair.solution && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Solución</Label>
                    <p className="text-sm mt-1">{detailRepair.solution}</p>
                  </div>
                )}
              </div>

              {detailRepair.parts && detailRepair.parts.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Piezas utilizadas ({detailRepair.parts.length})</h4>
                    {detailRepair.parts.map((part) => (
                      <div key={part.id} className="flex justify-between text-sm rounded-md border p-2">
                        <span>{part.name} x{part.quantity}</span>
                        <span className="font-semibold">{formatCurrency(part.total)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <Separator />

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Costo estimado:</span>
                  <span>{formatCurrency(detailRepair.costEstimate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mano de obra:</span>
                  <span>{formatCurrency(detailRepair.laborCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Piezas:</span>
                  <span>{formatCurrency(detailRepair.partsCost)}</span>
                </div>
                <div className="flex justify-between font-bold text-base">
                  <span>Total:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(detailRepair.totalCost)}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => printRepair(detailRepair)}>
                  <Printer className="mr-2 size-4" /> Imprimir
                </Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => { setDetailOpen(false); openEditRepair(detailRepair.id) }}
                >
                  <Wrench className="mr-2 size-4" /> Editar
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* Add Parts Dialog */}
      {/* ============================================================ */}

      <Dialog open={addPartsOpen} onOpenChange={setAddPartsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="size-5" />
              Agregar Pieza
            </DialogTitle>
            <DialogDescription>Busque y agregue piezas a la reparación</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar producto..."
                value={partSearch}
                onChange={(e) => setPartSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {partProductsLoading && <Skeleton className="h-20 w-full" />}

            {partProducts.length > 0 && (
              <ScrollArea className="max-h-60">
                <div className="space-y-2">
                  {partProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between rounded-md border p-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Stock: {product.quantity} · {formatCurrency(product.salePrice)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 ml-2"
                        disabled={product.quantity <= 0 || addingPart}
                        onClick={() => addPart(product, 1)}
                      >
                        <Plus className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {partSearch && !partProductsLoading && partProducts.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">No se encontraron productos</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
