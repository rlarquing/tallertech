// ============================================================
// Export Service Infrastructure - PDF, CSV, Excel generation
// Clean Architecture: Infrastructure Layer - Services
// ============================================================

import { prisma } from '../persistence/prisma/prisma-client'

type ExportFormat = 'pdf' | 'csv' | 'xlsx'

export interface ExportParams {
  format: ExportFormat
  entity: string
  dateFrom?: string
  dateTo?: string
  filters?: Record<string, string>
}

// ─── Data Fetching ───────────────────────────────────────────────

async function fetchExportData(entity: string, params: ExportParams) {
  const dateFilter: Record<string, unknown> = {}
  if (params.dateFrom || params.dateTo) {
    dateFilter.createdAt = {}
    if (params.dateFrom)
      (dateFilter.createdAt as Record<string, unknown>).gte = new Date(params.dateFrom)
    if (params.dateTo)
      (dateFilter.createdAt as Record<string, unknown>).lte = new Date(params.dateTo)
  }

  switch (entity) {
    case 'sales': {
      const where = { ...dateFilter, status: { not: 'cancelled' } }
      const sales = await prisma.sale.findMany({
        where,
        include: { items: true, customer: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      })
      return sales.map((s) => ({
        'Código': s.code,
        'Cliente': s.customer?.name || 'General',
        'Subtotal': s.subtotal,
        'Descuento': s.discount,
        'Impuesto': s.tax,
        'Total': s.total,
        'Método Pago': s.paymentMethod,
        'Estado': s.status,
        'Fecha': s.createdAt.toLocaleDateString('es-BO'),
        'Cantidad Items': s.items.length,
      }))
    }
    case 'products': {
      const where = { active: true }
      const products = await prisma.product.findMany({
        where,
        include: {
          category: { select: { name: true } },
          supplier: { select: { name: true } },
        },
        orderBy: { name: 'asc' },
      })
      return products.map((p) => ({
        'Nombre': p.name,
        'SKU': p.sku || '',
        'Categoría': p.category?.name || '',
        'Proveedor': p.supplier?.name || '',
        'Precio Costo': p.costPrice,
        'Precio Venta': p.salePrice,
        'Stock': p.quantity,
        'Stock Mínimo': p.minStock,
        'Marca': p.brand || '',
        'Modelo': p.model || '',
        'Tipo': p.type,
        'Ubicación': p.location || '',
      }))
    }
    case 'repairs': {
      const repairs = await prisma.repairOrder.findMany({
        where: dateFilter,
        include: { customer: { select: { name: true } }, parts: true },
        orderBy: { createdAt: 'desc' },
      })
      return repairs.map((r) => ({
        'Código': r.code,
        'Cliente': r.customer?.name || '',
        'Dispositivo': r.device,
        'Marca': r.brand || '',
        'IMEI': r.imei || '',
        'Problema': r.issue,
        'Diagnóstico': r.diagnosis || '',
        'Estado': r.status,
        'Prioridad': r.priority,
        'Costo Estimado': r.costEstimate,
        'Mano de Obra': r.laborCost,
        'Costo Repuestos': r.partsCost,
        'Total': r.totalCost,
        'Pagado': r.paid ? 'Sí' : 'No',
        'Fecha Recepción': r.receivedAt.toLocaleDateString('es-BO'),
      }))
    }
    case 'customers': {
      const customers = await prisma.customer.findMany({
        where: { active: true },
        orderBy: { name: 'asc' },
      })
      return customers.map((c) => ({
        'Nombre': c.name,
        'Teléfono': c.phone || '',
        'Email': c.email || '',
        'Dirección': c.address || '',
        'DNI': c.dni || '',
        'Notas': c.notes || '',
        'Fecha Registro': c.createdAt.toLocaleDateString('es-BO'),
      }))
    }
    case 'expenses': {
      const expenses = await prisma.expense.findMany({
        where: dateFilter,
        orderBy: { date: 'desc' },
      })
      return expenses.map((e) => ({
        'Categoría': e.category,
        'Descripción': e.description,
        'Monto': e.amount,
        'Usuario': e.userName,
        'Fecha': e.date.toLocaleDateString('es-BO'),
        'Notas': e.notes || '',
      }))
    }
    case 'stock': {
      const movements = await prisma.stockMovement.findMany({
        where: dateFilter,
        include: { product: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      })
      return movements.map((m) => ({
        'Producto': m.product?.name || '',
        'Tipo': m.type,
        'Cantidad': m.quantity,
        'Razón': m.reason || '',
        'Referencia': m.reference || '',
        'Usuario': m.userName,
        'Fecha': m.createdAt.toLocaleDateString('es-BO'),
      }))
    }
    default:
      return []
  }
}

// ─── CSV Generation ──────────────────────────────────────────────

function generateCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return ''

  const headers = Object.keys(data[0])
  const csvRows = [headers.join(',')]

  for (const row of data) {
    const values = headers.map((h) => {
      const val = String(row[h] ?? '')
      // Escape CSV values
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`
      }
      return val
    })
    csvRows.push(values.join(','))
  }

  return csvRows.join('\n')
}

// ─── Excel Generation ────────────────────────────────────────────

async function generateXLSX(
  data: Record<string, unknown>[],
  entity: string
): Promise<Buffer> {
  const XLSX = await import('xlsx')
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()

  // Auto-size columns
  if (data.length > 0) {
    const headers = Object.keys(data[0])
    const colWidths = headers.map((h) => {
      const maxLen = Math.max(
        h.length,
        ...data.slice(0, 100).map((row) => String(row[h] ?? '').length)
      )
      return { wch: Math.min(maxLen + 2, 50) }
    })
    worksheet['!cols'] = colWidths
  }

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    entity.charAt(0).toUpperCase() + entity.slice(1)
  )
  const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  return Buffer.from(buf)
}

// ─── PDF Generation ──────────────────────────────────────────────

async function generatePDF(
  data: Record<string, unknown>[],
  entity: string
): Promise<Buffer> {
  const PDFDocument = (await import('pdfkit')).default
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' })
  const chunks: Buffer[] = []

  return new Promise((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    // Title
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
    doc.text(`TallerTech - Reporte de ${getEntityLabel(entity)}`, { align: 'center' })
    doc
      .fontSize(10)
      .font('Helvetica')
    doc.text(
      `Generado: ${new Date().toLocaleDateString('es-BO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
      { align: 'center' }
    )
    doc.moveDown(1.5)

    if (data.length === 0) {
      doc.fontSize(12).text('No hay datos para exportar.', { align: 'center' })
      doc.end()
      return
    }

    const headers = Object.keys(data[0])
    const headerLabels = headers
    const pageWidth = doc.page.width - 80
    const colWidth = Math.min(pageWidth / headers.length, 150)
    const startX = 40
    let y = doc.y

    // Check if we need pagination
    const rowHeight = 20
    const headerHeight = 25
    const maxRowsPerPage = Math.floor(
      (doc.page.height - y - 60) / rowHeight
    )

    let rowIndex = 0
    let pageNum = 1

    while (rowIndex < data.length) {
      // Draw header
      doc.rect(startX, y, pageWidth, headerHeight).fill('#059669')
      let x = startX
      for (const label of headerLabels) {
        doc
          .fontSize(7)
          .font('Helvetica-Bold')
          .fillColor('white')
        const truncatedLabel =
          label.length > 18 ? label.substring(0, 16) + '..' : label
        doc.text(truncatedLabel, x + 3, y + 7, {
          width: colWidth - 6,
          lineBreak: false,
        })
        x += colWidth
      }
      y += headerHeight

      // Draw rows
      const pageRows = Math.min(maxRowsPerPage, data.length - rowIndex)
      for (let i = 0; i < pageRows; i++) {
        const row = data[rowIndex]
        const bgColor = rowIndex % 2 === 0 ? '#f9fafb' : '#ffffff'
        doc.rect(startX, y, pageWidth, rowHeight).fill(bgColor)

        x = startX
        for (const header of headers) {
          doc.fontSize(7).font('Helvetica').fillColor('#374151')
          const val = String(row[header] ?? '')
          const truncated = val.length > 22 ? val.substring(0, 20) + '..' : val
          doc.text(truncated, x + 3, y + 5, {
            width: colWidth - 6,
            lineBreak: false,
          })
          x += colWidth
        }
        y += rowHeight
        rowIndex++
      }

      // Page footer
      doc.fontSize(8).font('Helvetica').fillColor('#9ca3af')
      doc.text(
        `Página ${pageNum} | ${data.length} registros`,
        startX,
        doc.page.height - 40,
        { width: pageWidth, align: 'center' }
      )

      // New page if needed
      if (rowIndex < data.length) {
        doc.addPage({ size: 'A4', layout: 'landscape', margin: 40 })
        y = 40
        pageNum++
      }
    }

    doc.end()
  })
}

function getEntityLabel(entity: string): string {
  const labels: Record<string, string> = {
    sales: 'Ventas',
    products: 'Productos',
    repairs: 'Reparaciones',
    customers: 'Clientes',
    expenses: 'Gastos',
    stock: 'Movimientos de Stock',
  }
  return labels[entity] || entity
}

// ─── Main Export Function ────────────────────────────────────────

export async function exportData(params: ExportParams): Promise<{
  buffer: Buffer
  contentType: string
  filename: string
}> {
  const data = (await fetchExportData(
    params.entity,
    params
  )) as Record<string, unknown>[]

  const entityLabel = getEntityLabel(params.entity)
  const dateStr = new Date().toISOString().split('T')[0]

  switch (params.format) {
    case 'csv': {
      const csv = generateCSV(data)
      return {
        buffer: Buffer.from(csv, 'utf-8'),
        contentType: 'text/csv; charset=utf-8',
        filename: `TallerTech_${entityLabel}_${dateStr}.csv`,
      }
    }
    case 'xlsx': {
      const buffer = await generateXLSX(data, params.entity)
      return {
        buffer,
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: `TallerTech_${entityLabel}_${dateStr}.xlsx`,
      }
    }
    case 'pdf': {
      const buffer = await generatePDF(data, params.entity)
      return {
        buffer,
        contentType: 'application/pdf',
        filename: `TallerTech_${entityLabel}_${dateStr}.pdf`,
      }
    }
    default:
      throw new Error(`Unsupported format: ${params.format}`)
  }
}
