'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FileText,
  Search,
  Filter,
  Download,
  RefreshCw,
  Activity,
  Shield,
  Clock,
  User,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { offlineFetch } from '@/lib/offline-fetch'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuditEntry {
  id: string
  userId: string
  userName: string
  action: string
  entity: string
  entityId: string | null
  details: string | null
  ip: string | null
  createdAt: string
}

interface AuditStats {
  totalLogs: number
  todayLogs: number
  byEntity: { entity: string; count: number }[]
  byAction: { action: string; count: number }[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const actionLabels: Record<string, string> = {
  CREATE: 'Creación',
  UPDATE: 'Actualización',
  DELETE: 'Eliminación',
  LOGIN: 'Inicio Sesión',
  LOGOUT: 'Cierre Sesión',
  REGISTER: 'Registro',
  STATUS_CHANGE: 'Cambio Estado',
  STOCK_ADJUSTMENT: 'Ajuste Stock',
  BACKUP: 'Backup',
  RESTORE: 'Restauración',
  EXPORT: 'Exportación',
  CANCEL: 'Cancelación',
}

const actionColors: Record<string, string> = {
  CREATE: 'bg-primary/10 text-primary',
  UPDATE: 'bg-info/10 text-info',
  DELETE: 'bg-destructive/10 text-destructive',
  LOGIN: 'bg-info/10 text-info',
  LOGOUT: 'bg-muted text-muted-foreground',
  REGISTER: 'bg-chart-2/10 text-chart-2',
  STATUS_CHANGE: 'bg-warning/10 text-warning',
  STOCK_ADJUSTMENT: 'bg-chart-3/10 text-chart-3',
  BACKUP: 'bg-success/10 text-success',
  RESTORE: 'bg-chart-4/10 text-chart-4',
  EXPORT: 'bg-info/10 text-info',
  CANCEL: 'bg-destructive/10 text-destructive',
}

const entityLabels: Record<string, string> = {
  user: 'Usuario',
  product: 'Producto',
  sale: 'Venta',
  repair: 'Reparación',
  customer: 'Cliente',
  expense: 'Gasto',
  category: 'Categoría',
  supplier: 'Proveedor',
  setting: 'Configuración',
  backup: 'Backup',
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function AuditView() {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<AuditStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const pageSize = 25

  // Filters
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [entityFilter, setEntityFilter] = useState('all')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        skip: (page * pageSize).toString(),
        take: pageSize.toString(),
      })
      if (search) params.set('search', search)
      if (actionFilter !== 'all') params.set('action', actionFilter)
      if (entityFilter !== 'all') params.set('entity', entityFilter)

      const res = await offlineFetch(`/api/audit?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.data || [])
        setTotal(data.total || 0)
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }, [page, search, actionFilter, entityFilter])

  const fetchStats = useCallback(async () => {
    try {
      const res = await offlineFetch('/api/audit/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching audit stats:', error)
    }
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const totalPages = Math.ceil(total / pageSize)

  const handleExport = async (format: string) => {
    try {
      const params = new URLSearchParams({
        format,
        entity: 'stock', // Use stock endpoint as general export
      })
      window.open(`/api/export?${params}`, '_blank')
    } catch (error) {
      console.error('Export error:', error)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Activity className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Registros</p>
              <p className="text-lg font-bold">{stats?.totalLogs || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-chart-5/10">
              <Clock className="size-5 text-chart-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Registros Hoy</p>
              <p className="text-lg font-bold">{stats?.todayLogs || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-chart-2/10">
              <Shield className="size-5 text-chart-2" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Acciones Diferentes</p>
              <p className="text-lg font-bold">{stats?.byAction?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Registro de Auditoría</CardTitle>
              <CardDescription>Historial completo de acciones realizadas en el sistema</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => { fetchLogs(); fetchStats() }}>
                <RefreshCw className="mr-1.5 size-3.5" />
                Actualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter controls */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar en registros..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0) }}
                className="pl-9"
              />
            </div>
            <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(0) }}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Acción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las acciones</SelectItem>
                {Object.entries(actionLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setPage(0) }}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Entidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las entidades</SelectItem>
                {Object.entries(entityLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 flex-1" />
                  <Skeleton className="h-5 w-32" />
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="size-12 mb-3 opacity-50" />
              <p className="text-sm">No hay registros de auditoría</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32">Fecha/Hora</TableHead>
                      <TableHead className="w-28">Usuario</TableHead>
                      <TableHead className="w-32">Acción</TableHead>
                      <TableHead className="w-28">Entidad</TableHead>
                      <TableHead>Detalles</TableHead>
                      <TableHead className="w-28">IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {formatDateTime(log.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <User className="size-3 text-muted-foreground" />
                            <span className="text-xs font-medium">{log.userName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] px-1.5 py-0 ${actionColors[log.action] || 'bg-muted text-muted-foreground'}`}
                          >
                            {actionLabels[log.action] || log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs">{entityLabels[log.entity] || log.entity}</span>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="text-xs text-muted-foreground truncate">
                            {log.details || '-'}
                          </p>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {log.ip || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {logs.map((log) => (
                  <Card key={log.id} className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={`text-[10px] px-1.5 py-0 ${actionColors[log.action] || ''}`}
                          >
                            {actionLabels[log.action] || log.action}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {entityLabels[log.entity] || log.entity}
                          </span>
                        </div>
                        <p className="text-xs font-medium">{log.userName}</p>
                        {log.details && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{log.details}</p>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-muted-foreground">
                  Mostrando {page * pageSize + 1}-{Math.min((page + 1) * pageSize, total)} de {total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {page + 1} / {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
