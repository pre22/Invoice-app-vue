<script setup>
import { computed, ref } from 'vue'

import { formatMoney } from '../utils/format.js'
import { useAppStore } from '../stores/appStore.js'

import InvoiceDocument from '../components/InvoiceDocument.vue'
import StatusBadge from '../components/StatusBadge.vue'

const props = defineProps({
  id: { type: String, required: true },
})

const store = useAppStore()
const invoice = computed(() => store.getInvoice(props.id))

const showDelete = ref(false)

function print() {
  window.print()
}

function markPaid() {
  store.setInvoiceStatus(props.id, 'paid')
}

function markSent() {
  store.setInvoiceStatus(props.id, 'sent')
}

function duplicate() {
  const copy = store.duplicateInvoice(props.id)
  if (copy) window.location.assign(`/invoice/${copy.id}/edit`)
}

function remove() {
  store.deleteInvoice(props.id)
  window.location.assign('/invoices')
}
</script>

<template>
  <div>
    <!-- Unknown invoice -->
    <div v-if="!invoice" class="empty-state">
      <div class="art">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5m0 3.5v.01" />
        </svg>
      </div>
      <h3>Invoice not found</h3>
      <p>This invoice may have been deleted, or the link is incorrect.</p>
      <router-link class="btn btn-primary" to="/invoices">Back to invoices</router-link>
    </div>

    <template v-else>
      <header class="page-head no-print">
        <div>
          <div class="row" style="gap: 12px">
            <h1>{{ invoice.number }}</h1>
            <StatusBadge :invoice="invoice" />
          </div>
          <p class="subtitle">
            {{ invoice.client?.name || 'No client' }} ·
            Issued {{ invoice.issueDate }} · Due {{ invoice.dueDate }}
          </p>
        </div>

        <div class="row">
          <router-link class="btn btn-secondary" to="/invoices">Back</router-link>
          <router-link class="btn btn-secondary" :to="`/invoice/${id}/edit`">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7.5 18.5 3 20l1.5-4.5L16.5 3.5Z" />
            </svg>
            Edit
          </router-link>
          <button class="btn btn-secondary" @click="duplicate">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="12" height="12" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Duplicate
          </button>
          <button v-if="invoice.status === 'draft'" class="btn btn-secondary" @click="markSent">
            Mark as sent
          </button>
          <button v-if="invoice.status !== 'paid'" class="btn btn-primary" @click="markPaid">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.7-9.3a1 1 0 0 0-1.4-1.4L9 10.6 7.7 9.3a1 1 0 0 0-1.4 1.4l2 2a1 1 0 0 0 1.4 0l4-4Z"
                clip-rule="evenodd"
              />
            </svg>
            Mark as paid
          </button>
          <button class="btn btn-secondary" @click="print">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <path d="M6 14h12v8H6v-8Z" />
            </svg>
            Print / PDF
          </button>
          <button class="btn btn-danger" @click="showDelete = true">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M8.7 3.3a1 1 0 0 1 1.4 0l.6.6H16a1 1 0 1 1 0 2h-.6l-.7 9.3a2 2 0 0 1-2 1.9H9.3a2 2 0 0 1-2-1.9L6.6 7.9H6a1 1 0 1 1 0-2h3.3l.4-.6Z"
                clip-rule="evenodd"
              />
            </svg>
            Delete
          </button>
        </div>
      </header>

      <!-- Summary strip -->
      <div class="summary-strip no-print">
        <div>
          <span>Total</span>
          <strong>{{ formatMoney(invoice.totals?.total ?? 0) }}</strong>
        </div>
        <div>
          <span>Amount Due</span>
          <strong class="due">{{ formatMoney(invoice.totals?.amountDue ?? 0) }}</strong>
        </div>
        <div v-if="invoice.totals?.vat">
          <span>VAT ({{ invoice.vat.rate }}%)</span>
          <strong>{{ formatMoney(invoice.totals.vat) }}</strong>
        </div>
        <div v-if="invoice.totals?.wht">
          <span>WHT ({{ invoice.wht.rate }}%)</span>
          <strong>{{ formatMoney(invoice.totals.wht) }}</strong>
        </div>
      </div>

      <!-- Printable document -->
      <div class="doc-wrap">
        <InvoiceDocument :invoice="invoice" :company="store.company" />
      </div>

      <!-- Delete dialog -->
      <div v-if="showDelete" class="dialog-backdrop no-print" @click.self="showDelete = false">
        <div class="dialog">
          <h2>Delete {{ invoice.number }}?</h2>
          <p>This permanently removes the invoice. This action cannot be undone.</p>
          <div class="row" style="justify-content: flex-end">
            <button class="btn btn-secondary" @click="showDelete = false">Cancel</button>
            <button class="btn btn-danger" @click="remove">Delete invoice</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.summary-strip {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 22px;
}

.summary-strip > div {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 10px 18px;
  display: flex;
  flex-direction: column;
  min-width: 150px;
  box-shadow: var(--shadow-sm);
}

.summary-strip span {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--muted);
  font-weight: 700;
}

.summary-strip strong {
  font-family: var(--font-display);
  font-size: 1.15rem;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.summary-strip .due { color: var(--brand-700); }

.doc-wrap {
  max-width: 820px;
}

/* Delete confirmation dialog */
.dialog-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(16, 35, 27, 0.5);
  display: grid;
  place-items: center;
  z-index: 50;
  padding: 20px;
}

.dialog {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 26px;
  max-width: 430px;
  width: 100%;
  box-shadow: var(--shadow-lg);
}

.dialog h2 { margin-bottom: 8px; }
.dialog p { color: var(--muted); margin-bottom: 22px; }

@media print {
  .summary-strip,
  .dialog-backdrop { display: none !important; }
}
</style>
