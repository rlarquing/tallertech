'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Plus,
  Pencil,
  Trash2,
  Tag,
  Package,
  Wrench,
  LayoutGrid,
  Loader2,
  FolderOpen,
} from 'lucide-react'
import { offlineFetch } from '@/lib/offline-fetch'
import { categorySchema } from '@/lib/validations'

// Types
interface Category {
  id: string
  name: string
  description?: string | null
  type: string
  active: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    products: number
  }
}

interface CategoryFormData {
  name: string
  description: string
  type: string
}

const emptyForm: CategoryFormData = {
  name: '',
  description: '',
  type: 'product',
}

const typeLabels: Record<string, string> = {
  product: 'Producto',
  service: 'Servicio',
  part: 'Repuesto',
}

const typeIcons: Record<string, React.ElementType> = {
  product: Package,
  service: Wrench,
  part: Tag,
}

const typeColors: Record<string, string> = {
  product: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  service: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  part: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
}

export function CategoriesView() {
  const { toast } = useToast()

  // Data state
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog state
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const res = await offlineFetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.data || [])
      }
    } catch {
      toast({ title: 'Error', description: 'Error al cargar categorías', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Open add dialog
  const handleAdd = () => {
    setEditingCategory(null)
    setFormData(emptyForm)
    setValidationErrors({})
    setFormOpen(true)
  }

  // Open edit dialog
  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      type: category.type,
    })
    setValidationErrors({})
    setFormOpen(true)
  }

  // Open delete dialog
  const handleDelete = (category: Category) => {
    setDeletingCategory(category)
    setDeleteOpen(true)
  }

  // Submit form (create/update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate with Zod
    const result = categorySchema.safeParse({
      name: formData.name,
      description: formData.description || undefined,
      type: formData.type,
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
      const payload = {
        name: formData.name,
        description: formData.description || null,
        type: formData.type,
      }

      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories'
      const method = editingCategory ? 'PUT' : 'POST'

      const res = await offlineFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({ title: 'Error', description: data.error || 'Error al guardar categoría', variant: 'destructive' })
        return
      }

      toast({
        title: editingCategory ? 'Categoría actualizada' : 'Categoría creada',
        description: editingCategory ? 'La categoría se ha actualizado exitosamente' : 'La categoría se ha creado exitosamente',
      })

      setFormOpen(false)
      fetchCategories()
    } catch {
      toast({ title: 'Error', description: 'Error de conexión', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  // Confirm delete
  const confirmDelete = async () => {
    if (!deletingCategory) return
    setSubmitting(true)

    try {
      const res = await offlineFetch(`/api/categories/${deletingCategory.id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) {
        toast({ title: 'Error', description: data.error || 'Error al eliminar', variant: 'destructive' })
        return
      }

      toast({
        title: 'Categoría eliminada',
        description: data.message || 'La categoría se ha eliminado exitosamente',
      })

      setDeleteOpen(false)
      setDeletingCategory(null)
      fetchCategories()
    } catch {
      toast({ title: 'Error', description: 'Error de conexión', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Categorías</h2>
          <p className="text-sm text-muted-foreground">
            Organiza tus productos, servicios y repuestos
          </p>
        </div>
        <Button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
          <Plus className="mr-2 size-4" />
          Agregar Categoría
        </Button>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="size-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              No hay categorías registradas
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Crea tu primera categoría para organizar tus productos
            </p>
            <Button onClick={handleAdd} variant="outline" className="mt-4 border-emerald-600 text-emerald-600 hover:bg-emerald-50">
              <Plus className="mr-2 size-4" />
              Agregar Categoría
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((category) => {
            const TypeIcon = typeIcons[category.type] || Tag
            const colorClass = typeColors[category.type] || typeColors.product
            const productCount = category._count?.products || 0

            return (
              <Card key={category.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex size-10 items-center justify-center rounded-lg ${colorClass}`}>
                        <TypeIcon className="size-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{category.name}</CardTitle>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {typeLabels[category.type] || category.type}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => handleEdit(category)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(category)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {category.description ? (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {category.description}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground/50 italic mb-3">
                      Sin descripción
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Package className="size-3.5" />
                    <span>
                      {productCount} {productCount === 1 ? 'producto' : 'productos'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Summary Stats */}
      {!loading && categories.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <Package className="size-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Productos</p>
                <p className="text-lg font-bold">{categories.filter(c => c.type === 'product').length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                <Wrench className="size-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Servicios</p>
                <p className="text-lg font-bold">{categories.filter(c => c.type === 'service').length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                <Tag className="size-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Repuestos</p>
                <p className="text-lg font-bold">{categories.filter(c => c.type === 'part').length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add/Edit Category Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editar Categoría' : 'Agregar Categoría'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory ? 'Modifica los datos de la categoría' : 'Completa los datos de la nueva categoría'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="catName">Nombre *</Label>
              <Input
                id="catName"
                value={formData.name}
                onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setValidationErrors((prev) => { const { name, ...rest } = prev; return rest }) }}
                placeholder="Nombre de la categoría"
                required
                autoFocus
              />
              {validationErrors.name && (
                <p className="text-xs text-destructive">{validationErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={formData.type} onValueChange={(v) => { setFormData({ ...formData, type: v }); setValidationErrors((prev) => { const { type, ...rest } = prev; return rest }) }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Producto</SelectItem>
                  <SelectItem value="service">Servicio</SelectItem>
                  <SelectItem value="part">Repuesto</SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.type && (
                <p className="text-xs text-destructive">{validationErrors.type}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="catDesc">Descripción</Label>
              <Textarea
                id="catDesc"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción de la categoría"
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar <strong>{deletingCategory?.name}</strong>?
              {deletingCategory && (deletingCategory._count?.products || 0) > 0 && (
                <span className="block mt-2 text-amber-600 dark:text-amber-400">
                  Esta categoría tiene {deletingCategory._count?.products} producto(s) asociado(s).
                  Será desactivada en lugar de eliminada.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={submitting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
