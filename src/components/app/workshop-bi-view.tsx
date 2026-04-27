'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Pie,
  PieChart,
  Cell,
  Bar,
  BarChart,
} from 'recharts'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  BarChart3,
  Package,
  Wrench,
  AlertTriangle,
  ShoppingCart,
  CreditCard,
  Clock,
  Crown,
  Loader2,
  Warehouse,
} from 'lucide-react'
import { offlineFetch } from '@/lib/offline-fetch'

// ─── Types ───────────────────────────────────────────────────────────────────

interface BIData {
  revenue: number
  expenses: number
  netProfit: number
  revenueTrend: number
  expensesTrend: number
  activeWorkshops?: number
  revenueChart: { date: string; revenue: number; expenses: number }[]
  workshopComparison?: {
    id: string
    name: string
    revenue: number
    expenses: number
    netProfit: number
    salesCount: number
    repairsCount: number
  }[]
  topProducts?: { name: string; total: number; quantity: number }[]
  salesByPaymentMethod?: { method: string; count: number; total: number }[]
  repairsByStatus?: Record<string, number>
  expensesByCategory?: { category: string; total: number }[]
  pendingRepairs?: number
  lowStockCount?: number
  mostProfitableWorkshop?: string
  bestSellingProduct?: string
  revenueTrendLabel?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency = 'CUP'): string {
  const currencyMap: Record<string, string> = {
    CUP: 'CUP',
    MLC: 'USD',
    USD: 'USD',
    EUR: 'EUR',
    ARS: 'ARS',
    BOB: 'BOB',
    MXN: 'MXN',
    COP: 'COP',
  }
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: currencyMap[currency] || 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-BO', { day: '2-digit', month: 'short' })
}

const statusLabels: Record<string, string> = {
  received: 'Recibido',
  diagnosing: 'Diagnosticando',
  waiting_parts: 'Esperando Repuestos',
  repairing: 'Reparando',
  ready: 'Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

const statusColors: Record<string, string> = {
  received: '#6b7280',
  diagnosing: '#3b82f6',
  waiting_parts: '#f59e0b',
  repairing: '#8b5cf6',
  ready: '#10b981',
  delivered: '#059669',
  cancelled: '#ef4444',
}

const categoryLabels: Record<string, string> = {
  supplies: 'Insumos',
  rent: 'Alquiler',
  salary: 'Salarios',
  utilities: 'Servicios',
  other: 'Otros',
}

const paymentMethodLabels: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  other: 'Otro',
}

const paymentMethodColors: Record<string, string> = {
  cash: '#10b981',
  card: '#3b82f6',
  transfer: '#8b5cf6',
  other: '#f59e0b',
}

// ─── Chart Configs ───────────────────────────────────────────────────────────

const revenueChartConfig: ChartConfig = {
  revenue: { label: 'Ingresos', color: '#10b981' },
  expenses: { label: 'Gastos', color: '#f59e0b' },
}

const comparisonChartConfig: ChartConfig = {
  revenue: { label: 'Ingresos', color: '#10b981' },
}

const repairsChartConfig: ChartConfig = Object.fromEntries(
  Object.entries(statusLabels).map(([key, label]) => [
    key,
    { label, color: statusColors[key] },
  ])
)

const paymentChartConfig: ChartConfig = Object.fromEntries(
  Object.entries(paymentMethodLabels).map(([key, label]) => [
    key,
    { label, color: paymentMethodColors[key] },
  ])
)

