'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from 'recharts'
import {
  BarChart3,
  TrendingUp,
  Wrench,
  Package,
  DollarSign,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { offlineFetch } from '@/lib/offline-fetch'

const COLORS = [
  'oklch(0.508 0.164 160)',
  'oklch(0.6 0.118 184.704)',
  'oklch(0.828 0.189 84.429)',
  'oklch(0.627 0.265 303.9)',
  'oklch(0.769 0.188 70.08)',
  'oklch(0.65 0.2 30)',
  'oklch(0.55 0.15 260)',
  'oklch(0.7 0.15 140)',
]

const PIE_COLORS = [
  'oklch(0.508 0.164 160)',
  'oklch(0.6 0.118 184.704)',
  'oklch(0.828 0.189 84.429)',
  'oklch(0.627 0.265 303.9)',
  'oklch(0.769 0.188 70.08)',
  'oklch(0.65 0.2 30)',
]

const paymentLabels: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  mixto: 'Mixto',
}

const statusLabels: Record<string, string> = {
  received: 'Recibido',
  diagnosing: 'Diagnosticando',
  waiting_parts: 'Esperando repuestos',
  repairing: 'Reparando',
  ready: 'Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  completed: 'Completado',
}

export function ReportsView() {
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<Record<string, unknown> | null>(null)
  const [salesData, setSalesData] = useState<Array<Record<string, unknown>>>([])
  const [repairsData, setRepairsData] = useState<Array<Record<string, unknown>>>([])
  const [productsData, setProductsData] = useState<Array<Record<string, unknown>>>([])
  const [expensesData, setExpensesData] = useState<Array<Record<string, unknown>>>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [dashRes, salesRes, repairsRes, productsRes, expensesRes] = await Promise.all([
        offlineFetch('/api/dashboard'),
        offlineFetch('/api/sales?limit=100'),
        offlineFetch('/api/repairs?limit=100'),
        offlineFetch('/api/products?limit=100'),
        offlineFetch('/api/expenses?limit=100'),
      ])

      if (dashRes.ok) setDashboardData(await dashRes.json())
      if (salesRes.ok) {
        const sd = await salesRes.json()
        setSalesData(sd.data || [])
      }
      if (repairsRes.ok) {
        const rd = await repairsRes.json()
        setRepairsData(rd.data || [])
      }
      if (productsRes.ok) {
        const pd = await productsRes.json()
        setProductsData(pd.data || [])
      }
      if (expensesRes.ok) {
        const ed = await expensesRes.json()
        setExpensesData(ed.data || [])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
  }

  // ===== SALES TAB DATA =====
  const revenueChartData = (dashboardData?.revenueChartData as Array<{ date: string; revenue: number }>) || []

  const salesByPayment = salesData.reduce((acc: Array<{ method: string; total: number; count: number }>, sale: Record<string, unknown>) => {
    const method = String(sale.paymentMethod || 'efectivo')
    const existing = acc.find(a => a.method === method)
    if (existing) {
      existing.total += Number(sale.total || 0)
      existing.count += 1
    } else {
      acc.push({ method, total: Number(sale.total || 0), count: 1 })
    }
    return acc
  }, [])

  const salesByPaymentChart = salesByPayment.map(s => ({
    name: paymentLabels[s.method] || s.method,
    value: s.total,
    count: s.count,
  }))

  const topProducts = (dashboardData?.topSellingProducts as Array<{ name: string; totalQuantity: number; totalRevenue: number }>) || []

  const salesTotal = salesData.reduce((sum: number, s: Record<string, unknown>) => sum + Number(s.total || 0), 0)
  const salesCount = salesData.length

  // ===== REPAIRS TAB DATA =====
  const repairsByStatus = repairsData.reduce((acc: Array<{ status: string; count: number }>, repair: Record<string, unknown>) => {
    const status = String(repair.status || 'received')
    const existing = acc.find(a => a.status === status)
    if (existing) {
      existing.count += 1
    } else {
      acc.push({ status, count: 1 })
    }
    return acc
  }, [])

  const repairsByStatusChart = repairsByStatus.map(s => ({
    name: statusLabels[s.status] || s.status,
    value: s.count,
  }))

  const repairsByBrand = repairsData.reduce((acc: Array<{ brand: string; count: number }>, repair: Record<string, unknown>) => {
    const brand = String(repair.brand || 'Sin marca')
    const existing = acc.find(a => a.brand === brand)
    if (existing) {
      existing.count += 1
    } else {
      acc.push({ brand, count: 1 })
    }
    return acc
  }, [])

  const repairsByBrandChart = repairsByBrand.map(b => ({
    marca: b.brand,
    cantidad: b.count,
  }))

  // Average repair time (delivered repairs)
  const deliveredRepairs = repairsData.filter((r: Record<string, unknown>) => r.status === 'delivered' && r.completedAt && r.receivedAt)
  let avgRepairDays = 0
  if (deliveredRepairs.length > 0) {
    const totalDays = deliveredRepairs.reduce((sum: number, r: Record<string, unknown>) => {
      const received = new Date(String(r.receivedAt)).getTime()
      const completed = new Date(String(r.completedAt)).getTime()
      return sum + (completed - received) / (1000 * 60 * 60 * 24)
    }, 0)
    avgRepairDays = totalDays / deliveredRepairs.length
  }

  const repairsLaborTotal = repairsData.reduce((sum: number, r: Record<string, unknown>) => sum + Number(r.laborCost || 0), 0)
  const repairsPartsTotal = repairsData.reduce((sum: number, r: Record<string, unknown>) => sum + Number(r.partsCost || 0), 0)

  // ===== INVENTORY TAB DATA =====
  const stockValue = productsData.reduce((sum: number, p: Record<string, unknown>) => sum + Number(p.costPrice || 0) * Number(p.quantity || 0), 0)
  const retailValue = productsData.reduce((sum: number, p: Record<string, unknown>) => sum + Number(p.salePrice || 0) * Number(p.quantity || 0), 0)

  const lowStockProducts = productsData.filter(
    (p: Record<string, unknown>) => Number(p.quantity || 0) <= Number(p.minStock || 5) && p.active !== false
  )

  const productsByCategory = productsData.reduce((acc: Array<{ category: string; count: number; value: number }>, p: Record<string, unknown>) => {
    const cat = p.category && typeof p.category === 'object' && p.category !== null ? String((p.category as Record<string, unknown>).name || 'Sin categoría') : 'Sin categoría'
    const existing = acc.find(a => a.category === cat)
    if (existing) {
      existing.count += 1
      existing.value += Number(p.salePrice || 0) * Number(p.quantity || 0)
    } else {
      acc.push({ category: cat, count: 1, value: Number(p.salePrice || 0) * Number(p.quantity || 0) })
    }
    return acc
  }, [])

  const productsByCategoryChart = productsByCategory.map(c => ({
    name: c.category,
    value: c.count,
  }))

  // ===== FINANCE TAB DATA =====
  const totalIncome = salesTotal
  const totalExpensesAmount = expensesData.reduce((sum: number, e: Record<string, unknown>) => sum + Number(e.amount || 0), 0)
  const profit = totalIncome - totalExpensesAmount
  const profitMargin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0

  // Income vs Expenses by date
  const incomeByDate: Record<string, number> = {}
  salesData.forEach((s: Record<string, unknown>) => {
    if (s.status === 'completed' || s.status !== 'cancelled') {
      const date = String(s.createdAt || '').split('T')[0]
      incomeByDate[date] = (incomeByDate[date] || 0) + Number(s.total || 0)
    }
  })

  const expensesByDate: Record<string, number> = {}
  expensesData.forEach((e: Record<string, unknown>) => {
    const date = String(e.date || '').split('T')[0]
    expensesByDate[date] = (expensesByDate[date] || 0) + Number(e.amount || 0)
  })

  const allDates = [...new Set([...Object.keys(incomeByDate), ...Object.keys(expensesByDate)])].sort()
  const incomeExpenseChart = allDates.map(date => ({
    fecha: formatDate(date),
    ingresos: incomeByDate[date] || 0,
    gastos: expensesByDate[date] || 0,
  }))

  const expensesByCategoryFinance = expensesData.reduce((acc: Array<{ category: string; total: number }>, e: Record<string, unknown>) => {
    const cat = String(e.category || 'other')
    const existing = acc.find(a => a.category === cat)
    if (existing) {
      existing.total += Number(e.amount || 0)
    } else {
      acc.push({ category: cat, total: Number(e.amount || 0) })
    }
    return acc
  }, [])

  const categoryLabelsFinance: Record<string, string> = {
    supplies: 'Insumos',
    rent: 'Alquiler',
    salary: 'Salario',
    utilities: 'Servicios',
    other: 'Otro',
  }

  const expensesByCategoryChart = expensesByCategoryFinance.map(c => ({
    name: categoryLabelsFinance[c.category] || c.category,
    value: c.total,
  }))

  // Chart configs
  const revenueConfig = {
    revenue: { label: 'Ingresos', color: 'oklch(0.508 0.164 160)' },
  }

  const salesPaymentConfig = {
    value: { label: 'Total' },
    efectivo: { label: 'Efectivo', color: 'oklch(0.508 0.164 160)' },
    transferencia: { label: 'Transferencia', color: 'oklch(0.6 0.118 184.704)' },
    mixto: { label: 'Mixto', color: 'oklch(0.828 0.189 84.429)' },
  }

  const topProductsConfig = {
    totalRevenue: { label: 'Ingresos', color: 'oklch(0.508 0.164 160)' },
    totalQuantity: { label: 'Cantidad', color: 'oklch(0.6 0.118 184.704)' },
  }

  const repairsStatusConfig = {
    value: { label: 'Cantidad' },
  }

  const repairsBrandConfig = {
    cantidad: { label: 'Cantidad', color: 'oklch(0.508 0.164 160)' },
  }

  const categoryPieConfig = {
    value: { label: 'Productos' },
  }

  const incomeExpenseConfig = {
    ingresos: { label: 'Ingresos', color: 'oklch(0.508 0.164 160)' },
    gastos: { label: 'Gastos', color: 'oklch(0.577 0.245 27.325)' },
  }

  const expensesCategoryConfig = {
    value: { label: 'Total' },
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando reportes...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Reportes y Analíticas</h2>
      </div>

      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales">Ventas</TabsTrigger>
          <TabsTrigger value="repairs">Reparaciones</TabsTrigger>
          <TabsTrigger value="inventory">Inventario</TabsTrigger>
          <TabsTrigger value="finance">Finanzas</TabsTrigger>
        </TabsList>

        {/* ===== SALES TAB ===== */}
        <TabsContent value="sales" className="space-y-4">
          {/* Revenue Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Ingresos - Últimos 30 días</CardTitle>
              <CardDescription>Evolución de ventas diarias</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={revenueConfig} className="h-[280px] w-full">
                <AreaChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDate} />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="oklch(0.508 0.164 160)"
                    fill="oklch(0.508 0.164 160)"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Sales by Payment Method */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Ventas por Método de Pago</CardTitle>
              </CardHeader>
              <CardContent>
                {salesByPaymentChart.length > 0 ? (
                  <ChartContainer config={salesPaymentConfig} className="h-[250px] w-full">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Pie
                        data={salesByPaymentChart}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {salesByPaymentChart.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
                )}
              </CardContent>
            </Card>

            {/* Top Selling Products */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Productos Más Vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                {topProducts.length > 0 ? (
                  <ChartContainer config={topProductsConfig} className="h-[250px] w-full">
                    <BarChart data={topProducts.slice(0, 6)} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="totalRevenue" fill="oklch(0.508 0.164 160)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sales Summary Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Resumen de Ventas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-sm text-muted-foreground">Total Ventas</p>
                  <p className="text-xl font-bold">{salesCount}</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-sm text-muted-foreground">Ingresos</p>
                  <p className="text-xl font-bold">{formatCurrency(salesTotal)}</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-sm text-muted-foreground">Ticket Promedio</p>
                  <p className="text-xl font-bold">{formatCurrency(salesCount > 0 ? salesTotal / salesCount : 0)}</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-sm text-muted-foreground">Hoy</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(Number(dashboardData?.salesToday?.total || 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== REPAIRS TAB ===== */}
        <TabsContent value="repairs" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Repairs by Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Reparaciones por Estado</CardTitle>
              </CardHeader>
              <CardContent>
                {repairsByStatusChart.length > 0 ? (
                  <ChartContainer config={repairsStatusConfig} className="h-[250px] w-full">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Pie
                        data={repairsByStatusChart}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {repairsByStatusChart.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
                )}
              </CardContent>
            </Card>

            {/* Repairs by Brand */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Reparaciones por Marca</CardTitle>
              </CardHeader>
              <CardContent>
                {repairsByBrandChart.length > 0 ? (
                  <ChartContainer config={repairsBrandConfig} className="h-[250px] w-full">
                    <BarChart data={repairsByBrandChart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="marca" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="cantidad" fill="oklch(0.508 0.164 160)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Repair Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Wrench className="mx-auto h-6 w-6 text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{repairsData.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="mx-auto h-6 w-6 text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Prom. Días Rep.</p>
                <p className="text-2xl font-bold">{avgRepairDays.toFixed(1)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <DollarSign className="mx-auto h-6 w-6 text-warning mb-2" />
                <p className="text-sm text-muted-foreground">Mano de Obra</p>
                <p className="text-xl font-bold">{formatCurrency(repairsLaborTotal)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Package className="mx-auto h-6 w-6 text-info mb-2" />
                <p className="text-sm text-muted-foreground">Repuestos</p>
                <p className="text-xl font-bold">{formatCurrency(repairsPartsTotal)}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ===== INVENTORY TAB ===== */}
        <TabsContent value="inventory" className="space-y-4">
          {/* Stock Value Summary */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor al Costo</p>
                    <p className="text-2xl font-bold">{formatCurrency(stockValue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor de Venta</p>
                    <p className="text-2xl font-bold">{formatCurrency(retailValue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Products by Category */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Productos por Categoría</CardTitle>
              </CardHeader>
              <CardContent>
                {productsByCategoryChart.length > 0 ? (
                  <ChartContainer config={categoryPieConfig} className="h-[250px] w-full">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Pie
                        data={productsByCategoryChart}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {productsByCategoryChart.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
                )}
              </CardContent>
            </Card>

            {/* Low Stock Alert */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Productos con Stock Bajo
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lowStockProducts.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {lowStockProducts.map((p: Record<string, unknown>) => (
                      <div key={String(p.id)} className="flex items-center justify-between rounded-lg border p-2">
                        <div>
                          <p className="text-sm font-medium">{String(p.name)}</p>
                          {p.sku && <p className="text-xs text-muted-foreground">{String(p.sku)}</p>}
                        </div>
                        <div className="text-right">
                          <Badge variant={Number(p.quantity || 0) === 0 ? 'destructive' : 'secondary'}>
                            {Number(p.quantity || 0)} / {Number(p.minStock || 5)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No hay productos con stock bajo</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Stock Value Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Resumen de Inventario por Categoría</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoría</TableHead>
                      <TableHead className="text-center">Productos</TableHead>
                      <TableHead className="text-right">Valor de Venta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productsByCategory.map((cat) => (
                      <TableRow key={cat.category}>
                        <TableCell className="font-medium">{cat.category}</TableCell>
                        <TableCell className="text-center">{cat.count}</TableCell>
                        <TableCell className="text-right">{formatCurrency(cat.value)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-center">{productsData.length}</TableCell>
                      <TableCell className="text-right">{formatCurrency(retailValue)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== FINANCE TAB ===== */}
        <TabsContent value="finance" className="space-y-4">
          {/* Income vs Expenses Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="mx-auto h-6 w-6 text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Ingresos</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(totalIncome)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="mx-auto h-6 w-6 text-destructive mb-2 rotate-180" />
                <p className="text-sm text-muted-foreground">Gastos</p>
                <p className="text-xl font-bold text-destructive">{formatCurrency(totalExpensesAmount)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <DollarSign className="mx-auto h-6 w-6 text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Ganancia</p>
                <p className={`text-xl font-bold ${profit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {formatCurrency(profit)}
                </p>
                <p className="text-xs text-muted-foreground">Margen: {profitMargin.toFixed(1)}%</p>
              </CardContent>
            </Card>
          </div>

          {/* Income vs Expenses Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Ingresos vs Gastos</CardTitle>
              <CardDescription>Comparación por fecha</CardDescription>
            </CardHeader>
            <CardContent>
              {incomeExpenseChart.length > 0 ? (
                <ChartContainer config={incomeExpenseConfig} className="h-[300px] w-full">
                  <LineChart data={incomeExpenseChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fecha" />
                    <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line type="monotone" dataKey="ingresos" stroke="oklch(0.508 0.164 160)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="gastos" stroke="oklch(0.577 0.245 27.325)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Sin datos suficientes</p>
              )}
            </CardContent>
          </Card>

          {/* Expense Breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Desglose de Gastos por Categoría</CardTitle>
            </CardHeader>
            <CardContent>
              {expensesByCategoryChart.length > 0 ? (
                <ChartContainer config={expensesCategoryConfig} className="h-[250px] w-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={expensesByCategoryChart}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {expensesByCategoryChart.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Sin datos de gastos</p>
              )}
            </CardContent>
          </Card>

          {/* Expense Detail Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Detalle de Gastos por Categoría</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoría</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">% del Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expensesByCategoryFinance.map((cat) => (
                      <TableRow key={cat.category}>
                        <TableCell className="font-medium">
                          {categoryLabelsFinance[cat.category] || cat.category}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(cat.total)}</TableCell>
                        <TableCell className="text-right">
                          {totalExpensesAmount > 0 ? ((cat.total / totalExpensesAmount) * 100).toFixed(1) : '0'}%
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">{formatCurrency(totalExpensesAmount)}</TableCell>
                      <TableCell className="text-right">100%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
