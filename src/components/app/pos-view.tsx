'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
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
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  X,
  Loader2,
  User,
  CheckCircle2,
  Receipt,
  Package,
} from 'lucide-react'
import { toast } from 'sonner'
import { offlineFetch } from '@/lib/offline-fetch'
import { saleSchema, saleItemSchema, customerSchema } from '@/lib/validations'

// ============================================================
// Types
// ============================================================

interface CartItem {
  productId: string
  name: string
  quantity: number
  unitPrice: number
  discount: number
  total: number
  type: string
  stock?: number
}

interface Product {
  id: string
  name: string
  sku: string | null
  salePrice: number
  quantity: number
  type: string
  brand: string | null
  category: { name: string } | null
}

interface Customer {
  id: string
  name: string
  phone: string | null
  dni: string | null
}

interface SaleResponse {
  id: string
  code: string
  subtotal: number
  discount: number
  tax: number
  total: number
  paymentMethod: string
  status: string
  customer: { name: string } | null
  items: {
    name: string
    quantity: number
    unitPrice: number
    discount: number
    total: number
    type: string
  }[]
  createdAt: string
}

// ============================================================
// POS View Component
// ============================================================

export function PosView() {
  const setCartItemCount = useAppStore((s) => s.setCartItemCount)

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerId, setCustomerId] = useState<string>('')
  const [customerName, setCustomerName] = useState<string>('')
  const [discount, setDiscount] = useState<number>(0)
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [paymentMethod, setPaymentMethod] = useState<string>('efectivo')
  const [notes, setNotes] = useState<string>('')

  // Product search
  const [productSearch, setProductSearch] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(false)

  // Customer search
  const [customerSearch, setCustomerSearch] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customersLoading, setCustomersLoading] = useState(false)
  const [showCustomerSelect, setShowCustomerSelect] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [customerValidationErrors, setCustomerValidationErrors] = useState<Record<string, string>>({})

  // Sale completion
  const [submitting, setSubmitting] = useState(false)
  const [completedSale, setCompletedSale] = useState<SaleResponse | null>(null)
  const [showReceipt, setShowReceipt] = useState(false)

  const searchTimeout = useRef<ReturnType<typeof setTimeout>>()
  const customerSearchTimeout = useRef<ReturnType<typeof setTimeout>>()

  // Sync cart count with global store for mobile nav badge
  useEffect(() => {
    setCartItemCount(cart.length)
  }, [cart.length, setCartItemCount])

  // ============================================================
  // Product search
  // ============================================================

  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setProducts([])
      return
    }
    setProductsLoading(true)
    try {
      const res = await offlineFetch(`/api/products?search=${encodeURIComponent(query)}&limit=30&active=true`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data.data || [])
      }
    } catch {
      // ignore
    } finally {
      setProductsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      searchProducts(productSearch)
    }, 300)
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current)
    }
  }, [productSearch, searchProducts])

  // ============================================================
  // Customer search
  // ============================================================

  const searchCustomers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setCustomers([])
      return
    }
    setCustomersLoading(true)
    try {
      const res = await offlineFetch(`/api/customers?search=${encodeURIComponent(query)}&limit=20`)
      if (res.ok) {
        const data = await res.json()
        setCustomers(data.data || [])
      }
    } catch {
      // ignore
    } finally {
      setCustomersLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!showCustomerSelect) return
    if (customerSearchTimeout.current) clearTimeout(customerSearchTimeout.current)
    customerSearchTimeout.current = setTimeout(() => {
      searchCustomers(customerSearch)
    }, 300)
    return () => {
      if (customerSearchTimeout.current) clearTimeout(customerSearchTimeout.current)
    }
  }, [customerSearch, showCustomerSelect, searchCustomers])

  // ============================================================
  // Cart operations
  // ============================================================

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id)
      if (existing) {
        if (existing.quantity >= product.quantity) {
          toast.error('Stock insuficiente')
          return prev
        }
        const newQty = existing.quantity + 1
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: newQty, total: newQty * item.unitPrice - item.discount }
            : item
        )
      }
      if (product.quantity <= 0) {
        toast.error('Producto sin stock')
        return prev
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          quantity: 1,
          unitPrice: product.salePrice,
          discount: 0,
          total: product.salePrice,
          type: product.type,
          stock: product.quantity,
        },
      ]
    })
  }, [])

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item
        const newQty = item.quantity + delta
        if (newQty <= 0) return item
        if (item.stock !== undefined && newQty > item.stock) {
          toast.error('Stock insuficiente')
          return item
        }
        return { ...item, quantity: newQty, total: newQty * item.unitPrice - item.discount }
      })
    )
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
    setCustomerId('')
    setCustomerName('')
    setDiscount(0)
    setNotes('')
    setValidationErrors({})
  }, [])

  // ============================================================
  // Totals calculation
  // ============================================================

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
  const discountAmount =
    discountType === 'percentage' ? (subtotal * discount) / 100 : discount
  const tax = 0
  const total = subtotal - discountAmount + tax

  // ============================================================
  // Quick add customer
  // ============================================================

  const quickAddCustomer = async () => {
    setCustomerValidationErrors({})
    const result = customerSchema.safeParse({
      name: newCustomerName,
      phone: newCustomerPhone || '',
    })
    if (!result.success) {
      const errors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const key = issue.path.join('.')
        if (!errors[key]) errors[key] = issue.message
      }
      setCustomerValidationErrors(errors)
      return
    }
    try {
      const res = await offlineFetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCustomerName, phone: newCustomerPhone || undefined }),
      })
      if (res.ok) {
        const customer = await res.json()
        setCustomerId(customer.id)
        setCustomerName(customer.name)
        setShowCustomerSelect(false)
        setNewCustomerName('')
        setNewCustomerPhone('')
        toast.success('Cliente creado correctamente')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al crear cliente')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  // ============================================================
  // Complete sale
  // ============================================================

  const completeSale = async () => {
    setValidationErrors({})

    // Validate sale-level fields
    const discountValue = discountType === 'percentage' ? discount : discountAmount
    const saleData = {
      customerId: customerId || undefined,
      paymentMethod,
      discount: discountValue,
      notes: notes || undefined,
      items: cart.map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        type: item.type as 'product' | 'service' | 'part',
      })),
    }

    const saleResult = saleSchema.safeParse(saleData)
    const errors: Record<string, string> = {}

    if (!saleResult.success) {
      for (const issue of saleResult.error.issues) {
        const key = issue.path.join('.')
        if (!errors[key]) errors[key] = issue.message
      }
    }

    // Validate each cart item individually for more specific errors
    cart.forEach((item, idx) => {
      const itemResult = saleItemSchema.safeParse({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        type: item.type as 'product' | 'service' | 'part',
      })
      if (!itemResult.success) {
        for (const issue of itemResult.error.issues) {
          const key = `items.${idx}.${issue.path.join('.')}`
          if (!errors[key]) errors[key] = issue.message
        }
      }
    })

    // Validate total > 0
    if (total <= 0 && cart.length > 0) {
      errors['total'] = 'El total de la venta debe ser mayor a 0'
    }

    // Validate discount percentage range
    if (discountType === 'percentage' && (discount < 0 || discount > 100)) {
      errors['discount'] = 'El descuento debe estar entre 0 y 100%'
    }
    if (discountType === 'fixed' && discount < 0) {
      errors['discount'] = 'El descuento no puede ser negativo'
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      toast.error('Corrija los errores de validación')
      return
    }

    if (cart.length === 0) {
      toast.error('El carrito está vacío')
      return
    }
    setSubmitting(true)
    try {
      const res = await offlineFetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customerId || undefined,
          items: cart.map((item) => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            total: item.total,
            type: item.type,
          })),
          discount: discountAmount,
          tax,
          paymentMethod,
          notes: notes || undefined,
        }),
      })

      if (res.ok) {
        const sale: SaleResponse = await res.json()
        setCompletedSale(sale)
        setShowReceipt(true)
        clearCart()
        toast.success('Venta completada correctamente')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al completar venta')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  // ============================================================
  // Format currency
  // ============================================================

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CU', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // ============================================================
  // Receipt Dialog
  // ============================================================

  const ReceiptDialog = () => (
    <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-primary" />
            Venta Completada
          </DialogTitle>
          <DialogDescription>La venta se ha registrado exitosamente</DialogDescription>
        </DialogHeader>
        {completedSale && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Código:</span>
                <span className="font-mono font-semibold">{completedSale.code}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cliente:</span>
                <span>{completedSale.customer?.name || 'Cliente general'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Método de pago:</span>
                <span className="capitalize">{completedSale.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fecha:</span>
                <span>{new Date(completedSale.createdAt).toLocaleString('es-CU')}</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Detalle de items:</h4>
              {completedSale.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>
                    {item.name} x{item.quantity}
                  </span>
                  <span>{formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>{formatCurrency(completedSale.subtotal)}</span>
              </div>
              {completedSale.discount > 0 && (
                <div className="flex justify-between text-sm text-destructive">
                  <span>Descuento:</span>
                  <span>-{formatCurrency(completedSale.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-base">
                <span>Total:</span>
                <span>{formatCurrency(completedSale.total)}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  window.print()
                }}
              >
                <Receipt className="mr-2 size-4" />
                Imprimir
              </Button>
              <Button className="flex-1" onClick={() => setShowReceipt(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )

  // ============================================================
  // Customer Select Dialog
  // ============================================================

  const CustomerDialog = () => (
    <Dialog open={showCustomerSelect} onOpenChange={(open) => { setShowCustomerSelect(open); if (!open) setCustomerValidationErrors({}) }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Seleccionar Cliente</DialogTitle>
          <DialogDescription>Busque un cliente existente o cree uno nuevo</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, teléfono, DNI..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Results */}
          <ScrollArea className="max-h-48">
            {customersLoading ? (
              <div className="space-y-2 p-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : customers.length > 0 ? (
              <div className="space-y-1">
                {customers.map((c) => (
                  <button
                    key={c.id}
                    className="w-full flex items-center gap-3 rounded-md p-2 text-left hover:bg-muted transition-colors"
                    onClick={() => {
                      setCustomerId(c.id)
                      setCustomerName(c.name)
                      setShowCustomerSelect(false)
                      setCustomerSearch('')
                    }}
                  >
                    <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <User className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.phone || c.dni || 'Sin datos'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : customerSearch ? (
              <p className="text-center text-sm text-muted-foreground py-4">
                No se encontraron clientes
              </p>
            ) : null}
          </ScrollArea>

          <Separator />

          {/* Quick add */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Crear nuevo cliente</p>
            <div>
              <Input
                placeholder="Nombre del cliente"
                value={newCustomerName}
                onChange={(e) => {
                  setNewCustomerName(e.target.value)
                  if (customerValidationErrors['name']) {
                    setCustomerValidationErrors((prev) => { const next = { ...prev }; delete next['name']; return next })
                  }
                }}
                className={customerValidationErrors['name'] ? 'border-destructive' : ''}
              />
              {customerValidationErrors['name'] && (
                <p className="text-xs text-destructive mt-1">{customerValidationErrors['name']}</p>
              )}
            </div>
            <div>
              <Input
                placeholder="Teléfono (opcional)"
                value={newCustomerPhone}
                onChange={(e) => {
                  setNewCustomerPhone(e.target.value)
                  if (customerValidationErrors['phone']) {
                    setCustomerValidationErrors((prev) => { const next = { ...prev }; delete next['phone']; return next })
                  }
                }}
                className={customerValidationErrors['phone'] ? 'border-destructive' : ''}
              />
              {customerValidationErrors['phone'] && (
                <p className="text-xs text-destructive mt-1">{customerValidationErrors['phone']}</p>
              )}
            </div>
            <Button onClick={quickAddCustomer} className="w-full" size="sm">
              <Plus className="mr-2 size-4" />
              Crear Cliente
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="flex flex-1 flex-col lg:flex-row gap-4 p-4 lg:p-6">
      {/* Left Panel - Products */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        {/* Product Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar producto por nombre o SKU..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-9"
              />
              {productSearch && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 size-7"
                  onClick={() => {
                    setProductSearch('')
                    setProducts([])
                  }}
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Product Grid */}
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="size-4" />
              Productos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {productSearch ? (
              productsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-lg" />
                  ))}
                </div>
              ) : products.length > 0 ? (
                <ScrollArea className="max-h-[calc(100vh-320px)]">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {products.map((product) => {
                      const inCart = cart.find((item) => item.productId === product.id)
                      return (
                        <button
                          key={product.id}
                          className={`relative flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all hover:shadow-md hover:border-primary/30 dark:hover:border-primary/70 ${
                            inCart ? 'border-primary/40 bg-primary/5 dark:border-primary/70' : 'bg-card'
                          }`}
                          onClick={() => addToCart(product)}
                        >
                          {inCart && (
                            <Badge className="absolute -top-2 -right-2 size-5 flex items-center justify-center p-0 text-[10px] bg-primary">
                              {inCart.quantity}
                            </Badge>
                          )}
                          <p className="text-sm font-medium leading-tight line-clamp-2">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.sku && <span className="font-mono">{product.sku} · </span>}
                            Stock: {product.quantity}
                          </p>
                          <p className="text-sm font-semibold text-primary">
                            {formatCurrency(product.salePrice)}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Package className="size-10 mb-2 opacity-40" />
                  <p className="text-sm">No se encontraron productos</p>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Search className="size-10 mb-2 opacity-40" />
                <p className="text-sm">Busque productos para agregar al carrito</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Cart */}
      <div className="w-full lg:w-96 flex flex-col gap-4">
        {/* Customer */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <User className="size-4 text-muted-foreground shrink-0" />
                {customerId ? (
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{customerName}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Cliente general</p>
                )}
              </div>
              <div className="flex gap-1">
                {customerId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-8 p-0 text-destructive"
                    onClick={() => {
                      setCustomerId('')
                      setCustomerName('')
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCustomerSelect(true)}
                >
                  <User className="mr-1 size-3" />
                  Cliente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cart Items */}
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart className="size-4" />
                Carrito
                {cart.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {cart.length}
                  </Badge>
                )}
              </CardTitle>
              {cart.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive text-xs"
                  onClick={clearCart}
                >
                  <Trash2 className="mr-1 size-3" />
                  Limpiar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {cart.length > 0 ? (
              <ScrollArea className="max-h-[calc(100vh-520px)]">
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-start gap-3 rounded-lg border p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatCurrency(item.unitPrice)} × {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-7"
                          onClick={() => updateQuantity(item.productId, -1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="size-3" />
                        </Button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-7"
                          onClick={() => updateQuantity(item.productId, 1)}
                        >
                          <Plus className="size-3" />
                        </Button>
                      </div>
                      <div className="text-right min-w-[70px]">
                        <p className="text-sm font-semibold">{formatCurrency(item.total)}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6 text-destructive hover:text-destructive -mt-1"
                          onClick={() => removeFromCart(item.productId)}
                        >
                          <X className="size-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <ShoppingCart className="size-10 mb-2 opacity-40" />
                <p className="text-sm">Carrito vacío</p>
                <p className="text-xs">Busque y agregue productos</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Discount & Payment */}
        <Card>
          <CardContent className="p-4 space-y-3">
            {/* Discount */}
            <div>
              <div className="flex items-center gap-2">
                <Label className="text-xs whitespace-nowrap">Descuento:</Label>
                <div className="flex items-center gap-1 flex-1">
                  <Input
                    type="number"
                    min={0}
                    value={discount || ''}
                    onChange={(e) => {
                      setDiscount(parseFloat(e.target.value) || 0)
                      if (validationErrors['discount']) {
                        setValidationErrors((prev) => { const next = { ...prev }; delete next['discount']; return next })
                      }
                    }}
                    className={`h-8 text-sm ${validationErrors['discount'] ? 'border-destructive' : ''}`}
                    placeholder="0"
                  />
                  <Select value={discountType} onValueChange={(v) => setDiscountType(v as 'percentage' | 'fixed')}>
                    <SelectTrigger className="w-20 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">%</SelectItem>
                      <SelectItem value="fixed">$</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {validationErrors['discount'] && (
                <p className="text-xs text-destructive mt-1 ml-[72px]">{validationErrors['discount']}</p>
              )}
            </div>

            {/* Payment method */}
            <div className="flex items-center gap-2">
              <Label className="text-xs whitespace-nowrap">Pago:</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="flex-1 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="mixto">Mixto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <Input
              placeholder="Notas (opcional)"
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value)
                if (validationErrors['notes']) {
                  setValidationErrors((prev) => { const next = { ...prev }; delete next['notes']; return next })
                }
              }}
              className={`h-8 text-sm ${validationErrors['notes'] ? 'border-destructive' : ''}`}
            />
            {validationErrors['notes'] && (
              <p className="text-xs text-destructive">{validationErrors['notes']}</p>
            )}
          </CardContent>
        </Card>

        {/* Totals */}
        <Card className="border-primary/20 dark:border-primary/80 bg-primary/5 dark:bg-primary/20">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-destructive">
                <span>Descuento:</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            {tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Impuesto:</span>
                <span>{formatCurrency(tax)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
            {validationErrors['total'] && (
              <p className="text-xs text-destructive">{validationErrors['total']}</p>
            )}
            {validationErrors['items'] && (
              <p className="text-xs text-destructive">{validationErrors['items']}</p>
            )}
            <Button
              className="w-full mt-2 bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
              disabled={cart.length === 0 || submitting || Object.keys(validationErrors).some(k => k === 'total' || k === 'discount')}
              onClick={completeSale}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 size-4" />
                  Completar Venta
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <ReceiptDialog />
      <CustomerDialog />
    </div>
  )
}
