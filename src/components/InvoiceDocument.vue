<script setup>
import { computed } from 'vue'

import { formatMoney } from '../utils/format.js'

const props = defineProps({
  invoice: { type: Object, required: true },
  company: { type: Object, required: true },
})

const totals = computed(
  () => props.invoice.totals || computeSafeTotals(props.invoice),
)

// Fallback so the preview always renders live values while editing.
function computeSafeTotals(invoice) {
  const items = invoice.items || []
  const subtotal = items.reduce(
    (sum, it) => sum + (Number(it.qty) || 0) * (Number(it.rate) || 0),
    0,
  )
  const dv = Number(invoice.discount?.value) || 0
  const discount =
    invoice.discount?.type === 'fixed'
      ? Math.min(dv, subtotal)
      : (Math.min(dv, 100) / 100) * subtotal
  const taxable = subtotal - discount
  const vat = invoice.vat?.enabled
    ? (taxable * (Number(invoice.vat.rate) || 0)) / 100
    : 0
  const wht = invoice.wht?.enabled
    ? (taxable * (Number(invoice.wht.rate) || 0)) / 100
    : 0
  return {
    subtotal,
    discount,
    taxable,
    vat,
    wht,
    total: taxable + vat,
    amountDue: taxable + vat - wht,
  }
}

const initials = computed(() => {
  const name = props.company.name || ''
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
})
</script>

