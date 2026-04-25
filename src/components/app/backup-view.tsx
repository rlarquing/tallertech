'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Database,
  Download,
  Upload,
  HardDrive,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Trash2,
  FileJson,
  FileArchive,
  Clock,
  Shield,
  RefreshCw,
  Plus,
  History,
  Info,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { offlineFetch } from '@/lib/offline-fetch'

// ─── Types ──────────────────────────────────────────────────────

interface DbStats {
  fileSize: number
  tables: { name: string; count: number }[]
  lastBackup: string | null
}

interface BackupRecord {
  id: string
  filename: string
  format: 'json' | 'sqlite'
  description: string
  size: number
  checksum: string
  stats: Record<string, number>
  createdAt: string
}

// ─── Helpers ────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Justo ahora'
  if (mins < 60) return `Hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(hours / 24)
  return `Hace ${days}d`
}

// ─── Component ──────────────────────────────────────────────────

export function BackupView() {
  const { toast } = useToast()

  // State
  const [dbStats, setDbStats] = useState<DbStats | null>(null)
  const [backups, setBackups] = useState<BackupRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [restoring, setRestoring] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Create backup form
  const [backupFormat, setBackupFormat] = useState<'json' | 'sqlite'>('json')
  const [backupDescription, setBackupDescription] = useState('')

  // Restore
  const [restoreOpen, setRestoreOpen] = useState(false)
  const [restoreFile, setRestoreFile] = useState<File | null>(null)
  const [restoreValidation, setRestoreValidation] = useState<{ valid: boolean; errors: string[]; stats?: Record<string, number> } | null>(null)
  const [validating, setValidating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Delete confirmation
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<BackupRecord | null>(null)

  // ─── Fetch Data ────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await offlineFetch('/api/backup/stats')
      if (res.ok) {
        const data = await res.json()
        setDbStats(data)
        setBackups(data.backups || [])
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

  // ─── Create Backup ─────────────────────────────────────────

  const handleCreateBackup = async () => {
    setCreating(true)
    try {
      const res = await offlineFetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: backupFormat,
          description: backupDescription || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Error al crear backup')
      }

      toast({
        title: 'Backup creado',
        description: `${data.message} — ${data.filename || 'archivo generado'}`,
      })

      setBackupDescription('')
      fetchData() // Refresh list
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al crear backup',
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }

  // ─── Download Backup ──────────────────────────────────────

  const handleDownloadBackup = async (backup: BackupRecord) => {
    setDownloading(backup.filename)
    try {
      const res = await offlineFetch(`/api/backup?filename=${encodeURIComponent(backup.filename)}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al descargar')
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = backup.filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast({ title: 'Backup descargado', description: backup.filename })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al descargar',
        variant: 'destructive',
      })
    } finally {
      setDownloading(null)
    }
  }

  const handleDownloadFresh = async () => {
    setDownloading('__fresh__')
    try {
      const res = await offlineFetch(`/api/backup?format=${backupFormat}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al crear backup')
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const contentDisposition = res.headers.get('content-disposition')
      const filenameMatch = contentDisposition?.match(/filename="?(.+?)"?$/)
      a.download = filenameMatch?.[1] || `TallerTech_backup_${new Date().toISOString().split('T')[0]}.${backupFormat === 'json' ? 'json' : 'db'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast({ title: 'Backup descargado', description: 'Copia de seguridad descargada exitosamente' })
      fetchData()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al descargar',
        variant: 'destructive',
      })
    } finally {
      setDownloading(null)
    }
  }

  // ─── Restore ───────────────────────────────────────────────

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setRestoreFile(file)
    setRestoreValidation(null)

    // If JSON, validate it
    if (file.name.endsWith('.json')) {
      setValidating(true)
      try {
        const text = await file.text()
        const backupData = JSON.parse(text)

        // Basic client-side validation
        const errors: string[] = []
        if (!backupData.version) errors.push('Versión no especificada')
        if (backupData.app !== 'TallerTech') errors.push('No es un backup de TallerTech')
        if (!backupData.data) errors.push('No se encontraron datos')
        if (!backupData.checksum) errors.push('Checksum faltante')

        setRestoreValidation({
          valid: errors.length === 0,
          errors,
          stats: backupData.stats,
        })
      } catch {
        setRestoreValidation({
          valid: false,
          errors: ['Archivo JSON inválido o corrupto'],
        })
      } finally {
        setValidating(false)
      }
    } else {
      // SQLite file - no pre-validation possible
      setRestoreValidation({ valid: true, errors: [] })
    }

    setRestoreOpen(true)
  }

  const handleRestore = async () => {
    if (!restoreFile) return

    setRestoring(true)
    try {
      const formData = new FormData()
      formData.append('file', restoreFile)

      const res = await offlineFetch('/api/backup/restore', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Error al restaurar')
      }

      toast({
        title: 'Base de datos restaurada',
        description: data.message,
      })
      setRestoreOpen(false)
      setRestoreFile(null)
      setRestoreValidation(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      fetchData()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al restaurar',
        variant: 'destructive',
      })
    } finally {
      setRestoring(false)
    }
  }

  // ─── Delete ────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(deleteTarget.filename)
    try {
      const res = await offlineFetch('/api/backup', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: deleteTarget.filename }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al eliminar')
      }
      toast({ title: 'Backup eliminado', description: deleteTarget.filename })
      setDeleteOpen(false)
      setDeleteTarget(null)
      fetchData()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al eliminar',
        variant: 'destructive',
      })
    } finally {
      setDeleting(null)
    }
  }

  // ─── Render ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando sistema de backup...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Copia de Seguridad</h2>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {/* Database Stats */}
      {dbStats && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-emerald-600" />
              <div>
                <CardTitle className="text-base">Estado de la Base de Datos</CardTitle>
                <CardDescription>Información actual del almacenamiento</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                <Database className="size-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Tamaño del archivo</p>
                <p className="text-xl font-bold">{formatFileSize(dbStats.fileSize)}</p>
              </div>
              {dbStats.lastBackup && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Último backup</p>
                  <p className="text-sm font-medium">{timeAgo(dbStats.lastBackup)}</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {dbStats.tables.map((table) => (
                <div key={table.name} className="text-center p-2 rounded-lg bg-muted/50">
                  <p className="text-lg font-bold">{table.count}</p>
                  <p className="text-xs text-muted-foreground capitalize">{table.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Backup */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Crear Copia de Seguridad</CardTitle>
              <CardDescription>Genere un backup completo de todos los datos del sistema</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Format Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Formato del Backup</Label>
                <Select value={backupFormat} onValueChange={(v: 'json' | 'sqlite') => setBackupFormat(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON (Recomendado)</SelectItem>
                    <SelectItem value="sqlite">SQLite (Archivo crudo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="backupDesc">Descripción (opcional)</Label>
                <Input
                  id="backupDesc"
                  value={backupDescription}
                  onChange={(e) => setBackupDescription(e.target.value)}
                  placeholder="Ej: Backup antes de cierre mensual"
                />
              </div>
            </div>

            {/* Format comparison cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={`p-3 rounded-lg border-2 transition-colors ${backupFormat === 'json' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <FileJson className="size-5 text-emerald-600" />
                  <span className="font-medium">JSON</span>
                  <Badge variant="secondary" className="text-xs">Recomendado</Badge>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-center gap-1"><CheckCircle2 className="size-3 text-emerald-500 shrink-0" /> Validable antes de restaurar</li>
                  <li className="flex items-center gap-1"><CheckCircle2 className="size-3 text-emerald-500 shrink-0" /> Legible y verificable</li>
                  <li className="flex items-center gap-1"><CheckCircle2 className="size-3 text-emerald-500 shrink-0" /> Protegido con checksum SHA-256</li>
                  <li className="flex items-center gap-1"><CheckCircle2 className="size-3 text-emerald-500 shrink-0" /> Compatible entre versiones</li>
                </ul>
              </div>
              <div className={`p-3 rounded-lg border-2 transition-colors ${backupFormat === 'sqlite' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <FileArchive className="size-5 text-amber-600" />
                  <span className="font-medium">SQLite</span>
                  <Badge variant="outline" className="text-xs">Legacy</Badge>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-center gap-1"><CheckCircle2 className="size-3 text-amber-500 shrink-0" /> Copia exacta de la base de datos</li>
                  <li className="flex items-center gap-1"><Info className="size-3 text-amber-500 shrink-0" /> No se puede validar antes de restaurar</li>
                  <li className="flex items-center gap-1"><Info className="size-3 text-amber-500 shrink-0" /> Dependiente de la versión de esquema</li>
                  <li className="flex items-center gap-1"><Info className="size-3 text-amber-500 shrink-0" /> Restauro más rápido</li>
                </ul>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleCreateBackup} disabled={creating} className="flex-1 sm:flex-none">
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Crear Backup {backupFormat.toUpperCase()}
              </Button>
              <Button variant="outline" onClick={handleDownloadFresh} disabled={downloading === '__fresh__'}>
                {downloading === '__fresh__' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Crear y Descargar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Restore */}
      <Card className="border-amber-500/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-amber-600" />
            <div>
              <CardTitle className="text-base">Restaurar Base de Datos</CardTitle>
              <CardDescription>Restaurar desde un archivo de backup previamente creado</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="size-4 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Precaución:</p>
                <p>Restaurar reemplazará <strong>todos los datos actuales</strong>.
                Se creará automáticamente un backup de seguridad antes de restaurar.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-start">
              <div className="flex-1 w-full">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.db,.sqlite,.sqlite3"
                  onChange={handleFileSelect}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Acepta archivos .json (recomendado) o .db/.sqlite
                </p>
              </div>
            </div>

            {/* Validation result */}
            {validating && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Validando archivo...
              </div>
            )}

            {restoreValidation && !validating && (
              <div className={`p-3 rounded-lg ${restoreValidation.valid ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
                <div className="flex items-center gap-2 mb-1">
                  {restoreValidation.valid ? (
                    <CheckCircle2 className="size-4 text-emerald-600" />
                  ) : (
                    <XCircle className="size-4 text-red-600" />
                  )}
                  <span className={`font-medium text-sm ${restoreValidation.valid ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                    {restoreValidation.valid ? 'Archivo válido' : 'Archivo inválido'}
                  </span>
                </div>
                {restoreValidation.errors.length > 0 && (
                  <ul className="text-xs text-red-600 dark:text-red-400 ml-6 space-y-1">
                    {restoreValidation.errors.map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                )}
                {restoreValidation.stats && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(restoreValidation.stats).map(([key, value]) => (
                      <Badge key={key} variant="secondary" className="text-xs">
                        {key}: {value}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Historial de Backups</CardTitle>
              <CardDescription>Backups almacenados en el servidor</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No hay backups registrados</p>
              <p className="text-xs">Cree su primer backup usando el formulario de arriba</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  {/* Icon + Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                      backup.format === 'json' ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                    }`}>
                      {backup.format === 'json' ? (
                        <FileJson className="size-5 text-emerald-600" />
                      ) : (
                        <FileArchive className="size-5 text-amber-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{backup.description || backup.filename}</p>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {backup.format.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        <span>{formatDate(backup.createdAt)}</span>
                        <span>•</span>
                        <span>{formatFileSize(backup.size)}</span>
                        {backup.stats && Object.keys(backup.stats).length > 0 && (
                          <>
                            <span>•</span>
                            <span>{Object.values(backup.stats).reduce((a, b) => a + b, 0)} registros</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadBackup(backup)}
                            disabled={downloading === backup.filename}
                          >
                            {downloading === backup.filename ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Descargar</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setDeleteTarget(backup)
                              setDeleteOpen(true)
                            }}
                            disabled={deleting === backup.filename}
                          >
                            {deleting === backup.filename ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Eliminar</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-sky-500/20 bg-sky-50/50 dark:bg-sky-950/10">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Shield className="size-5 text-sky-600 shrink-0 mt-0.5" />
            <div className="text-sm space-y-2">
              <p className="font-medium text-sky-700 dark:text-sky-400">Recomendaciones de Seguridad</p>
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li>• Realice un backup <strong>diario</strong> antes del cuadre del taller</li>
                <li>• Descargue el backup a su teléfono o almacenamiento externo</li>
                <li>• El formato JSON permite verificar la integridad antes de restaurar</li>
                <li>• Siempre se crea un backup de seguridad automático antes de restaurar</li>
                <li>• Guarde múltiples copias en diferentes ubicaciones</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Restore Confirmation Dialog ──────────────────────── */}
      <AlertDialog open={restoreOpen} onOpenChange={(open) => {
        setRestoreOpen(open)
        if (!open) {
          setRestoreFile(null)
          setRestoreValidation(null)
          if (fileInputRef.current) fileInputRef.current.value = ''
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              ¿Restaurar base de datos?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Esta acción reemplazará <strong>todos los datos actuales</strong> con el archivo seleccionado.
                  Se creará automáticamente un backup de seguridad antes de restaurar.
                </p>
                {restoreFile && (
                  <div className="p-2 rounded bg-muted text-sm">
                    <p><strong>Archivo:</strong> {restoreFile.name}</p>
                    <p><strong>Tamaño:</strong> {formatFileSize(restoreFile.size)}</p>
                  </div>
                )}
                {restoreValidation && !restoreValidation.valid && (
                  <div className="p-2 rounded bg-destructive/10 text-destructive text-sm">
                    <p className="font-medium">Este archivo tiene problemas:</p>
                    <ul className="mt-1 space-y-1">
                      {restoreValidation.errors.map((err, i) => (
                        <li key={i}>• {err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoring}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              disabled={restoring || (restoreValidation !== null && !restoreValidation.valid)}
            >
              {restoring ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Restaurando...</>
              ) : (
                'Sí, Restaurar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Delete Confirmation Dialog ────────────────────────── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              ¿Eliminar backup?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el archivo de backup{' '}
              <strong>{deleteTarget?.filename}</strong>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting !== null}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting !== null}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting !== null ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Eliminando...</>
              ) : (
                'Sí, Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
