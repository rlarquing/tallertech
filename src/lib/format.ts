// ============================================================
// Format Utilities - Safe formatting helpers
// ============================================================

/**
 * Safe currency formatter.
 *
 * Handles null, undefined, NaN, Infinity and non-numeric strings gracefully,
 * returning an em-dash ("—") instead of producing "$NaN" / "US$NaN" output.
 *
 * @example
 * formatCurrency(1234.5)                        // "$1,234.50"
 * formatCurrency(null)                          // "—"
 * formatCurrency(undefined)                     // "—"
 * formatCurrency(NaN)                           // "—"
 * formatCurrency("abc")                         // "—"
 * formatCurrency(1000, { currency: 'ARS' })     // "$1.000,00"  (es-AR)
 */
export function formatCurrency(
  value: number | string | null | undefined,
  options: {
    currency?: string
    locale?: string
    maximumFractionDigits?: number
    minimumFractionDigits?: number
  } = {}
): string {
  const {
    currency = 'USD',
    locale = 'es-CU',
    maximumFractionDigits = 2,
    minimumFractionDigits = 0,
  } = options

  // Coerce strings to numbers
  const num = typeof value === 'string' ? parseFloat(value) : value

  // Guard against null / undefined / NaN / Infinity
  if (num == null || Number.isNaN(num) || !Number.isFinite(num)) {
    return '—'
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits,
      minimumFractionDigits,
    }).format(num)
  } catch {
    // Invalid currency code or locale — fall back to plain number
    return new Intl.NumberFormat(locale, {
      maximumFractionDigits,
      minimumFractionDigits,
    }).format(num)
  }
}

/**
 * Safe number formatter.
 * Returns 0-based string for null/undefined/NaN values.
 */
export function formatNumber(
  value: number | string | null | undefined,
  options: {
    locale?: string
    maximumFractionDigits?: number
  } = {}
): string {
  const { locale = 'es-CU', maximumFractionDigits = 2 } = options
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (num == null || Number.isNaN(num) || !Number.isFinite(num)) {
    return '0'
  }
  return new Intl.NumberFormat(locale, { maximumFractionDigits }).format(num)
}