<template>
  <article class="invoice-doc">
    <!-- Header -->
    <header class="doc-head">
      <div class="doc-brand">
        <div v-if="company.logo" class="doc-logo">
          <img :src="company.logo" :alt="company.name" />
        </div>
        <div v-else-if="initials" class="doc-logo doc-logo-initials">
          {{ initials }}
        </div>

        <div class="doc-brand-text">
          <h2 class="doc-company">{{ company.name || 'Your Company Name' }}</h2>
          <p v-if="company.slogan" class="doc-slogan">{{ company.slogan }}</p>
          <p v-if="company.address" class="doc-meta">
            {{ [company.address, company.city, company.state].filter(Boolean).join(', ') }}
          </p>
          <p v-if="company.phone || company.email" class="doc-meta">
            <template v-if="company.phone">{{ company.phone }}</template>
            <template v-if="company.phone && company.email"> · </template>
            <template v-if="company.email">{{ company.email }}</template>
          </p>
          <p v-if="company.website" class="doc-meta">{{ company.website }}</p>
          <p v-if="company.rcNumber" class="doc-meta">RC: {{ company.rcNumber }}</p>
          <p v-if="company.tin" class="doc-meta">TIN: {{ company.tin }}</p>
        </div>
      </div>

      <div class="doc-title">
        <div class="doc-word">INVOICE</div>
        <table class="doc-meta-table">
          <tbody>
            <tr>
              <td>Invoice No.</td>
              <td>{{ invoice.number || '—' }}</td>
            </tr>
            <tr>
              <td>Issue Date</td>
              <td>{{ invoice.issueDate || '—' }}</td>
            </tr>
            <tr>
              <td>Due Date</td>
              <td>{{ invoice.dueDate || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </header>

    <!-- Bill to -->
    <section class="doc-parties">
      <div class="doc-party">
        <h3 class="doc-party-title">Invoice To</h3>
        <p class="doc-party-name">
          {{ invoice.client?.name || 'Client name' }}
        </p>
        <p v-if="invoice.client?.address" class="doc-meta">
          {{ invoice.client.address }}
        </p>
        <p
          v-if="invoice.client?.city || invoice.client?.state"
          class="doc-meta"
        >
          {{ [invoice.client.city, invoice.client.state].filter(Boolean).join(', ') }}
        </p>
        <p v-if="invoice.client?.phone" class="doc-meta">
          {{ invoice.client.phone }}
        </p>
        <p v-if="invoice.client?.email" class="doc-meta">
          {{ invoice.client.email }}
        </p>
        <p v-if="invoice.client?.rcNumber" class="doc-meta">
          RC: {{ invoice.client.rcNumber }}
        </p>
        <p v-if="invoice.client?.tin" class="doc-meta">TIN: {{ invoice.client.tin }}</p>
      </div>
    </section>

    <!-- Items -->
    <table class="doc-items">
      <thead>
        <tr>
          <th class="doc-idx">#</th>
          <th>Description</th>
          <th class="doc-num">Qty</th>
          <th class="doc-num">Rate ({{ '\u20a6' }})</th>
          <th class="doc-num">Amount ({{ '\u20a6' }})</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, i) in invoice.items" :key="item.id || i">
          <td class="doc-idx">{{ i + 1 }}</td>
          <td>
            <span v-if="item.description">{{ item.description }}</span>
            <span v-else class="doc-placeholder">Item description</span>
            <span v-if="item.unit" class="doc-unit"> · {{ item.unit }}</span>
          </td>
          <td class="doc-num">{{ item.qty }}</td>
          <td class="doc-num">{{ formatMoney(item.rate) }}</td>
          <td class="doc-num">
            {{ formatMoney((Number(item.qty) || 0) * (Number(item.rate) || 0)) }}
          </td>
        </tr>
        <tr v-if="!invoice.items || invoice.items.length === 0">
          <td colspan="5" class="doc-empty">No items added yet.</td>
        </tr>
      </tbody>
    </table>

    <!-- Totals -->
    <section class="doc-foot">
      <div class="doc-notes">
        <div v-if="invoice.notes">
          <h3>Notes</h3>
          <p>{{ invoice.notes }}</p>
        </div>
        <div v-if="company.bankName || company.bankAccountNumber" class="doc-bank">
          <h3>Payment Details</h3>
          <p><strong>Bank:</strong> {{ company.bankName || '—' }}</p>
          <p>
            <strong>Account Name:</strong>
            {{ company.bankAccountName || company.name || '—' }}
          </p>
          <p>
            <strong>Account Number:</strong>
            {{ company.bankAccountNumber || '—' }}
          </p>
        </div>
      </div>

      <div class="doc-totals">
        <div class="doc-total-row">
          <span>Subtotal</span>
          <span>{{ formatMoney(totals.subtotal) }}</span>
        </div>
        <div v-if="totals.discount > 0" class="doc-total-row">
          <span>Discount</span>
          <span>-{{ formatMoney(totals.discount) }}</span>
        </div>
        <div
          v-if="invoice.vat?.enabled"
          class="doc-total-row"
        >
          <span>VAT ({{ invoice.vat.rate }}%)</span>
          <span>{{ formatMoney(totals.vat) }}</span>
        </div>
        <div
          v-if="invoice.wht?.enabled && totals.wht > 0"
          class="doc-total-row"
        >
          <span>WHT ({{ invoice.wht.rate }}%)</span>
          <span>-{{ formatMoney(totals.wht) }}</span>
        </div>
        <div class="doc-total-row doc-total-main">
          <span>Total</span>
          <span>{{ formatMoney(totals.total) }}</span>
        </div>
        <div class="doc-total-row doc-total-due">
          <span>Amount Due</span>
          <span>{{ formatMoney(totals.amountDue) }}</span>
        </div>
      </div>
    </section>

    <!-- Terms -->
    <footer v-if="invoice.terms" class="doc-terms">
      <h3>Terms &amp; Conditions</h3>
      <p>{{ invoice.terms }}</p>
    </footer>

    <div class="doc-sign">
      <div class="doc-sign-line"></div>
      <p>
        Authorised signature —
        {{ company.name || 'Your Company' }}
      </p>
    </div>
  </article>
</template>

<style scoped>
.invoice-doc {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 34px 36px;
  box-shadow: var(--shadow);
  color: var(--text);
}

.doc-head {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid var(--brand-700);
}

.doc-brand {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  min-width: 0;
}

.doc-logo {
  width: 62px;
  height: 62px;
  border-radius: 10px;
  overflow: hidden;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  background: var(--brand-50);
}

.doc-logo img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.doc-logo-initials {
  background: var(--brand-700);
  color: #fff;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.3rem;
}

.doc-company {
  font-size: 1.2rem;
  font-weight: 800;
}

.doc-slogan {
  font-size: 0.82rem;
  color: var(--muted);
  font-style: italic;
}

.doc-meta {
  font-size: 0.79rem;
  color: var(--muted);
  line-height: 1.55;
  word-break: break-word;
}

.doc-title {
  text-align: right;
  flex-shrink: 0;
}

.doc-word {
  font-family: var(--font-display);
  font-size: 1.7rem;
  font-weight: 800;
  color: var(--brand-700);
  letter-spacing: 0.12em;
  margin-bottom: 8px;
}

.doc-meta-table {
  font-size: 0.8rem;
  margin-left: auto;
  border-collapse: collapse;
}

.doc-meta-table td {
  padding: 1.5px 0 1.5px 16px;
}

.doc-meta-table td:first-child {
  color: var(--muted);
  text-align: left;
}

.doc-meta-table td:last-child {
  font-weight: 600;
  text-align: right;
}

.doc-parties {
  display: flex;
  gap: 32px;
  padding: 18px 0;
}

.doc-party-title {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
  margin-bottom: 4px;
}

.doc-party-name {
  font-weight: 700;
  color: var(--ink);
  font-size: 0.98rem;
  margin-bottom: 2px;
}

.doc-items {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.86rem;
}

.doc-items th {
  background: var(--brand-700);
  color: #fff;
  text-align: left;
  padding: 10px 12px;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.doc-items td {
  padding: 11px 12px;
  border-bottom: 1px solid var(--line);
}

.doc-items tbody tr:nth-child(even) td {
  background: #fafcfb;
}

.doc-num { text-align: right; font-variant-numeric: tabular-nums; }
.doc-idx { width: 34px; color: var(--muted); }

.doc-placeholder { color: #b3c0ba; }
.doc-unit { color: var(--muted); font-size: 0.78rem; }
.doc-empty { text-align: center; color: var(--muted); padding: 22px; }

.doc-foot {
  display: flex;
  justify-content: space-between;
  gap: 28px;
  margin-top: 22px;
  flex-wrap: wrap;
}

.doc-notes {
  flex: 1;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.doc-notes h3,
.doc-terms h3 {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
  margin-bottom: 4px;
}

.doc-notes p,
.doc-terms p {
  font-size: 0.84rem;
  line-height: 1.6;
  white-space: pre-line;
}

.doc-bank {
  background: var(--brand-50);
  border: 1px solid var(--brand-100);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
}

.doc-bank p { font-size: 0.82rem; line-height: 1.7; }

.doc-totals {
  width: 300px;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.doc-total-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 12px;
  font-size: 0.88rem;
}

.doc-total-row span:first-child { color: var(--muted); }
.doc-total-row span:last-child { font-variant-numeric: tabular-nums; font-weight: 600; }

.doc-total-main {
  border-top: 1px solid var(--line-strong);
  margin-top: 4px;
  padding-top: 10px;
}

.doc-total-main span { color: var(--ink) !important; font-weight: 700 !important; }

.doc-total-due {
  background: var(--brand-700);
  color: #fff;
  border-radius: var(--radius-sm);
  margin-top: 6px;
  padding: 11px 12px;
}

.doc-total-due span { color: #fff !important; font-weight: 800 !important; font-size: 1rem; }

.doc-terms {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
}

.doc-sign {
  margin-top: 34px;
  width: 240px;
}

.doc-sign-line {
  border-bottom: 1px solid var(--line-strong);
  margin-bottom: 6px;
}

.doc-sign p {
  font-size: 0.78rem;
  color: var(--muted);
}

@media (max-width: 640px) {
  .invoice-doc { padding: 22px 18px; }
  .doc-head { flex-direction: column; }
  .doc-title { text-align: left; }
  .doc-meta-table { margin-left: 0; }
  .doc-totals { width: 100%; }
}

@media print {
  .invoice-doc { border: 0; box-shadow: none; }
}
</style>