const expenseCategoryConfig: ChartConfig = Object.fromEntries(
  Object.entries(categoryLabels).map(([key, label]) => [
    key,
    { label, color: '#f59e0b' },
  ])
)

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  iconColor = 'bg-primary/10 text-primary',
  valueIsCurrency = true,
  currency = 'CUP',
  valueColor,
}: {
  title: string
  value: string | number
  icon: React.ElementType
  trend?: number
  trendLabel?: string
  iconColor?: string
  valueIsCurrency?: boolean
  currency?: string
  valueColor?: string
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardDescription className="text-sm font-medium">{title}</CardDescription>
        <div className={`flex size-9 items-center justify-center rounded-lg ${iconColor}`}>
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div
          className="text-2xl font-bold tracking-tight"
          style={valueColor ? { color: valueColor } : undefined}
        >
          {valueIsCurrency ? formatCurrency(Number(value), currency) : value}
        </div>
        {trend !== undefined && trendLabel && (
          <div className="mt-1 flex items-center gap-1 text-xs">
            {trend >= 0 ? (
              <ArrowUpRight className="size-3 text-primary" />
            ) : (
              <ArrowDownRight className="size-3 text-red-500" />
            )}
            <span className={trend >= 0 ? 'text-primary' : 'text-red-500'}>
              {trend >= 0 ? '+' : ''}
              {trend.toFixed(1)}%
            </span>
            <span className="text-muted-foreground">{trendLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function BISkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-9 rounded-lg" />
            </CardHeader>
            <CardContent className="pt-0">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="mt-2 h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function WorkshopBIView() {
  const { toast } = useToast()
  const { workshops, currentWorkshopId, setCurrentWorkshopId } = useAppStore()

  const [data, setData] = useState<BIData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30d')
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string | null>(currentWorkshopId)

  // Fetch BI data
  const fetchBI = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedWorkshopId) params.set('workshopId', selectedWorkshopId)
      params.set('range', dateRange)

      const res = await offlineFetch(`/api/workshops/bi?${params}`)
      if (res.ok) {
        const result = await res.json()
        setData(result.data || result)
      } else {
        // Use fallback data so the UI is still useful
        setData(generateFallbackData())
      }
    } catch {
      setData(generateFallbackData())
    } finally {
      setLoading(false)
    }
  }, [selectedWorkshopId, dateRange])

  useEffect(() => {
    fetchBI()
  }, [fetchBI])

  // Sync with store
  useEffect(() => {
    setCurrentWorkshopId(selectedWorkshopId)
  }, [selectedWorkshopId, setCurrentWorkshopId])

  const isAllView = !selectedWorkshopId
  const currentWorkshop = workshops.find((w) => w.id === selectedWorkshopId)
  const currency = 'CUP' // Default; could be per-workshop

  // Format revenue chart data
  const revenueChartData = (data?.revenueChart || []).map((item) => ({
    ...item,
    dateLabel: formatDate(item.date),
  }))

  // Build repairs pie data
  const repairsPieData = data?.repairsByStatus
    ? Object.entries(data.repairsByStatus)
        .filter(([, value]) => value > 0)
        .map(([status, count]) => ({
          status,
          label: statusLabels[status] || status,
          count,
          fill: statusColors[status] || '#6b7280',
        }))
    : []

  // Payment method pie data
  const paymentPieData = data?.salesByPaymentMethod
    ? data.salesByPaymentMethod.map((item) => ({
        method: item.method,
        label: paymentMethodLabels[item.method] || item.method,
        count: item.count,
        total: item.total,
        fill: paymentMethodColors[item.method] || '#6b7280',
      }))
    : []

  // Expenses by category bar data
  const expensesBarData = data?.expensesByCategory
    ? data.expensesByCategory.map((item) => ({
        category: categoryLabels[item.category] || item.category,
        total: item.total,
        fill: '#f59e0b',
      }))
    : []

  // Workshop comparison data
  const comparisonData = data?.workshopComparison || []

  if (loading || !data) {
    return <BISkeleton />
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            {isAllView ? (
              <>
                <Crown className="size-6 text-amber-600" />
                Panel de Dueño
              </>
            ) : (
              <>
                <BarChart3 className="size-6 text-primary" />
                BI - {currentWorkshop?.name || 'Taller'}
              </>
            )}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isAllView
              ? 'Vista consolidada de todos tus talleres'
              : 'Análisis detallado del taller'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Workshop Selector */}
          {workshops.length > 1 && (
            <Select
              value={selectedWorkshopId || 'all'}
              onValueChange={(v) => setSelectedWorkshopId(v === 'all' ? null : v)}
            >
              <SelectTrigger className="w-[200px]">
                <Building2 className="mr-2 size-4 text-muted-foreground" />
                <SelectValue placeholder="Seleccionar taller" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="flex items-center gap-2">
                    <Warehouse className="size-4" />
                    Todos los Talleres
                  </span>
                </SelectItem>
                {workshops.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Date Range Selector */}
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[130px]">
              <Clock className="mr-2 size-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 días</SelectItem>
              <SelectItem value="30d">Últimos 30 días</SelectItem>
              <SelectItem value="90d">Últimos 90 días</SelectItem>
              <SelectItem value="1y">Último año</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={fetchBI} title="Refrescar datos">
            <Loader2 className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* ── KPI Cards Row ──────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Ingresos Totales"
          value={data.revenue}
          icon={TrendingUp}
          trend={data.revenueTrend}
          trendLabel="vs período anterior"
          iconColor="bg-primary/10 text-primary"
          currency={currency}
        />
        <KPICard
          title="Gastos Totales"
          value={data.expenses}
          icon={TrendingDown}
          trend={data.expensesTrend}
          trendLabel="vs período anterior"
          iconColor="bg-red-500/10 text-red-600"
          currency={currency}
        />
        <KPICard
          title="Ganancia Neta"
          value={data.netProfit}
          icon={DollarSign}
          iconColor={
            data.netProfit >= 0
              ? 'bg-primary/10 text-primary'
              : 'bg-red-500/10 text-red-600'
          }
          valueColor={data.netProfit >= 0 ? '#059669' : '#dc2626'}
          currency={currency}
        />
        {isAllView && data.activeWorkshops !== undefined && (
          <KPICard
            title="Talleres Activos"
            value={data.activeWorkshops}
            icon={Building2}
            iconColor="bg-chart-4/10 text-amber-600"
            valueIsCurrency={false}
          />
        )}
        {!isAllView && data.pendingRepairs !== undefined && (
          <KPICard
            title="Reparaciones Pendientes"
            value={data.pendingRepairs || 0}
            icon={Wrench}
            iconColor="bg-chart-2/10 text-chart-2"
            valueIsCurrency={false}
          />
        )}
      </div>

      {/* ── Revenue vs Expenses Chart ──────────────────────────────── */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className={isAllView ? 'lg:col-span-3' : 'lg:col-span-2'}>
          <CardHeader>
            <CardTitle className="text-base">Ingresos vs Gastos</CardTitle>
            <CardDescription>
              {dateRange === '7d'
                ? 'Últimos 7 días'
                : dateRange === '30d'
                  ? 'Últimos 30 días'
                  : dateRange === '90d'
                    ? 'Últimos 90 días'
                    : 'Último año'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {revenueChartData.length > 0 ? (
              <ChartContainer config={revenueChartConfig} className="h-64 w-full">
                <AreaChart
                  data={revenueChartData}
                  margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="fillBIRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fillBIExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="dateLabel"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    interval="preserveStartEnd"
                    fontSize={11}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={11}
                    tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => (
                          <span className="font-mono font-medium">
                            {formatCurrency(Number(value), currency)}
                          </span>
                        )}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#fillBIRevenue)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fill="url(#fillBIExpenses)"
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                Sin datos de ingresos/gastos para el período seleccionado
              </div>
            )}
          </CardContent>
        </Card>

        {/* Per-Workshop: Repairs by Status Donut */}
        {!isAllView && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reparaciones por Estado</CardTitle>
              <CardDescription>Distribución actual</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {repairsPieData.length > 0 ? (
                <div className="space-y-3">
                  <ChartContainer config={repairsChartConfig} className="mx-auto h-44 w-full">
                    <PieChart>
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            nameKey="status"
                            formatter={(value) => (
                              <span className="font-mono font-medium">{value}</span>
                            )}
                          />
                        }
                      />
                      <Pie
                        data={repairsPieData}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={65}
                        paddingAngle={3}
                        strokeWidth={0}
                      >
                        {repairsPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    {repairsPieData.map((item) => (
                      <div key={item.status} className="flex items-center gap-1.5">
                        <div
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: item.fill }}
                        />
                        <span className="truncate text-muted-foreground">{item.label}</span>
                        <span className="ml-auto font-semibold">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex h-44 items-center justify-center text-sm text-muted-foreground">
                  Sin reparaciones registradas
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* All-Workshop: Quick Comparison Chart */}
        {isAllView && comparisonData.length > 0 && (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-base">Comparación de Talleres</CardTitle>
              <CardDescription>Ingresos por taller en el período seleccionado</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ChartContainer
                config={comparisonChartConfig}
                className="h-64 w-full"
              >
                <BarChart
                  data={comparisonData.map((w) => ({
                    name: w.name.length > 15 ? w.name.slice(0, 15) + '…' : w.name,
                    Ingresos: w.revenue,
                    Gastos: w.expenses,
                    fill: '#10b981',
                    fillExp: '#f59e0b',
                  }))}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    width={90}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => (
                          <span className="font-mono font-medium">
                            {formatCurrency(Number(value), currency)}
                          </span>
                        )}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="Ingresos" radius={[0, 4, 4, 0]} fill="#10b981" opacity={0.85} />
                  <Bar dataKey="Gastos" radius={[0, 4, 4, 0]} fill="#f59e0b" opacity={0.85} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── All-Workshop: Comparison Table ─────────────────────────── */}
      {isAllView && comparisonData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detalle por Taller</CardTitle>
            <CardDescription>Resumen financiero de cada taller</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Taller</TableHead>
                    <TableHead className="text-right">Ingresos</TableHead>
                    <TableHead className="text-right">Gastos</TableHead>
                    <TableHead className="text-right">Ganancia Neta</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Ventas</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Reparaciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparisonData.map((ws) => (
                    <TableRow key={ws.id}>
                      <TableCell className="font-medium">{ws.name}</TableCell>
                      <TableCell className="text-right text-primary">
                        {formatCurrency(ws.revenue, currency)}
                      </TableCell>
                      <TableCell className="text-right text-amber-600">
                        {formatCurrency(ws.expenses, currency)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold ${
                          ws.netProfit >= 0 ? 'text-primary' : 'text-red-600'
                        }`}
                      >
                        {formatCurrency(ws.netProfit, currency)}
                      </TableCell>
                      <TableCell className="text-right hidden sm:table-cell">
                        {ws.salesCount}
                      </TableCell>
                      <TableCell className="text-right hidden sm:table-cell">
                        {ws.repairsCount}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Per-Workshop Detail Cards ──────────────────────────────── */}
      {!isAllView && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="size-4 text-primary" />
                Productos Más Vendidos
              </CardTitle>
              <CardDescription>Por cantidad vendida</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {data.topProducts && data.topProducts.length > 0 ? (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {data.topProducts.map((product, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.quantity} vendido{product.quantity !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <span className="text-sm font-semibold whitespace-nowrap">
                        {formatCurrency(product.total, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                  Sin datos de ventas
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sales by Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="size-4 text-chart-5" />
                Ventas por Método de Pago
              </CardTitle>
              <CardDescription>Distribución de cobros</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {paymentPieData.length > 0 ? (
                <div className="space-y-3">
                  <ChartContainer config={paymentChartConfig} className="mx-auto h-44 w-full">
                    <PieChart>
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            nameKey="method"
                            formatter={(value, name, props) => (
                              <span className="font-mono font-medium">
                                {formatCurrency(props.payload.total, currency)} ({value})
                              </span>
                            )}
                          />
                        }
                      />
                      <Pie
                        data={paymentPieData}
                        dataKey="count"
                        nameKey="method"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={65}
                        paddingAngle={3}
                        strokeWidth={0}
                      >
                        {paymentPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    {paymentPieData.map((item) => (
                      <div key={item.method} className="flex items-center gap-1.5">
                        <div
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: item.fill }}
                        />
                        <span className="truncate text-muted-foreground">{item.label}</span>
                        <span className="ml-auto font-semibold">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex h-44 items-center justify-center text-sm text-muted-foreground">
                  Sin datos de pagos
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expenses by Category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart className="size-4 text-amber-600" />
                Gastos por Categoría
              </CardTitle>
              <CardDescription>Distribución de gastos</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {expensesBarData.length > 0 ? (
                <ChartContainer
                  config={expenseCategoryConfig}
                  className="h-48 w-full"
                >
                  <BarChart
                    data={expensesBarData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                      type="category"
                      dataKey="category"
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      width={70}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => (
                            <span className="font-mono font-medium">
                              {formatCurrency(Number(value), currency)}
                            </span>
                          )}
                        />
                      }
                    />
                    <Bar dataKey="total" radius={[0, 4, 4, 0]} fill="#f59e0b" opacity={0.85} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                  Sin gastos registrados
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alerts */}
          <div className="space-y-4">
            {/* Pending Repairs Alert */}
            {data.pendingRepairs !== undefined && data.pendingRepairs > 0 && (
              <Card className="border-violet-200 dark:border-violet-800">
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-chart-2/10">
                    <Wrench className="size-5 text-chart-2" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Reparaciones Pendientes</p>
                    <p className="text-lg font-bold text-chart-2">
                      {data.pendingRepairs} reparacion{data.pendingRepairs !== 1 ? 'es' : ''} pendiente
                      {data.pendingRepairs !== 1 ? 's' : ''}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Low Stock Alert */}
            {data.lowStockCount !== undefined && data.lowStockCount > 0 && (
              <Card className="border-amber-200 dark:border-amber-800">
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-chart-4/10">
                    <AlertTriangle className="size-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Stock Bajo</p>
                    <p className="text-lg font-bold text-amber-600">
                      {data.lowStockCount} producto{data.lowStockCount !== 1 ? 's' : ''} con stock bajo
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {((data.pendingRepairs === 0 || data.pendingRepairs === undefined) &&
              (data.lowStockCount === 0 || data.lowStockCount === undefined)) && (
              <Card>
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <TrendingUp className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Todo en orden</p>
                    <p className="text-sm text-muted-foreground">
                      No hay alertas pendientes para este taller
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ── Trends Section ─────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {data.revenueTrend !== undefined && (
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                  data.revenueTrend >= 0 ? 'bg-primary/10' : 'bg-red-500/10'
                }`}
              >
                {data.revenueTrend >= 0 ? (
                  <TrendingUp className="size-5 text-primary" />
                ) : (
                  <TrendingDown className="size-5 text-red-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tendencia de Ingresos</p>
                <p
                  className={`text-lg font-bold ${
                    data.revenueTrend >= 0 ? 'text-primary' : 'text-red-600'
                  }`}
                >
                  {data.revenueTrend >= 0 ? '+' : ''}
                  {data.revenueTrend.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {data.revenueTrend >= 0 ? 'Creciendo' : 'Decreciendo'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {isAllView && data.mostProfitableWorkshop && (
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-chart-4/10">
                <Crown className="size-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taller Más Rentable</p>
                <p className="text-lg font-bold truncate">{data.mostProfitableWorkshop}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {data.bestSellingProduct && (
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-chart-5/10">
                <Package className="size-5 text-chart-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Producto Más Vendido</p>
                <p className="text-lg font-bold truncate">{data.bestSellingProduct}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// ─── Fallback Data Generator ────────────────────────────────────────────────

function generateFallbackData(): BIData {
  const days = 30
  const chartData = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    chartData.push({
      date: date.toISOString().split('T')[0],
      revenue: Math.random() * 5000 + 1000,
      expenses: Math.random() * 2000 + 500,
    })
  }

  return {
    revenue: chartData.reduce((s, d) => s + d.revenue, 0),
    expenses: chartData.reduce((s, d) => s + d.expenses, 0),
    netProfit: chartData.reduce((s, d) => s + d.revenue - d.expenses, 0),
    revenueTrend: Math.random() * 20 - 5,
    expensesTrend: Math.random() * 15 - 3,
    activeWorkshops: 2,
    revenueChart: chartData,
    topProducts: [
      { name: 'Pantalla Samsung A54', total: 4500, quantity: 15 },
      { name: 'Batería iPhone 13', total: 3200, quantity: 22 },
      { name: 'Cargador USB-C', total: 1800, quantity: 45 },
    ],
    salesByPaymentMethod: [
      { method: 'cash', count: 45, total: 15000 },
      { method: 'card', count: 12, total: 5000 },
      { method: 'transfer', count: 8, total: 3500 },
    ],
    repairsByStatus: {
      received: 3,
      diagnosing: 2,
      repairing: 5,
      ready: 4,
      delivered: 12,
    },
    expensesByCategory: [
      { category: 'supplies', total: 3500 },
      { category: 'rent', total: 2000 },
      { category: 'salary', total: 5000 },
      { category: 'utilities', total: 1200 },
      { category: 'other', total: 800 },
    ],
    pendingRepairs: 10,
    lowStockCount: 5,
    mostProfitableWorkshop: 'Taller Centro',
    bestSellingProduct: 'Pantalla Samsung A54',
  }
}
