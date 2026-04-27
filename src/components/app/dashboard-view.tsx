'use client'

import React, { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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
  Wrench,
  AlertTriangle,
  Users,
  ShoppingCart,
  Package,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CreditCard,
  TrendingUp,
  Phone,
} from 'lucide-react'
import { offlineFetch } from '@/lib/offline-fetch'

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashboardData {
  salesToday: { total: number; count: number }
  salesYesterday: { total: number }
  salesWeek: { total: number; count: number }
  salesMonth: { total: number; count: number }
  repairsByStatus: Record<string, number>
  lowStockCount: number
  topProducts: { name: string; total: number; quantity: number }[]
  revenueChart: { date: string; revenue: number; expenses: number }[]
  expensesByCategory: { category: string; total: number }[]
  totalCustomers: number
  totalProducts: number
  pendingRepairs: number
  completedRepairsToday: number
  recentSales: {
    id: string
    code: string
    total: number
    paymentMethod: string
    createdAt: string
    customer: { name: string } | null
  }[]
  recentRepairs: {
    id: string
    code: string
    device: string
    status: string
    totalCost: number
    createdAt: string
    customer: { name: string } | null
  }[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-BO', { day: '2-digit', month: 'short' })
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Chart Configs ───────────────────────────────────────────────────────────

const revenueChartConfig: ChartConfig = {
  revenue: {
    label: 'Ingresos',
    color: '#10b981',
  },
  expenses: {
    label: 'Gastos',
    color: '#f59e0b',
  },
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

const repairsChartConfig: ChartConfig = Object.fromEntries(
  Object.entries(statusLabels).map(([key, label]) => [
    key,
    { label, color: statusColors[key] },
  ])
)

const categoryLabels: Record<string, string> = {
  supplies: 'Insumos',
  rent: 'Alquiler',
  salary: 'Salarios',
  utilities: 'Servicios',
  other: 'Otros',
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  iconColor = 'bg-primary/10 text-primary',
  valueIsCurrency = true,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  trend?: number
  trendLabel?: string
  iconColor?: string
  valueIsCurrency?: boolean
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
        <div className="text-2xl font-bold tracking-tight">{valueIsCurrency ? formatCurrency(Number(value)) : value}</div>
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
        {subtitle && (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Stats skeleton */}
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
      {/* Chart skeleton */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
      {/* Bottom skeleton */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const setCurrentView = useAppStore((s) => s.setCurrentView)

  useEffect(() => {
    offlineFetch('/api/dashboard')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return <DashboardSkeleton />
  }

  // Calculate sales trend vs yesterday
  const salesTrend =
    data.salesYesterday.total > 0
      ? ((data.salesToday.total - data.salesYesterday.total) / data.salesYesterday.total) * 100
      : data.salesToday.total > 0
        ? 100
        : 0

  // Build repairs pie data
  const repairsPieData = Object.entries(data.repairsByStatus || {})
    .filter(([, value]) => value > 0)
    .map(([status, count]) => ({
      status,
      label: statusLabels[status] || status,
      count,
      fill: statusColors[status] || '#6b7280',
    }))

  // Build revenue chart data with formatted dates
  const revenueChartData = (data.revenueChart || []).map((item) => ({
    ...item,
    dateLabel: formatDate(item.date),
  }))

  // Quick actions
  const quickActions = [
    {
      label: 'Nueva Venta',
      icon: ShoppingCart,
      view: 'pos' as const,
      color: 'bg-primary/10 text-primary hover:bg-primary/20',
    },
    {
      label: 'Nueva Reparación',
      icon: Wrench,
      view: 'repairs' as const,
      color: 'bg-chart-2/10 text-chart-2 hover:bg-chart-2/20',
    },
    {
      label: 'Agregar Producto',
      icon: Plus,
      view: 'products' as const,
      color: 'bg-chart-4/10 text-chart-4 hover:bg-chart-4/20',
    },
    {
      label: 'Ver Clientes',
      icon: Users,
      view: 'customers' as const,
      color: 'bg-chart-5/10 text-chart-5 hover:bg-chart-5/20',
    },
  ]

  // Repair status badge color
  function getStatusBadge(status: string) {
    const colors: Record<string, string> = {
      received: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      diagnosing: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      waiting_parts: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      repairing: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      ready: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      cancelled: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* ── Top Stats ─────────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Ventas Hoy"
          value={data.salesToday.total}
          subtitle={`${data.salesToday.count} venta${data.salesToday.count !== 1 ? 's' : ''} realizada${data.salesToday.count !== 1 ? 's' : ''}`}
          icon={DollarSign}
          trend={salesTrend}
          trendLabel="vs ayer"
          iconColor="bg-primary/10 text-primary"
        />
        <StatCard
          title="Reparaciones Pendientes"
          value={data.pendingRepairs}
          icon={Wrench}
          subtitle={`${data.completedRepairsToday} completada${data.completedRepairsToday !== 1 ? 's' : ''} hoy`}
          iconColor="bg-chart-2/10 text-chart-2"
          valueIsCurrency={false}
        />
        <StatCard
          title="Stock Bajo"
          value={data.lowStockCount}
          icon={AlertTriangle}
          subtitle={`${data.totalProducts} productos activos`}
          iconColor="bg-chart-4/10 text-chart-4"
          valueIsCurrency={false}
        />
        <StatCard
          title="Clientes Totales"
          value={data.totalCustomers}
          icon={Users}
          subtitle={`${data.salesWeek.count} venta${data.salesWeek.count !== 1 ? 's' : ''} esta semana`}
          iconColor="bg-chart-5/10 text-chart-5"
          valueIsCurrency={false}
        />
      </div>

      {/* ── Charts Row ────────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Ingresos vs Gastos</CardTitle>
            <CardDescription>Últimos 30 días</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ChartContainer config={revenueChartConfig} className="h-64 w-full">
              <AreaChart data={revenueChartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1">
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
                      formatter={(value, name) => (
                        <span className="font-mono font-medium">
                          {formatCurrency(Number(value))}
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
                  fill="url(#fillRevenue)"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="url(#fillExpenses)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Repairs by Status - Donut Chart */}
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
                      <span className="truncate text-muted-foreground">
                        {item.label}
                      </span>
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
      </div>

      {/* ── Bottom Row ────────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Productos Más Vendidos</CardTitle>
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
                      {formatCurrency(product.total)}
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

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Acciones Rápidas</CardTitle>
            <CardDescription>Acceso directo</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Button
                  key={action.view}
                  variant="outline"
                  className="h-auto flex-col gap-2 py-4"
                  onClick={() => setCurrentView(action.view)}
                >
                  <div className={`flex size-10 items-center justify-center rounded-lg ${action.color}`}>
                    <action.icon className="size-5" />
                  </div>
                  <span className="text-xs font-medium">{action.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actividad Reciente</CardTitle>
            <CardDescription>Últimos movimientos</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {/* Recent Sales */}
              {data.recentSales && data.recentSales.length > 0 && (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Ventas
                  </p>
                  {data.recentSales.slice(0, 3).map((sale) => (
                    <div key={sale.id} className="flex items-start gap-3">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <CreditCard className="size-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">
                          {sale.customer?.name || 'Cliente general'}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span>{sale.code}</span>
                          <span>·</span>
                          <Clock className="size-3" />
                          <span>{formatDateTime(sale.createdAt)}</span>
                        </div>
                      </div>
                      <span className="text-sm font-semibold whitespace-nowrap text-primary">
                        +{formatCurrency(sale.total)}
                      </span>
                    </div>
                  ))}
                </>
              )}
              {/* Recent Repairs */}
              {data.recentRepairs && data.recentRepairs.length > 0 && (
                <>
                  <div className="my-2 border-t" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Reparaciones
                  </p>
                  {data.recentRepairs.slice(0, 3).map((repair) => (
                    <div key={repair.id} className="flex items-start gap-3">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-chart-2/10">
                        <Phone className="size-3.5 text-chart-2" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">
                          {repair.customer?.name || 'Cliente'}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span>{repair.device}</span>
                          <span>·</span>
                          <Clock className="size-3" />
                          <span>{formatDateTime(repair.createdAt)}</span>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] px-1.5 py-0 ${getStatusBadge(repair.status)}`}
                      >
                        {statusLabels[repair.status] || repair.status}
                      </Badge>
                    </div>
                  ))}
                </>
              )}
              {(!data.recentSales || data.recentSales.length === 0) &&
                (!data.recentRepairs || data.recentRepairs.length === 0) && (
                  <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                    Sin actividad reciente
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Expenses by Category Row ──────────────────────────────── */}
      {data.expensesByCategory && data.expensesByCategory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gastos del Mes por Categoría</CardTitle>
            <CardDescription>Distribución de gastos</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ChartContainer
              config={Object.fromEntries(
                data.expensesByCategory.map((item) => [
                  item.category,
                  { label: categoryLabels[item.category] || item.category, color: '#f59e0b' },
                ])
              )}
              className="h-48 w-full"
            >
              <BarChart
                data={data.expensesByCategory.map((item) => ({
                  category: categoryLabels[item.category] || item.category,
                  total: item.total,
                  fill: '#f59e0b',
                }))}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="category" tickLine={false} axisLine={false} fontSize={12} width={70} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => (
                        <span className="font-mono font-medium">{formatCurrency(Number(value))}</span>
                      )}
                    />
                  }
                />
                <Bar dataKey="total" radius={[0, 4, 4, 0]} fill="#f59e0b" opacity={0.85} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* ── Summary Cards Row ─────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ventas del Mes</p>
              <p className="text-lg font-bold">{formatCurrency(data.salesMonth.total)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-chart-2/10">
              <Package className="size-5 text-chart-2" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Productos en Inventario</p>
              <p className="text-lg font-bold">{data.totalProducts}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-chart-4/10">
              <DollarSign className="size-5 text-chart-4" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gastos del Mes</p>
              <p className="text-lg font-bold">
                {formatCurrency(data.expensesByCategory?.reduce((sum, e) => sum + e.total, 0) || 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
