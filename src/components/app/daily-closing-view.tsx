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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ShoppingCart,
  Wrench,
  Receipt,
  DollarSign,
  Loader2,
  CalendarDays,
  CheckCircle2,
  PlayCircle,
  Lock,
  Calculator,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { offlineFetch } from '@/lib/offline-fetch'
import { useAppStore } from '@/lib/store'

interface DailyClosing {
  id: string
  workshopId: string
  userId: string
  userName: string
  date: string
  salesCount: number
  salesTotal: number
  repairsCount: number
  repairsTotal: number
  expensesTotal: number
  totalIncome: number
  netTotal: number
  notes: string | null
  status: string
  closedAt: string | null
  createdAt: string
  updatedAt: string
}

interface SummaryData {
  salesCount: number
  salesTotal: number
  repairsCount: number
  repairsTotal: number
  expensesTotal: number
  totalIncome: number
  netTotal: number
}

const defaultSummary: SummaryData = {
  salesCount: 0,
  salesTotal: 0,
  repairsCount: 0,
  repairsTotal: 0,
  expensesTotal: 0,
  totalIncome: 0,
  netTotal: 0,
}

export function DailyClosingView() {
  const { toast } = useToast()
  const { currentWorkshopId, workshops } = useAppStore()

  // Date and workshop selection
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedWorkshopId, setSelectedWorkshopId] = useState(currentWorkshopId || '')

  // Data
  const [summary, setSummary] = useState<SummaryData>(defaultSummary)
  const [closings, setClosings] = useState<DailyClosing[]>([])
  const [closingsTotal, setClosingsTotal] = useState(0)
  const [closingsPage, setClosingsPage] = useState(1)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [closingsLoading, setClosingsLoading] = useState(false)

  // Closing state
  const [todayClosing, setTodayClosing] = useState<DailyClosing | null>(null)
  const [closingLoading, setClosingLoading] = useState(false)
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)
  const [closeNotes, setCloseNotes] = useState('')

  const activeWorkshopId = selectedWorkshopId || currentWorkshopId
  const currentWorkshop = workshops.find(w => w.id === activeWorkshopId)

  const limit = 20

  const fetchSummary = useCallback(async () => {
    if (!activeWorkshopId) return
    setSummaryLoading(true)
    try {
      const res = await offlineFetch(
        `/api/daily-closings/summary?workshopId=${activeWorkshopId}&date=${selectedDate}`
      )
      if (res.ok) {
        const data = await res.json()
        const s = data.data || data
        setSummary({
          salesCount: s.salesCount ?? 0,
          salesTotal: s.salesTotal ?? 0,
          repairsCount: s.repairsCount ?? 0,
          repairsTotal: s.repairsTotal ?? 0,
          expensesTotal: s.expensesTotal ?? 0,
          totalIncome: s.totalIncome ?? 0,
          netTotal: s.netTotal ?? 0,
        })
      }
    } catch {
      // Silently fail
    } finally {
      setSummaryLoading(false)
    }
  }, [activeWorkshopId, selectedDate])

  const fetchClosings = useCallback(async () => {
    if (!activeWorkshopId) return
    setClosingsLoading(true)
    try {
      const today = new Date()
      const monthAgo = new Date(today)
      monthAgo.setDate(monthAgo.getDate() - 30)

      const params = new URLSearchParams({
        workshopId: activeWorkshopId,
        dateFrom: monthAgo.toISOString().split('T')[0],
        dateTo: today.toISOString().split('T')[0],
        page: String(closingsPage),
        limit: String(limit),
      })
      const res = await offlineFetch(`/api/daily-closings?${params}`)
      if (res.ok) {
        const data = await res.json()
        setClosings(data.data || [])
        setClosingsTotal(data.total || 0)
      }
    } catch {
      // Silently fail
    } finally {
      setClosingsLoading(false)
    }
  }, [activeWorkshopId, closingsPage])

  const fetchTodayClosing = useCallback(async () => {
    if (!activeWorkshopId) return
    try {
      const today = new Date().toISOString().split('T')[0]
      const params = new URLSearchParams({
        workshopId: activeWorkshopId,
        dateFrom: today,
        dateTo: today,
        limit: '10',
      })
      const res = await offlineFetch(`/api/daily-closings?${params}`)
      if (res.ok) {
        const data = await res.json()
        const todayClosings = (data.data || []).filter(
          (c: DailyClosing) => c.date && new Date(c.date).toISOString().split('T')[0] === today
        )
        setTodayClosing(todayClosings.length > 0 ? todayClosings[0] : null)
      }
    } catch {
      // Silently fail
    }
  }, [activeWorkshopId])

  useEffect(() => {
    if (currentWorkshopId && !selectedWorkshopId) {
      setSelectedWorkshopId(currentWorkshopId)
    }
  }, [currentWorkshopId, selectedWorkshopId])

  useEffect(() => {
    fetchSummary()
    fetchTodayClosing()
  }, [fetchSummary, fetchTodayClosing])

  useEffect(() => {
    fetchClosings()
  }, [fetchClosings])

  const handleCreateClosing = async () => {
    if (!activeWorkshopId) return
    setClosingLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const res = await offlineFetch('/api/daily-closings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workshopId: activeWorkshopId, date: today }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: 'Error', description: data.error || 'Error al crear cierre', variant: 'destructive' })
        return
      }
      toast({ title: 'Cierre iniciado', description: 'El cierre diario fue creado correctamente' })
      fetchTodayClosing()
      fetchClosings()
      fetchSummary()
    } catch {
      toast({ title: 'Error', description: 'Error de conexión', variant: 'destructive' })
    } finally {
      setClosingLoading(false)
    }
  }

  const handleCloseClosing = async () => {
    if (!todayClosing) return
    setClosingLoading(true)
    try {
      const res = await offlineFetch(`/api/daily-closings/${todayClosing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: closeNotes || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: 'Error', description: data.error || 'Error al cerrar', variant: 'destructive' })
        return
      }
      toast({ title: 'Cierre realizado', description: 'El cierre diario fue completado exitosamente' })
      setCloseDialogOpen(false)
      setCloseNotes('')
      fetchTodayClosing()
      fetchClosings()
      fetchSummary()
    } catch {
      toast({ title: 'Error', description: 'Error de conexión', variant: 'destructive' })
    } finally {
      setClosingLoading(false)
    }
  }

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

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isToday = selectedDate === new Date().toISOString().split('T')[0]
  const totalPages = Math.ceil(closingsTotal / limit)

  if (!activeWorkshopId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Calculator className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Selecciona un Taller</h2>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Debes seleccionar un taller para ver el cierre diario.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      {/* Date Selector & Workshop Selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="grid gap-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              Fecha
            </Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-44"
            />
          </div>
          {workshops.length > 1 && (
            <div className="grid gap-2">
              <Label className="text-sm font-medium">Taller</Label>
              <Select
                value={selectedWorkshopId}
                onValueChange={setSelectedWorkshopId}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Seleccionar taller" />
                </SelectTrigger>
                <SelectContent>
                  {workshops.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Closing Action */}
        {isToday && (
          <div className="flex items-center gap-2">
            {!todayClosing ? (
              <Button onClick={handleCreateClosing} disabled={closingLoading}>
                {closingLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PlayCircle className="mr-2 h-4 w-4" />
                )}
                Iniciar Cierre
              </Button>
            ) : todayClosing.status === 'open' ? (
              <Button onClick={() => setCloseDialogOpen(true)} disabled={closingLoading}>
                {closingLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="mr-2 h-4 w-4" />
                )}
                Cerrar Cierre
              </Button>
            ) : (
              <Badge variant="secondary" className="bg-chart-2/10 text-chart-2 px-3 py-1.5 text-sm">
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                Cierre Realizado — {formatDateTime(todayClosing.closedAt)}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ventas del Día</p>
                {summaryLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <p className="text-lg font-bold">{formatCurrency(summary.salesTotal)}</p>
                    <p className="text-xs text-muted-foreground">{summary.salesCount} venta{summary.salesCount !== 1 ? 's' : ''}</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                <Wrench className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reparaciones del Día</p>
                {summaryLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <p className="text-lg font-bold">{formatCurrency(summary.repairsTotal)}</p>
                    <p className="text-xs text-muted-foreground">{summary.repairsCount} reparación{summary.repairsCount !== 1 ? 'es' : ''}</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <Receipt className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gastos del Día</p>
                {summaryLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <p className="text-lg font-bold">{formatCurrency(summary.expensesTotal)}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-4/10">
                <DollarSign className="h-5 w-5 text-chart-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ingreso Neto</p>
                {summaryLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <p className={`text-lg font-bold ${summary.netTotal >= 0 ? '' : 'text-destructive'}`}>
                    {formatCurrency(summary.netTotal)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Closings History Table */}
      <div>
        <h3 className="text-base font-semibold mb-3">Historial de Cierres</h3>
        <Card>
          <CardContent className="p-0">
            {closingsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Cargando cierres...</span>
              </div>
            ) : closings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calculator className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">No hay cierres registrados</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Empleado</TableHead>
                        <TableHead className="text-right">Ventas</TableHead>
                        <TableHead className="text-right">Reparaciones</TableHead>
                        <TableHead className="text-right">Gastos</TableHead>
                        <TableHead className="text-right">Neto</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {closings.map((closing) => (
                        <TableRow key={closing.id}>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(closing.date)}
                          </TableCell>
                          <TableCell>{closing.userName}</TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <div>
                              <span className="font-medium">{formatCurrency(closing.salesTotal)}</span>
                              <span className="text-xs text-muted-foreground ml-1">({closing.salesCount})</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <div>
                              <span className="font-medium">{formatCurrency(closing.repairsTotal)}</span>
                              <span className="text-xs text-muted-foreground ml-1">({closing.repairsCount})</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap font-medium">
                            {formatCurrency(closing.expensesTotal)}
                          </TableCell>
                          <TableCell className={`text-right whitespace-nowrap font-semibold ${closing.netTotal >= 0 ? '' : 'text-destructive'}`}>
                            {formatCurrency(closing.netTotal)}
                          </TableCell>
                          <TableCell>
                            {closing.status === 'open' ? (
                              <Badge variant="secondary" className="bg-warning/10 text-warning">
                                Abierto
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-chart-2/10 text-chart-2">
                                Cerrado
                              </Badge>
                            )}
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
                      {((closingsPage - 1) * limit) + 1} - {Math.min(closingsPage * limit, closingsTotal)} de {closingsTotal}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={closingsPage <= 1}
                        onClick={() => setClosingsPage(closingsPage - 1)}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={closingsPage >= totalPages}
                        onClick={() => setClosingsPage(closingsPage + 1)}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Close Closing Dialog */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cerrar Cierre Diario</DialogTitle>
            <DialogDescription>
              Confirme el cierre del día. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Summary in dialog */}
            <div className="rounded-lg border p-3 space-y-2">
              <p className="text-sm font-medium">Resumen del día</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Ventas:</div>
                <div className="font-medium text-right">{formatCurrency(summary.salesTotal)} ({summary.salesCount})</div>
                <div className="text-muted-foreground">Reparaciones:</div>
                <div className="font-medium text-right">{formatCurrency(summary.repairsTotal)} ({summary.repairsCount})</div>
                <div className="text-muted-foreground">Gastos:</div>
                <div className="font-medium text-right">{formatCurrency(summary.expensesTotal)}</div>
                <Separator className="col-span-2" />
                <div className="text-muted-foreground font-medium">Ingreso Neto:</div>
                <div className={`font-bold text-right ${summary.netTotal >= 0 ? '' : 'text-destructive'}`}>
                  {formatCurrency(summary.netTotal)}
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="closeNotes">Notas / Observaciones</Label>
              <Textarea
                id="closeNotes"
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                placeholder="Observaciones del cierre..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialogOpen(false)} disabled={closingLoading}>
              Cancelar
            </Button>
            <Button onClick={handleCloseClosing} disabled={closingLoading}>
              {closingLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Cierre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
