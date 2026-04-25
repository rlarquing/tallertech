'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  Search,
  Calendar,
  Eye,
  XCircle,
  Receipt,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShoppingBag,
  Printer,
} from 'lucide-react'
import { toast } from 'sonner'
import { offlineFetch } from '@/lib/offline-fetch'

// ============================================================
// Types
// ============================================================

interface SaleItem {
  id: string
  name: string
  quantity: number
  unitPrice: number
  discount: number
  total: number
  type: string
  product: { name: string; sku: string | null } | null
}

interface Sale {
  id: string
  code: string
  subtotal: number
  discount: number
  tax: number
  total: number
  paymentMethod: string
  status: string
  notes: string | null
  createdAt: string
  customer: { id: string; name: string; phone: string | null } | null
  items: SaleItem[]
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

const paymentLabels: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  mixto: 'Mixto',
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  completed: { label: 'Completada', variant: 'default' },
  pending: { label: 'Pendiente', variant: 'secondary' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
}

const dateFilterOptions = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Esta Semana' },
  { value: 'month', label: 'Este Mes' },
  { value: 'all', label: 'Todo' },
]

// ============================================================
// Sales View Component
// ============================================================

export function SalesView() {
  // Filters
  const [dateFilter, setDateFilter] = useState('month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Data
  const [sales, setSales] = useState<Sale[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const limit = 20

  // Detail dialog
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)

  // Cancel dialog
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const searchTimeout = React.useRef<ReturnType<typeof setTimeout>>()

  // ============================================================
  // Date range helper
  // ============================================================

  const getDateRange = useCallback(() => {
    const now = new Date()
    let from = ''
    let to = ''

    if (dateFilter === 'today') {
      from = now.toISOString().split('T')[0]
      to = from
    } else if (dateFilter === 'week') {
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      from = startOfWeek.toISOString().split('T')[0]
      to = now.toISOString().split('T')[0]
    } else if (dateFilter === 'month') {
      from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
      to = now.toISOString().split('T')[0]
    } else if (dateFilter === 'custom') {
      from = customFrom
      to = customTo
    }

    return { from, to }
  }, [dateFilter, customFrom, customTo])

  // ============================================================
  // Fetch sales
  // ============================================================

  const fetchSales = useCallback(async () => {
    setLoading(true)
    try {
      const { from, to } = getDateRange()
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
      if (from) params.set('dateFrom', from)
      if (to) params.set('dateTo', to)
      if (searchQuery) params.set('search', searchQuery)

      const res = await offlineFetch(`/api/sales?${params}`)
      if (res.ok) {
        const data = await res.json()
        setSales(data.data || [])
        setTotal(data.total || 0)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [page, getDateRange, searchQuery])

  useEffect(() => {
    fetchSales()
  }, [fetchSales])

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
  // View detail
  // ============================================================

  const viewDetail = async (saleId: string) => {
    setDetailOpen(true)
    setDetailLoading(true)
    try {
      const res = await offlineFetch(`/api/sales/${saleId}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedSale(data)
      }
    } catch {
      toast.error('Error al cargar detalle')
    } finally {
      setDetailLoading(false)
    }
  }

  // ============================================================
  // Cancel sale
  // ============================================================

  const cancelSale = async () => {
    if (!cancelId) return
    setCancelling(true)
    try {
      const res = await offlineFetch(`/api/sales/${cancelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      if (res.ok) {
        toast.success('Venta cancelada correctamente')
        fetchSales()
        if (detailOpen && selectedSale?.id === cancelId) {
          setSelectedSale((prev) => (prev ? { ...prev, status: 'cancelled' } : null))
        }
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al cancelar venta')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setCancelling(false)
      setCancelId(null)
    }
  }

  // ============================================================
  // Print sale
  // ============================================================

  const printSale = (sale: Sale) => {
    const content = `
      <html>
        <head><title>Venta ${sale.code}</title>
        <style>
          body { font-family: monospace; padding: 20px; max-width: 300px; margin: auto; }
          h2 { text-align: center; margin-bottom: 5px; }
          .line { border-top: 1px dashed #000; margin: 10px 0; }
          .row { display: flex; justify-content: space-between; margin: 4px 0; }
          .total { font-size: 1.2em; font-weight: bold; }
        </style></head>
        <body>
          <h2>TallerTech</h2>
          <p style="text-align:center;">Comprobante de Venta</p>
          <div class="line"></div>
          <div class="row"><span>Código:</span><span>${sale.code}</span></div>
          <div class="row"><span>Fecha:</span><span>${new Date(sale.createdAt).toLocaleString('es-CU')}</span></div>
          <div class="row"><span>Cliente:</span><span>${sale.customer?.name || 'General'}</span></div>
          <div class="row"><span>Pago:</span><span>${paymentLabels[sale.paymentMethod] || sale.paymentMethod}</span></div>
          <div class="line"></div>
          ${sale.items.map((item) => `<div class="row"><span>${item.name} x${item.quantity}</span><span>$${item.total.toFixed(2)}</span></div>`).join('')}
          <div class="line"></div>
          <div class="row"><span>Subtotal:</span><span>$${sale.subtotal.toFixed(2)}</span></div>
          ${sale.discount > 0 ? `<div class="row"><span>Descuento:</span><span>-$${sale.discount.toFixed(2)}</span></div>` : ''}
          <div class="row total"><span>Total:</span><span>$${sale.total.toFixed(2)}</span></div>
          <div class="line"></div>
          <p style="text-align:center;font-size:0.8em;">Gracias por su compra</p>
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
  // Render
  // ============================================================

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Date filter */}
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-muted-foreground shrink-0" />
              <Select value={dateFilter} onValueChange={(v) => { setDateFilter(v); setPage(1) }}>
                <SelectTrigger className="w-[150px] h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dateFilterOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateFilter === 'custom' && (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={customFrom}
                  onChange={(e) => { setCustomFrom(e.target.value); setPage(1) }}
                  className="h-9 text-sm w-[140px]"
                />
                <span className="text-muted-foreground text-xs">a</span>
                <Input
                  type="date"
                  value={customTo}
                  onChange={(e) => { setCustomTo(e.target.value); setPage(1) }}
                  className="h-9 text-sm w-[140px]"
                />
              </div>
            )}

            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por código o cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Desktop Table */}
      <Card className="hidden md:block">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingBag className="size-4" />
              Historial de Ventas
            </CardTitle>
            <span className="text-sm text-muted-foreground">{total} ventas</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : sales.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-center">Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Pago</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => {
                    const st = statusConfig[sale.status] || statusConfig.pending
                    return (
                      <TableRow key={sale.id}>
                        <TableCell className="font-mono text-xs">{sale.code}</TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {sale.customer?.name || 'General'}
                        </TableCell>
                        <TableCell className="text-center">{sale.items.length}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(sale.total)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {paymentLabels[sale.paymentMethod] || sale.paymentMethod}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={st.variant} className="text-xs">{st.label}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(sale.createdAt).toLocaleDateString('es-CU')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => viewDetail(sale.id)}
                            >
                              <Eye className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => printSale(sale)}
                            >
                              <Printer className="size-4" />
                            </Button>
                            {sale.status !== 'cancelled' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-destructive hover:text-destructive"
                                onClick={() => setCancelId(sale.id)}
                              >
                                <XCircle className="size-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <span className="text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Receipt className="size-10 mb-2 opacity-40" />
              <p className="text-sm">No se encontraron ventas</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)
        ) : sales.length > 0 ? (
          sales.map((sale) => {
            const st = statusConfig[sale.status] || statusConfig.pending
            return (
              <Card key={sale.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">{sale.code}</span>
                    <Badge variant={st.variant} className="text-xs">{st.label}</Badge>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cliente:</span>
                      <span>{sale.customer?.name || 'General'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Items:</span>
                      <span>{sale.items.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pago:</span>
                      <span>{paymentLabels[sale.paymentMethod] || sale.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-base">
                      <span>Total:</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(sale.total)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{new Date(sale.createdAt).toLocaleString('es-CU')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => viewDetail(sale.id)}>
                      <Eye className="mr-1 size-3" /> Ver
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => printSale(sale)}>
                      <Printer className="mr-1 size-3" /> Imprimir
                    </Button>
                    {sale.status !== 'cancelled' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setCancelId(sale.id)}
                      >
                        <XCircle className="size-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Receipt className="size-10 mb-2 opacity-40" />
            <p className="text-sm">No se encontraron ventas</p>
          </div>
        )}

        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-2">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="size-5" />
              Detalle de Venta
            </DialogTitle>
            <DialogDescription>Información completa de la venta</DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : selectedSale ? (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Código:</span>
                  <span className="font-mono font-semibold">{selectedSale.code}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span>{selectedSale.customer?.name || 'Cliente general'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Método de pago:</span>
                  <span>{paymentLabels[selectedSale.paymentMethod] || selectedSale.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estado:</span>
                  <Badge variant={statusConfig[selectedSale.status]?.variant || 'secondary'} className="text-xs">
                    {statusConfig[selectedSale.status]?.label || selectedSale.status}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fecha:</span>
                  <span>{new Date(selectedSale.createdAt).toLocaleString('es-CU')}</span>
                </div>
                {selectedSale.notes && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Notas:</span>
                    <span className="text-right max-w-[200px]">{selectedSale.notes}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Items ({selectedSale.items.length})</h4>
                <ScrollArea className="max-h-60">
                  <div className="space-y-2">
                    {selectedSale.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm rounded-md border p-2">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(item.unitPrice)} × {item.quantity}
                            {item.discount > 0 && ` - desc: ${formatCurrency(item.discount)}`}
                          </p>
                        </div>
                        <span className="font-semibold">{formatCurrency(item.total)}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <Separator />

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>{formatCurrency(selectedSale.subtotal)}</span>
                </div>
                {selectedSale.discount > 0 && (
                  <div className="flex justify-between text-sm text-destructive">
                    <span>Descuento:</span>
                    <span>-{formatCurrency(selectedSale.discount)}</span>
                  </div>
                )}
                {selectedSale.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Impuesto:</span>
                    <span>{formatCurrency(selectedSale.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base">
                  <span>Total:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(selectedSale.total)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => printSale(selectedSale)}>
                  <Printer className="mr-2 size-4" /> Imprimir
                </Button>
                {selectedSale.status !== 'cancelled' && (
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => setCancelId(selectedSale.id)}
                  >
                    <XCircle className="mr-2 size-4" /> Cancelar
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation */}
      <AlertDialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Venta</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de que desea cancelar esta venta? El stock será restaurado automáticamente. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>No, mantener</AlertDialogCancel>
            <AlertDialogAction
              onClick={cancelSale}
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelling ? (
                <><Loader2 className="mr-2 size-4 animate-spin" /> Cancelando...</>
              ) : (
                'Sí, cancelar venta'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
