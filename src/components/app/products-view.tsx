'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Package,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  PackageOpen,
} from 'lucide-react'
import { offlineFetch } from '@/lib/offline-fetch'

// Types
interface Category {
  id: string
  name: string
  description?: string | null
  type: string
  active: boolean
}

interface Supplier {
  id: string
  name: string
  phone?: string | null
  email?: string | null
}

interface Product {
  id: string
  name: string
  sku?: string | null
  description?: string | null
  categoryId?: string | null
  category?: Category | null
  supplierId?: string | null
  supplier?: Supplier | null
  costPrice: number
  salePrice: number
  quantity: number
  minStock: number
  unit: string
  type: string
  brand?: string | null
  model?: string | null
  location?: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

interface ProductsResponse {
  data: Product[]
  total: number
  page: number
  limit: number
}

interface ProductFormData {
  name: string
  sku: string
  description: string
  categoryId: string
  supplierId: string
  costPrice: string
  salePrice: string
  quantity: string
  minStock: string
  unit: string
  type: string
  brand: string
  model: string
  location: string
}

const emptyForm: ProductFormData = {
  name: '',
  sku: '',
  description: '',
  categoryId: '',
  supplierId: '',
  costPrice: '0',
  salePrice: '0',
  quantity: '0',
  minStock: '5',
  unit: 'unidad',
  type: 'product',
  brand: '',
  model: '',
  location: '',
}

const typeLabels: Record<string, string> = {
  product: 'Producto',
  service: 'Servicio',
  part: 'Repuesto',
}

const unitLabels: Record<string, string> = {
  unidad: 'Unidad',
  metro: 'Metro',
  litro: 'Litro',
}

export function ProductsView() {
  const { toast } = useToast()

  // Data state
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  // Filter state
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStock, setFilterStock] = useState('all')
  const [page, setPage] = useState(1)
  const limit = 20

