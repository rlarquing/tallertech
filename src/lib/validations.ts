import { z } from 'zod'

// ============================================================
// Shared regex patterns
// ============================================================

const phoneRegex = /^[+]?[\d\s\-]{6,30}$/
const skuRegex = /^[a-zA-Z0-9\-]*$/
const dniRegex = /^[a-zA-Z0-9]*$/
const imeiRegex = /^\d{15}$/

// ============================================================
// Helper: optional string that also allows empty string
// In Zod v4, we use a union to accept string | undefined | ""
// ============================================================

function optionalString(maxLen: number, maxMessage: string) {
  return z.union([
    z.string().max(maxLen, { message: maxMessage }),
    z.literal(''),
  ]).optional()
}

function optionalStringWithValidation(
  maxLen: number,
  maxMessage: string,
  validation: { regex: RegExp; message: string }
) {
  return z.union([
    z.string().max(maxLen, { message: maxMessage }).regex(validation.regex, { message: validation.message }),
    z.literal(''),
  ]).optional()
}

function optionalEmail(maxMessage: string, emailMessage: string) {
  return z.union([
    z.string().max(254, { message: maxMessage }).email({ message: emailMessage }),
    z.literal(''),
  ]).optional()
}

// ============================================================
// 1. Auth Schemas
// ============================================================

export const loginSchema = z.object({
  email: z.string({ message: 'El email es requerido' })
    .min(1, { message: 'El email es requerido' })
    .email({ message: 'Formato de email inválido' }),
  password: z.string({ message: 'La contraseña es requerida' })
    .min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
})

