// Formatting helpers: Naira currency, dates, rounding and invoice totals.

const moneyFmt = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const plainFmt = new Intl.NumberFormat('en-NG', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export function formatMoney(value) {
  const n = Number(value)
  return moneyFmt.format(Number.isFinite(n) ? n : 0)
}

export function formatAmount(value) {
  const n = Number(value)
  return plainFmt.format(Number.isFinite(n) ? n : 0)
}

export function formatDate(iso) {
  if (!iso) return '—'
  const date = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso)
  if (Number.isNaN(date.getTime())) return '—'
  return dateFmt.format(date)
}

export function todayISO() {
  return toISODate(new Date())
}

export function toISODate(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function addDaysISO(iso, days) {
  const base = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(base.getTime())) return iso
  base.setDate(base.getDate() + days)
  return toISODate(base)
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/**
 * Compute all monetary totals for an invoice.
 *
 * Nigerian convention: VAT (7.5%) is added on top of the taxable amount,
 * while WHT (withholding tax) is deducted at source by the client, so it
 * reduces the final amount due.
 */
export function computeTotals(invoice) {
  const items = invoice.items || []
  const subtotal = round2(
    items.reduce(
      (sum, item) => sum + (Number(item.qty) || 0) * (Number(item.rate) || 0),
      0,
    ),
  )

  const discountValue = Number(invoice.discount?.value) || 0
  let discount = 0
  if (invoice.discount?.type === 'fixed') {
    discount = round2(Math.min(Math.max(discountValue, 0), subtotal))
  } else if (discountValue > 0) {
    discount = round2((Math.min(discountValue, 100) / 100) * subtotal)
  }

  const taxable = round2(subtotal - discount)

  const vat = invoice.vat?.enabled
    ? round2((taxable * (Number(invoice.vat.rate) || 0)) / 100)
    : 0

  const wht = invoice.wht?.enabled
    ? round2((taxable * (Number(invoice.wht.rate) || 0)) / 100)
    : 0

  const total = round2(taxable + vat)
  const amountDue = round2(total - wht)

  return { subtotal, discount, taxable, vat, wht, total, amountDue }
}

/**
 * Effective status — a "sent" invoice past its due date displays as "overdue".
 */
export function effectiveStatus(invoice) {
  if (
    invoice.status === 'sent' &&
    invoice.dueDate &&
    invoice.dueDate < todayISO()
  ) {
    return 'overdue'
  }
  return invoice.status || 'draft'
}

export const STATUS_META = {
  draft: { label: 'Draft', class: 'badge-draft' },
  sent: { label: 'Sent', class: 'badge-sent' },
  overdue: { label: 'Overdue', class: 'badge-overdue' },
  paid: { label: 'Paid', class: 'badge-paid' },
}
