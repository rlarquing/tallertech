'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import {
  Receipt,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  CalendarDays,
  DollarSign,
  Filter,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { offlineFetch } from '@/lib/offline-fetch'
import { expenseSchema } from '@/lib/validations'

interface Expense {
  id: string
  category: string
  description: string
  amount: number
  date: string
  notes: string | null
  userId: string
  userName: string
  createdAt: string
  updatedAt: string
}

interface ExpenseForm {
  category: string
  description: string
  amount: string
  date: string
  notes: string
}

const emptyForm: ExpenseForm = {
  category: 'supplies',
  description: '',
  amount: '',
  date: new Date().toISOString().split('T')[0],
  notes: '',
}

const categoryLabels: Record<string, string> = {
  supplies: 'Insumos',
  rent: 'Alquiler',
  salary: 'Salario',
  utilities: 'Servicios',
  other: 'Otro',
}

const categoryColors: Record<string, string> = {
  supplies: 'bg-info/10 text-info',
  rent: 'bg-chart-4/10 text-warning',
  salary: 'bg-chart-2/10 text-chart-2',
  utilities: 'bg-chart-2/10 text-info',
  other: 'bg-muted text-muted-foreground',
}

type DateFilter = 'today' | 'week' | 'month' | 'custom'

export function ExpensesView() {
  const { toast } = useToast()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  // Filters
  const [dateFilter, setDateFilter] = useState<DateFilter>('month')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  // Summary
  const [totalAmount, setTotalAmount] = useState(0)
  const [categoryBreakdown, setCategoryBreakdown] = useState<Array<{ category: string; total: number }>>([])

  // Dialogs
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null)
  const [form, setForm] = useState<ExpenseForm>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const limit = 20

  const getDateRange = useCallback(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (dateFilter) {
      case 'today':
        return { from: today.toISOString().split('T')[0], to: today.toISOString().split('T')[0] }
      case 'week': {
        const weekStart = new Date(today)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        return { from: weekStart.toISOString().split('T')[0], to: now.toISOString().split('T')[0] }
      }
      case 'month': {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        return { from: monthStart.toISOString().split('T')[0], to: now.toISOString().split('T')[0] }
      }
      case 'custom':
        return { from: customFrom, to: customTo }
      default:
        return { from: '', to: '' }
    }
  }, [dateFilter, customFrom, customTo])

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const { from, to } = getDateRange()
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      })
      if (from) params.set('dateFrom', from)
      if (to) params.set('dateTo', to)
      if (categoryFilter && categoryFilter !== 'all') params.set('category', categoryFilter)

      const res = await offlineFetch(`/api/expenses?${params}`)
      if (res.ok) {
        const data = await res.json()
        setExpenses(data.data)
        setTotal(data.total)

        // Calculate totals
        const sum = data.data.reduce((acc: number, e: Expense) => acc + e.amount, 0)
        setTotalAmount(sum)

        // Category breakdown
        const byCategory: Record<string, number> = {}
        data.data.forEach((e: Expense) => {
          byCategory[e.category] = (byCategory[e.category] || 0) + e.amount
        })
        setCategoryBreakdown(
          Object.entries(byCategory)
            .map(([category, total]) => ({ category, total }))
            .sort((a, b) => b.total - a.total)
        )
      }
    } catch {
      toast({ title: 'Error', description: 'Error al cargar gastos', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [page, getDateRange, categoryFilter, toast])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  const openAddDialog = () => {
    setEditingExpense(null)
    setForm(emptyForm)
    setValidationErrors({})
    setFormOpen(true)
  }

  const openEditDialog = (expense: Expense) => {
    setEditingExpense(expense)
    setForm({
      category: expense.category,
      description: expense.description,
      amount: String(expense.amount),
      date: new Date(expense.date).toISOString().split('T')[0],
      notes: expense.notes || '',
    })
    setValidationErrors({})
    setFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate with Zod
    const result = expenseSchema.safeParse({
      category: form.category,
      description: form.description,
      amount: parseFloat(form.amount),
      date: form.date || new Date().toISOString().split('T')[0],
      notes: form.notes || undefined,
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
      const url = editingExpense ? `/api/expenses/${editingExpense.id}` : '/api/expenses'
      const method = editingExpense ? 'PUT' : 'POST'
      const res = await offlineFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: form.category,
          description: form.description,
          amount: parseFloat(form.amount),
          date: form.date || undefined,
          notes: form.notes || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: 'Error', description: data.error || 'Error al guardar', variant: 'destructive' })
        return
      }
      toast({
        title: editingExpense ? 'Gasto actualizado' : 'Gasto registrado',
        description: editingExpense ? 'El gasto se actualizó correctamente' : 'El gasto se registró correctamente',
      })
      setFormOpen(false)
      fetchExpenses()
    } catch {
      toast({ title: 'Error', description: 'Error de conexión', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteExpense) return
    try {
      const res = await offlineFetch(`/api/expenses/${deleteExpense.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Error al eliminar', variant: 'destructive' })
        return
      }
      toast({ title: 'Gasto eliminado', description: 'El gasto fue eliminado correctamente' })
      setDeleteOpen(false)
      setDeleteExpense(null)
      fetchExpenses()
    } catch {
      toast({ title: 'Error', description: 'Error de conexión', variant: 'destructive' })
    }
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const totalPages = Math.ceil(total / limit)

  const chartData = categoryBreakdown.map(item => ({
    category: categoryLabels[item.category] || item.category,
    monto: item.total,
    fill: item.category,
  }))

  const chartConfig = {
    supplies: { label: 'Insumos', color: 'oklch(0.6 0.118 184.704)' },
    rent: { label: 'Alquiler', color: 'oklch(0.828 0.189 84.429)' },
    salary: { label: 'Salario', color: 'oklch(0.627 0.265 303.9)' },
    utilities: { label: 'Servicios', color: 'oklch(0.6 0.164 200)' },
    other: { label: 'Otro', color: 'oklch(0.65 0.15 60)' },
    monto: { label: 'Monto', color: 'oklch(0.508 0.164 160)' },
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <DollarSign className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Gastos (período)</p>
                <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Registros</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Desglose por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="category" width={80} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="monto" radius={[0, 4, 4, 0]} fill="oklch(0.508 0.164 160)" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Filters & Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtros:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['today', 'week', 'month', 'custom'] as DateFilter[]).map((filter) => (
              <Button
                key={filter}
                variant={dateFilter === filter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateFilter(filter)}
              >
                {filter === 'today' ? 'Hoy' : filter === 'week' ? 'Esta Semana' : filter === 'month' ? 'Este Mes' : 'Personalizado'}
              </Button>
            ))}
          </div>
          <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1) }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="supplies">Insumos</SelectItem>
              <SelectItem value="rent">Alquiler</SelectItem>
              <SelectItem value="salary">Salario</SelectItem>
              <SelectItem value="utilities">Servicios</SelectItem>
              <SelectItem value="other">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openAddDialog} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Gasto
        </Button>
      </div>

      {/* Custom Date Range */}
      {dateFilter === 'custom' && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-2">
            <Label className="text-sm">Desde:</Label>
            <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="w-40" />
            <Label className="text-sm">Hasta:</Label>
            <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="w-40" />
          </div>
        </div>
      )}

      {/* Expenses Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Cargando gastos...</span>
            </div>
          ) : expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">No se encontraron gastos</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="whitespace-nowrap">{formatDate(expense.date)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={categoryColors[expense.category] || ''}>
                            {categoryLabels[expense.category] || expense.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{expense.description}</p>
                            {expense.notes && (
                              <p className="text-xs text-muted-foreground">{expense.notes}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold whitespace-nowrap">
                          {formatCurrency(expense.amount)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(expense)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => { setDeleteExpense(expense); setDeleteOpen(true) }}
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
            <DialogTitle>{editingExpense ? 'Editar Gasto' : 'Nuevo Gasto'}</DialogTitle>
            <DialogDescription>
              {editingExpense ? 'Modifique los datos del gasto' : 'Registre un nuevo gasto'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Categoría *</Label>
                  <Select value={form.category} onValueChange={(v) => { setForm({ ...form, category: v }); setValidationErrors((prev) => { const { category, ...rest } = prev; return rest }) }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supplies">Insumos</SelectItem>
                      <SelectItem value="rent">Alquiler</SelectItem>
                      <SelectItem value="salary">Salario</SelectItem>
                      <SelectItem value="utilities">Servicios</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  {validationErrors.category && (
                    <p className="text-xs text-destructive">{validationErrors.category}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Monto *</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => { setForm({ ...form, amount: e.target.value }); setValidationErrors((prev) => { const { amount, ...rest } = prev; return rest }) }}
                    placeholder="0.00"
                    required
                  />
                  {validationErrors.amount && (
                    <p className="text-xs text-destructive">{validationErrors.amount}</p>
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descripción *</Label>
                <Input
                  id="description"
                  value={form.description}
                  onChange={(e) => { setForm({ ...form, description: e.target.value }); setValidationErrors((prev) => { const { description, ...rest } = prev; return rest }) }}
                  placeholder="Descripción del gasto"
                  required
                />
                {validationErrors.description && (
                  <p className="text-xs text-destructive">{validationErrors.description}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => { setForm({ ...form, date: e.target.value }); setValidationErrors((prev) => { const { date, ...rest } = prev; return rest }) }}
                />
                {validationErrors.date && (
                  <p className="text-xs text-destructive">{validationErrors.date}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Notas adicionales..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingExpense ? 'Guardar Cambios' : 'Registrar Gasto'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar gasto?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de que desea eliminar el gasto &quot;{deleteExpense?.description}&quot;? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteExpense(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