export const registerSchema = z.object({
  email: z.string({ message: 'El email es requerido' })
    .min(1, { message: 'El email es requerido' })
    .email({ message: 'Formato de email inválido' }),
  password: z.string({ message: 'La contraseña es requerida' })
    .min(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
    .regex(/[A-Z]/, { message: 'La contraseña debe contener al menos una letra mayúscula' })
    .regex(/[0-9]/, { message: 'La contraseña debe contener al menos un número' }),
  name: z.string({ message: 'El nombre es requerido' })
    .min(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    .max(100, { message: 'El nombre no puede exceder 100 caracteres' }),
})

/** Combined auth schema for convenience */
export const authSchema = z.union([loginSchema, registerSchema])

// ============================================================
// 2. Product Schema
// ============================================================

export const productSchema = z.object({
  name: z.string({ message: 'El nombre es requerido' })
    .min(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    .max(150, { message: 'El nombre no puede exceder 150 caracteres' }),
  sku: optionalStringWithValidation(
    30,
    'El SKU no puede exceder 30 caracteres',
    { regex: skuRegex, message: 'El SKU solo puede contener letras, números y guiones' }
  ),
  description: optionalString(500, 'La descripción no puede exceder 500 caracteres'),
  costPrice: z.number({ message: 'El precio de costo debe ser un número' })
    .min(0, { message: 'El precio de costo no puede ser negativo' })
    .max(99999999, { message: 'El precio de costo no puede exceder 99,999,999' }),
  salePrice: z.number({ message: 'El precio de venta debe ser un número' })
    .min(0, { message: 'El precio de venta no puede ser negativo' })
    .max(99999999, { message: 'El precio de venta no puede exceder 99,999,999' }),
  quantity: z.number({ message: 'La cantidad debe ser un número' })
    .int({ message: 'La cantidad debe ser un número entero' })
    .min(0, { message: 'La cantidad no puede ser negativa' })
    .max(999999, { message: 'La cantidad no puede exceder 999,999' }),
  minStock: z.number({ message: 'El stock mínimo debe ser un número' })
    .int({ message: 'El stock mínimo debe ser un número entero' })
    .min(0, { message: 'El stock mínimo no puede ser negativo' })
    .max(99999, { message: 'El stock mínimo no puede exceder 99,999' }),
  type: z.enum(['product', 'service', 'part'], {
    message: 'Tipo de producto inválido',
  }),
  unit: z.string({ message: 'La unidad es requerida' })
    .max(20, { message: 'La unidad no puede exceder 20 caracteres' }),
  brand: optionalString(80, 'La marca no puede exceder 80 caracteres'),
  model: optionalString(80, 'El modelo no puede exceder 80 caracteres'),
  location: optionalString(100, 'La ubicación no puede exceder 100 caracteres'),
  categoryId: z.string().optional(),
  supplierId: z.string().optional(),
}).refine(
  (data) => data.salePrice >= data.costPrice,
  {
    message: 'El precio de venta debe ser mayor o igual al precio de costo',
    path: ['salePrice'],
  }
)

// ============================================================
// 3. Stock Adjustment Schema
// ============================================================

export const stockAdjustmentSchema = z.object({
  type: z.enum(['in', 'out', 'adjustment', 'return'], {
    message: 'Tipo de movimiento inválido',
  }),
  quantity: z.number({ message: 'La cantidad debe ser un número' })
    .int({ message: 'La cantidad debe ser un número entero' })
    .gt(0, { message: 'La cantidad debe ser mayor a 0' })
    .max(999999, { message: 'La cantidad no puede exceder 999,999' }),
  reason: optionalString(200, 'La razón no puede exceder 200 caracteres'),
})

// ============================================================
// 4. Customer Schema
// ============================================================

export const customerSchema = z.object({
  name: z.string({ message: 'El nombre es requerido' })
    .min(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    .max(150, { message: 'El nombre no puede exceder 150 caracteres' }),
  phone: optionalStringWithValidation(
    30,
    'El teléfono no puede exceder 30 caracteres',
    { regex: phoneRegex, message: 'Formato de teléfono inválido (solo dígitos, espacios, guiones y +)' }
  ),
  email: optionalEmail('El email no puede exceder 254 caracteres', 'Formato de email inválido'),
  address: optionalString(200, 'La dirección no puede exceder 200 caracteres'),
  dni: optionalStringWithValidation(
    20,
    'El DNI no puede exceder 20 caracteres',
    { regex: dniRegex, message: 'El DNI solo puede contener letras y números' }
  ),
  notes: optionalString(500, 'Las notas no pueden exceder 500 caracteres'),
})

// ============================================================
// 5. Supplier Schema
// ============================================================

export const supplierSchema = z.object({
  name: z.string({ message: 'El nombre es requerido' })
    .min(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    .max(150, { message: 'El nombre no puede exceder 150 caracteres' }),
  phone: optionalStringWithValidation(
    30,
    'El teléfono no puede exceder 30 caracteres',
    { regex: phoneRegex, message: 'Formato de teléfono inválido (solo dígitos, espacios, guiones y +)' }
  ),
  email: optionalEmail('El email no puede exceder 254 caracteres', 'Formato de email inválido'),
  address: optionalString(200, 'La dirección no puede exceder 200 caracteres'),
  notes: optionalString(500, 'Las notas no pueden exceder 500 caracteres'),
})

// ============================================================
// 6. Category Schema
// ============================================================

export const categorySchema = z.object({
  name: z.string({ message: 'El nombre es requerido' })
    .min(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    .max(80, { message: 'El nombre no puede exceder 80 caracteres' }),
  description: optionalString(300, 'La descripción no puede exceder 300 caracteres'),
  type: z.enum(['product', 'service', 'part'], {
    message: 'Tipo de categoría inválido',
  }),
})

// ============================================================
// 7. Repair Schema (Create)
// ============================================================

export const repairSchema = z.object({
  customerId: z.string({ message: 'El cliente es requerido' })
    .min(1, { message: 'Debe seleccionar un cliente' }),
  device: z.string({ message: 'El dispositivo es requerido' })
    .min(2, { message: 'El dispositivo debe tener al menos 2 caracteres' })
    .max(150, { message: 'El dispositivo no puede exceder 150 caracteres' }),
  brand: optionalString(80, 'La marca no puede exceder 80 caracteres'),
  imei: z.union([
    z.string().regex(imeiRegex, { message: 'El IMEI debe tener exactamente 15 dígitos' }),
    z.literal(''),
  ]).optional(),
  issue: z.string({ message: 'El problema reportado es requerido' })
    .min(3, { message: 'El problema debe tener al menos 3 caracteres' })
    .max(500, { message: 'El problema no puede exceder 500 caracteres' }),
  priority: z.enum(['low', 'normal', 'high', 'urgent'], {
    message: 'Prioridad inválida',
  }),
  costEstimate: z.number({ message: 'El costo estimado debe ser un número' })
    .min(0, { message: 'El costo estimado no puede ser negativo' })
    .max(99999999, { message: 'El costo estimado no puede exceder 99,999,999' }),
  paymentMethod: z.enum(['efectivo', 'transferencia', 'mixto'], {
    message: 'Método de pago inválido',
  }),
})

// ============================================================
// 8. Repair Update Schema
// ============================================================

export const repairUpdateSchema = z.object({
  diagnosis: z.string()
    .max(500, { message: 'El diagnóstico no puede exceder 500 caracteres' })
    .optional(),
  solution: z.string()
    .max(500, { message: 'La solución no puede exceder 500 caracteres' })
    .optional(),
  status: z.enum(['received', 'diagnosing', 'waiting_parts', 'repairing', 'ready', 'delivered', 'cancelled'], {
    message: 'Estado inválido',
  }).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent'], {
    message: 'Prioridad inválida',
  }).optional(),
  laborCost: z.number({ message: 'El costo de mano de obra debe ser un número' })
    .min(0, { message: 'El costo de mano de obra no puede ser negativo' })
    .max(99999999, { message: 'El costo de mano de obra no puede exceder 99,999,999' })
    .optional(),
  partsCost: z.number({ message: 'El costo de piezas debe ser un número' })
    .min(0, { message: 'El costo de piezas no puede ser negativo' })
    .max(99999999, { message: 'El costo de piezas no puede exceder 99,999,999' })
    .optional(),
  totalCost: z.number({ message: 'El costo total debe ser un número' })
    .min(0, { message: 'El costo total no puede ser negativo' })
    .max(99999999, { message: 'El costo total no puede exceder 99,999,999' })
    .optional(),
  paymentMethod: z.enum(['efectivo', 'transferencia', 'mixto'], {
    message: 'Método de pago inválido',
  }).optional(),
})

// ============================================================
// 9. Repair Part Schema
// ============================================================

export const repairPartSchema = z.object({
  productId: z.string({ message: 'El producto es requerido' })
    .min(1, { message: 'Debe seleccionar un producto' }),
  name: z.string({ message: 'El nombre es requerido' })
    .min(1, { message: 'El nombre es requerido' })
    .max(150, { message: 'El nombre no puede exceder 150 caracteres' }),
  quantity: z.number({ message: 'La cantidad debe ser un número' })
    .int({ message: 'La cantidad debe ser un número entero' })
    .gt(0, { message: 'La cantidad debe ser mayor a 0' })
    .max(9999, { message: 'La cantidad no puede exceder 9,999' }),
  unitPrice: z.number({ message: 'El precio unitario debe ser un número' })
    .min(0, { message: 'El precio unitario no puede ser negativo' })
    .max(99999999, { message: 'El precio unitario no puede exceder 99,999,999' }),
})

// ============================================================
// 10. Expense Schema
// ============================================================

export const expenseSchema = z.object({
  category: z.enum(['supplies', 'rent', 'salary', 'utilities', 'other'], {
    message: 'Categoría de gasto inválida',
  }),
  description: z.string({ message: 'La descripción es requerida' })
    .min(2, { message: 'La descripción debe tener al menos 2 caracteres' })
    .max(300, { message: 'La descripción no puede exceder 300 caracteres' }),
  amount: z.number({ message: 'El monto debe ser un número' })
    .gt(0, { message: 'El monto debe ser mayor a 0' })
    .max(99999999, { message: 'El monto no puede exceder 99,999,999' }),
  date: z.string({ message: 'La fecha es requerida' })
    .refine(
      (val) => !isNaN(Date.parse(val)),
      { message: 'Fecha inválida' }
    )
    .refine(
      (val) => new Date(val) <= new Date(),
      { message: 'La fecha no puede ser futura' }
    ),
  notes: optionalString(500, 'Las notas no pueden exceder 500 caracteres'),
})

// ============================================================
// 11. Sale Item Schema
// ============================================================

export const saleItemSchema = z.object({
  productId: z.string().optional(),
  name: z.string({ message: 'El nombre es requerido' })
    .min(1, { message: 'El nombre es requerido' })
    .max(150, { message: 'El nombre no puede exceder 150 caracteres' }),
  quantity: z.number({ message: 'La cantidad debe ser un número' })
    .int({ message: 'La cantidad debe ser un número entero' })
    .gt(0, { message: 'La cantidad debe ser mayor a 0' })
    .max(9999, { message: 'La cantidad no puede exceder 9,999' }),
  unitPrice: z.number({ message: 'El precio unitario debe ser un número' })
    .min(0, { message: 'El precio unitario no puede ser negativo' })
    .max(99999999, { message: 'El precio unitario no puede exceder 99,999,999' }),
  type: z.enum(['product', 'service', 'part'], {
    message: 'Tipo de item inválido',
  }),
})

// ============================================================
// 12. Sale Schema
// ============================================================

export const saleSchema = z.object({
  customerId: z.string().optional(),
  paymentMethod: z.enum(['efectivo', 'transferencia', 'mixto'], {
    message: 'Método de pago inválido',
  }),
  discount: z.number({ message: 'El descuento debe ser un número' })
    .min(0, { message: 'El descuento no puede ser negativo' })
    .max(100, { message: 'El descuento no puede exceder 100%' }),
  notes: optionalString(500, 'Las notas no pueden exceder 500 caracteres'),
  items: z.array(saleItemSchema)
    .min(1, { message: 'La venta debe tener al menos un item' }),
})

// ============================================================
// 13. Workshop Schema
// ============================================================

export const workshopSchema = z.object({
  name: z.string({ message: 'El nombre es requerido' })
    .min(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    .max(150, { message: 'El nombre no puede exceder 150 caracteres' }),
  description: optionalString(500, 'La descripción no puede exceder 500 caracteres'),
  address: optionalString(200, 'La dirección no puede exceder 200 caracteres'),
  phone: optionalStringWithValidation(
    30,
    'El teléfono no puede exceder 30 caracteres',
    { regex: phoneRegex, message: 'Formato de teléfono inválido (solo dígitos, espacios, guiones y +)' }
  ),
  email: optionalEmail('El email no puede exceder 254 caracteres', 'Formato de email inválido'),
  currency: z.enum(['USD', 'CUP', 'MLC', 'EUR', 'ARS'], {
    message: 'Moneda inválida',
  }),
  timezone: z.string()
    .max(50, { message: 'La zona horaria no puede exceder 50 caracteres' }),
})

// ============================================================
// 14. Settings Schema
// ============================================================

export const settingsSchema = z.object({
  shop_name: z.string({ message: 'El nombre del taller es requerido' })
    .min(1, { message: 'El nombre del taller es requerido' })
    .max(150, { message: 'El nombre no puede exceder 150 caracteres' }),
  shop_phone: optionalStringWithValidation(
    30,
    'El teléfono no puede exceder 30 caracteres',
    { regex: phoneRegex, message: 'Formato de teléfono inválido (solo dígitos, espacios, guiones y +)' }
  ),
  shop_address: optionalString(200, 'La dirección no puede exceder 200 caracteres'),
  shop_email: optionalEmail('El email no puede exceder 254 caracteres', 'Formato de email inválido'),
  currency: z.string()
    .max(10, { message: 'La moneda no puede exceder 10 caracteres' }),
  tax_rate: z.number({ message: 'La tasa de impuesto debe ser un número' })
    .min(0, { message: 'La tasa de impuesto no puede ser negativa' })
    .max(100, { message: 'La tasa de impuesto no puede exceder 100%' }),
  receipt_footer: optionalString(300, 'El pie del recibo no puede exceder 300 caracteres'),
})

// ============================================================
// 15. Password Change Schema
// ============================================================

export const passwordChangeSchema = z.object({
  currentPassword: z.string({ message: 'La contraseña actual es requerida' })
    .min(6, { message: 'La contraseña actual debe tener al menos 6 caracteres' }),
  newPassword: z.string({ message: 'La nueva contraseña es requerida' })
    .min(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres' })
    .regex(/[A-Z]/, { message: 'La nueva contraseña debe contener al menos una letra mayúscula' })
    .regex(/[0-9]/, { message: 'La nueva contraseña debe contener al menos un número' }),
  confirmPassword: z.string({ message: 'La confirmación de contraseña es requerida' }),
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  }
)

// ============================================================
// 16. Daily Closing Schema
// ============================================================

export const dailyClosingSchema = z.object({
  workshopId: z.string({ message: 'El taller es requerido' })
    .min(1, { message: 'Debe seleccionar un taller' }),
  date: z.string({ message: 'La fecha es requerida' })
    .refine(
      (val) => !isNaN(Date.parse(val)),
      { message: 'Fecha inválida' }
    ),
  notes: optionalString(500, 'Las notas no pueden exceder 500 caracteres'),
})

// ============================================================
// 17. Close Daily Closing Schema
// ============================================================

export const closeDailyClosingSchema = z.object({
  notes: optionalString(500, 'Las notas no pueden exceder 500 caracteres'),
})

// ============================================================
// Type Exports
// ============================================================

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ProductInput = z.infer<typeof productSchema>
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>
export type CustomerInput = z.infer<typeof customerSchema>
export type SupplierInput = z.infer<typeof supplierSchema>
export type CategoryInput = z.infer<typeof categorySchema>
export type RepairInput = z.infer<typeof repairSchema>
export type RepairUpdateInput = z.infer<typeof repairUpdateSchema>
export type RepairPartInput = z.infer<typeof repairPartSchema>
export type ExpenseInput = z.infer<typeof expenseSchema>
export type SaleItemInput = z.infer<typeof saleItemSchema>
export type SaleInput = z.infer<typeof saleSchema>
export type WorkshopInput = z.infer<typeof workshopSchema>
export type SettingsInput = z.infer<typeof settingsSchema>
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>
export type DailyClosingInput = z.infer<typeof dailyClosingSchema>
export type CloseDailyClosingInput = z.infer<typeof closeDailyClosingSchema>

// ============================================================
// Helper: Get field error from Zod error tree
// ============================================================

export function getFieldError<T>(errors: Record<string, any>, path: string): string | undefined {
  const parts = path.split('.')
  let current = errors
  for (const part of parts) {
    current = current?.[part]
    if (!current) return undefined
  }
  return current?.message
}

// ============================================================
// Server-side validation helper
// Validates data against a Zod schema and returns either
// the validated data or throws with formatted error messages.
// ============================================================

export function validateWithSchema<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
): z.infer<T> {
  const result = schema.safeParse(data)
  if (result.success) {
    return result.data
  }

  // Format all validation errors into a single message
  const errorMessages = result.error.issues.map((issue) => {
    const field = issue.path.join('.')
    return field ? `${field}: ${issue.message}` : issue.message
  })

  throw new Error(
    `VALIDATION_ERROR:${JSON.stringify({
      errors: result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
      message: errorMessages.join('; '),
    })}`,
  )
}

/**
 * Parse a validation error thrown by validateWithSchema.
 * Returns structured error info or null if not a validation error.
 */
export function parseValidationError(error: unknown): {
  errors: Array<{ field: string; message: string }>
  message: string
} | null {
  if (error instanceof Error && error.message.startsWith('VALIDATION_ERROR:')) {
    try {
      return JSON.parse(error.message.slice('VALIDATION_ERROR:'.length))
    } catch {
      return null
    }
  }
  return null
}