  // Dialog state
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [stockOpen, setStockOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [stockProduct, setStockProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState<ProductFormData>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  // Stock adjustment state
  const [stockType, setStockType] = useState<'in' | 'out' | 'adjustment'>('in')
  const [stockQty, setStockQty] = useState('')
  const [stockReason, setStockReason] = useState('')

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterType !== 'all') params.set('type', filterType)
      if (filterCategory !== 'all') params.set('categoryId', filterCategory)
      if (filterStock === 'low') params.set('lowStock', 'true')
      params.set('page', page.toString())
      params.set('limit', limit.toString())
      params.set('active', 'true')

      const res = await offlineFetch(`/api/products?${params}`)
      if (res.ok) {
        const data: ProductsResponse = await res.json()
        setProducts(data.data)
        setTotal(data.total)
      }
    } catch {
      toast({ title: 'Error', description: 'Error al cargar productos', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [search, filterType, filterCategory, filterStock, page, toast])

  // Fetch categories and suppliers for dropdowns
  const fetchOptions = useCallback(async () => {
    try {
      const [catRes, supRes] = await Promise.all([
        offlineFetch('/api/categories'),
        offlineFetch('/api/suppliers'),
      ])
      if (catRes.ok) {
        const catData = await catRes.json()
        setCategories(catData.data || [])
      }
      if (supRes.ok) {
        const supData = await supRes.json()
        setSuppliers(supData.data || [])
      }
    } catch {
      // Silently fail for options
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    fetchOptions()
  }, [fetchOptions])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [search, filterType, filterCategory, filterStock])

  // Open add dialog
  const handleAdd = () => {
    setEditingProduct(null)
    setFormData(emptyForm)
    setFormOpen(true)
  }

  // Open edit dialog
  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      sku: product.sku || '',
      description: product.description || '',
      categoryId: product.categoryId || '',
      supplierId: product.supplierId || '',
      costPrice: product.costPrice.toString(),
      salePrice: product.salePrice.toString(),
      quantity: product.quantity.toString(),
      minStock: product.minStock.toString(),
      unit: product.unit,
      type: product.type,
      brand: product.brand || '',
      model: product.model || '',
      location: product.location || '',
    })
    setFormOpen(true)
  }

  // Open delete dialog
  const handleDelete = (product: Product) => {
    setDeletingProduct(product)
    setDeleteOpen(true)
  }

  // Open stock adjustment dialog
  const handleStock = (product: Product) => {
    setStockProduct(product)
    setStockType('in')
    setStockQty('')
    setStockReason('')
    setStockOpen(true)
  }

  // Submit product form (create/update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const payload = {
        name: formData.name,
        sku: formData.sku || null,
        description: formData.description || null,
        categoryId: formData.categoryId || null,
        supplierId: formData.supplierId || null,
        costPrice: parseFloat(formData.costPrice) || 0,
        salePrice: parseFloat(formData.salePrice) || 0,
        quantity: parseInt(formData.quantity) || 0,
        minStock: parseInt(formData.minStock) || 5,
        unit: formData.unit,
        type: formData.type,
        brand: formData.brand || null,
        model: formData.model || null,
        location: formData.location || null,
      }

      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products'
      const method = editingProduct ? 'PUT' : 'POST'

      const res = await offlineFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({ title: 'Error', description: data.error || 'Error al guardar producto', variant: 'destructive' })
        return
      }

      toast({
        title: editingProduct ? 'Producto actualizado' : 'Producto creado',
        description: editingProduct ? 'El producto se ha actualizado exitosamente' : 'El producto se ha creado exitosamente',
      })

      setFormOpen(false)
      fetchProducts()
    } catch {
      toast({ title: 'Error', description: 'Error de conexión', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  // Confirm delete
  const confirmDelete = async () => {
    if (!deletingProduct) return
    setSubmitting(true)

    try {
      const res = await offlineFetch(`/api/products/${deletingProduct.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Error al eliminar', variant: 'destructive' })
        return
      }

      toast({ title: 'Producto eliminado', description: 'El producto se ha desactivado exitosamente' })
      setDeleteOpen(false)
      setDeletingProduct(null)
      fetchProducts()
    } catch {
      toast({ title: 'Error', description: 'Error de conexión', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  // Submit stock adjustment
  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stockProduct) return
    setSubmitting(true)

    try {
      const res = await offlineFetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: stockProduct.id,
          type: stockType,
          quantity: stockType === 'adjustment'
            ? parseInt(stockQty) || 0
            : Math.abs(parseInt(stockQty)) || 0,
          reason: stockReason || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({ title: 'Error', description: data.error || 'Error al ajustar stock', variant: 'destructive' })
        return
      }

      toast({ title: 'Stock actualizado', description: 'El stock se ha ajustado exitosamente' })
      setStockOpen(false)
      setStockProduct(null)
      fetchProducts()
    } catch {
      toast({ title: 'Error', description: 'Error de conexión', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  // Stock status badge
  const StockBadge = ({ product }: { product: Product }) => {
    if (product.quantity <= 0) {
      return <Badge variant="destructive" className="text-xs">Sin stock</Badge>
    }
    if (product.quantity <= product.minStock) {
      return <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-xs">Stock bajo</Badge>
    }
    return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs">En stock</Badge>
  }

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CU', { style: 'currency', currency: 'USD' }).format(val)
  }

  const totalPages = Math.ceil(total / limit)
  const hasFilters = search || filterType !== 'all' || filterCategory !== 'all' || filterStock !== 'all'

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Productos</h2>
          <p className="text-sm text-muted-foreground">
            Gestiona el inventario de productos y repuestos
          </p>
        </div>
        <Button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
          <Plus className="mr-2 size-4" />
          Agregar Producto
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, SKU, marca..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px]" size="sm">
                  <Filter className="mr-1 size-3" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="product">Producto</SelectItem>
                  <SelectItem value="service">Servicio</SelectItem>
                  <SelectItem value="part">Repuesto</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[160px]" size="sm">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStock} onValueChange={setFilterStock}>
                <SelectTrigger className="w-[140px]" size="sm">
                  <SelectValue placeholder="Stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo</SelectItem>
                  <SelectItem value="low">Stock bajo</SelectItem>
                  <SelectItem value="out">Sin stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="size-4 text-emerald-600" />
            Lista de Productos
            <Badge variant="secondary" className="ml-auto">{total} total</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-5 flex-1" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <PackageOpen className="size-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                {hasFilters ? 'No se encontraron productos con los filtros aplicados' : 'No hay productos registrados'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {hasFilters ? 'Intenta ajustar los filtros de búsqueda' : 'Agrega tu primer producto para comenzar'}
              </p>
              {!hasFilters && (
                <Button onClick={handleAdd} variant="outline" className="mt-4 border-emerald-600 text-emerald-600 hover:bg-emerald-50">
                  <Plus className="mr-2 size-4" />
                  Agregar Producto
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Nombre</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="hidden md:table-cell">Categoría</TableHead>
                      <TableHead className="hidden lg:table-cell">Tipo</TableHead>
                      <TableHead className="text-right">Costo</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="text-center">Cant.</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                      <TableHead className="w-[60px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id} className={product.quantity <= product.minStock && product.quantity > 0 ? 'bg-amber-50/50 dark:bg-amber-950/20' : product.quantity <= 0 ? 'bg-red-50/50 dark:bg-red-950/20' : ''}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{product.name}</span>
                            {(product.brand || product.model) && (
                              <span className="text-xs text-muted-foreground">
                                {[product.brand, product.model].filter(Boolean).join(' - ')}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {product.sku || '-'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="text-xs">
                            {product.category?.name || 'Sin categoría'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge variant="secondary" className="text-xs">
                            {typeLabels[product.type] || product.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {formatCurrency(product.costPrice)}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          {formatCurrency(product.salePrice)}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm font-medium">{product.quantity}</span>
                          <span className="text-xs text-muted-foreground ml-0.5">{unitLabels[product.unit] || product.unit}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <StockBadge product={product} />
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(product)}>
                                <Pencil className="mr-2 size-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStock(product)}>
                                <ArrowUpDown className="mr-2 size-4" />
                                Ajustar Stock
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(product)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 size-4" />
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
                  <p className="text-xs text-muted-foreground">
                    Mostrando {(page - 1) * limit + 1}-{Math.min(page * limit, total)} de {total}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <span className="text-sm px-2">
                      {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Product Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editar Producto' : 'Agregar Producto'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Modifica los datos del producto' : 'Completa los datos del nuevo producto'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nombre del producto"
                  required
                />
              </div>

              {/* SKU */}
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Código SKU"
                />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product">Producto</SelectItem>
                    <SelectItem value="service">Servicio</SelectItem>
                    <SelectItem value="part">Repuesto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select value={formData.categoryId} onValueChange={(v) => setFormData({ ...formData, categoryId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Supplier */}
              <div className="space-y-2">
                <Label>Proveedor</Label>
                <Select value={formData.supplierId} onValueChange={(v) => setFormData({ ...formData, supplierId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((sup) => (
                      <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cost Price */}
              <div className="space-y-2">
                <Label htmlFor="costPrice">Precio de Costo</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                />
              </div>

              {/* Sale Price */}
              <div className="space-y-2">
                <Label htmlFor="salePrice">Precio de Venta</Label>
                <Input
                  id="salePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.salePrice}
                  onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                />
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity">Cantidad</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>

              {/* Min Stock */}
              <div className="space-y-2">
                <Label htmlFor="minStock">Stock Mínimo</Label>
                <Input
                  id="minStock"
                  type="number"
                  min="0"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                />
              </div>

              {/* Unit */}
              <div className="space-y-2">
                <Label>Unidad</Label>
                <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unidad">Unidad</SelectItem>
                    <SelectItem value="metro">Metro</SelectItem>
                    <SelectItem value="litro">Litro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Brand */}
              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="Ej: Samsung, Apple"
                />
              </div>

              {/* Model */}
              <div className="space-y-2">
                <Label htmlFor="model">Modelo</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="Modelo de celular compatible"
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Ej: Estante A, Caja 3"
                />
              </div>

              {/* Description */}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción del producto"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar <strong>{deletingProduct?.name}</strong>?
              El producto será desactivado del sistema.
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

      {/* Stock Adjustment Dialog */}
      <Dialog open={stockOpen} onOpenChange={setStockOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajustar Stock</DialogTitle>
            <DialogDescription>
              Ajustar inventario de <strong>{stockProduct?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1 mb-4 text-sm">
            <span className="text-muted-foreground">Stock actual: </span>
            <span className="font-bold text-lg">{stockProduct?.quantity}</span>
            <span className="text-muted-foreground"> {stockProduct ? unitLabels[stockProduct.unit] : ''}</span>
          </div>
          <form onSubmit={handleStockSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de movimiento</Label>
              <Select value={stockType} onValueChange={(v) => setStockType(v as 'in' | 'out' | 'adjustment')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">
                    <div className="flex items-center gap-2">
                      <ArrowUp className="size-3 text-emerald-600" />
                      Entrada
                    </div>
                  </SelectItem>
                  <SelectItem value="out">
                    <div className="flex items-center gap-2">
                      <ArrowDown className="size-3 text-red-600" />
                      Salida
                    </div>
                  </SelectItem>
                  <SelectItem value="adjustment">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="size-3 text-blue-600" />
                      Ajuste (valor exacto)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stockQty">
                {stockType === 'adjustment' ? 'Nueva cantidad' : 'Cantidad'}
              </Label>
              <Input
                id="stockQty"
                type="number"
                min="0"
                value={stockQty}
                onChange={(e) => setStockQty(e.target.value)}
                placeholder={stockType === 'adjustment' ? 'Valor exacto del stock' : 'Cantidad a mover'}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stockReason">Razón</Label>
              <Input
                id="stockReason"
                value={stockReason}
                onChange={(e) => setStockReason(e.target.value)}
                placeholder="Ej: Compra a proveedor, Merma, Inventario físico"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStockOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting || !stockQty} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                Aplicar Ajuste
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
