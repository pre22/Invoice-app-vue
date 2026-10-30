<script setup>
import { computed, reactive, ref, watch } from 'vue'

import {
  BANKS,
  DISCOUNT_TYPES,
  INVOICE_STATUSES,
  NIGERIAN_STATES,
  VAT_RATES,
  WHT_RATES,
} from '../data/nigeria.js'
import { addDaysISO, formatMoney, uid } from '../utils/format.js'
import { useAppStore } from '../stores/appStore.js'

import InvoiceDocument from '../components/InvoiceDocument.vue'

const props = defineProps({
  id: { type: String, default: null },
})

const store = useAppStore()
const isEditing = computed(() => Boolean(props.id))

const existing = computed(() =>
  isEditing.value ? store.getInvoice(props.id) : null,
)

if (isEditing.value && !existing.value) {
  // Unknown invoice id — fall back to creating a new one.
  isEditing.value = false
}

const form = reactive(
  existing.value
    ? JSON.parse(JSON.stringify(existing.value))
    : store.newInvoiceDraft(),
)

if (!form.number) form.number = store.nextInvoiceNumber

const clientMode = ref(form.client?.name ? 'saved' : 'new')

function pickClient(event) {
  const id = event.target.value
  if (!id) return
  const client = store.clients.find((c) => c.id === id)
  if (client) {
    form.client = {
      name: client.name,
      address: client.address || '',
      city: client.city || '',
      state: client.state || 'Lagos',
      phone: client.phone || '',
      email: client.email || '',
      rcNumber: client.rcNumber || '',
      tin: client.tin || '',
    }
  }
}

// Live totals for the preview while editing.
const totals = computed(() => {
  const items = form.items || []
  const subtotal = items.reduce(
    (sum, it) => sum + (Number(it.qty) || 0) * (Number(it.rate) || 0),
    0,
  )
  const dv = Number(form.discount?.value) || 0
  const discount =
    form.discount?.type === 'fixed'
      ? Math.min(Math.max(dv, 0), subtotal)
      : (Math.min(dv, 100) / 100) * subtotal
  const taxable = subtotal - discount
  const vat = form.vat?.enabled
    ? (taxable * (Number(form.vat.rate) || 0)) / 100
    : 0
  const wht = form.wht?.enabled
    ? (taxable * (Number(form.wht.rate) || 0)) / 100
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
})

// Keep the due date in step with the payment terms.
watch(
  () => [form.issueDate, store.company.defaultPaymentDays],
  () => {
    if (!isEditing.value && form.issueDate) {
      form.dueDate = addDaysISO(
        form.issueDate,
        store.company.defaultPaymentDays || 14,
      )
    }
  },
)

function addItem() {
  form.items.push({ id: uid(), description: '', qty: 1, unit: 'job', rate: 0 })
}

function removeItem(index) {
  form.items.splice(index, 1)
  if (form.items.length === 0) addItem()
}

function lineTotal(item) {
  return (Number(item.qty) || 0) * (Number(item.rate) || 0)
}

const saving = ref(false)
const error = ref('')

function save(goToInvoice = true) {
  error.value = ''
  const hasItem = form.items.some(
    (it) => it.description.trim() && Number(it.rate) > 0,
  )

  if (!form.client.name.trim()) {
    error.value = 'Please enter the client (bill-to) name.'
    return
  }
  if (!hasItem) {
    error.value = 'Add at least one line item with a description and amount.'
    return
  }

  saving.value = true
  form.totals = totals.value
  const saved = store.saveInvoice(JSON.parse(JSON.stringify(form)))
  saving.value = false

  if (goToInvoice) {
    window.location.assign(`/invoice/${saved.id}`)
  }
}
</script>

<template>
  <div>
    <header class="page-head">
      <div>
        <h1>{{ isEditing ? `Edit ${form.number}` : 'New Invoice' }}</h1>
        <p class="subtitle">
          {{ isEditing
            ? 'Update the details below — the preview updates live.'
            : `Invoice number ${form.number} · defaults pulled from your company profile.` }}
        </p>
      </div>
      <div class="row">
        <router-link class="btn btn-secondary" :to="isEditing ? `/invoice/${id}` : '/invoices'">
          Cancel
        </router-link>
        <button class="btn btn-primary" :disabled="saving" @click="save()">
          {{ isEditing ? 'Save Changes' : 'Save Invoice' }}
        </button>
      </div>
    </header>

    <p v-if="error" class="error-bar">{{ error }}</p>

    <div class="editor-grid">
      <!-- FORM -->
      <div class="stack no-print">
        <section class="card">
          <div class="card-title"><h2>Invoice Details</h2></div>
          <div class="grid-2">
            <div class="field">
              <label>Invoice Number</label>
              <input v-model.trim="form.number" type="text" />
            </div>
            <div class="field">
              <label>Status</label>
              <select v-model="form.status">
                <option
                  v-for="status in INVOICE_STATUSES"
                  :key="status.value"
                  :value="status.value"
                >
                  {{ status.label }}
                </option>
              </select>
            </div>
            <div class="field">
              <label>Issue Date</label>
              <input v-model="form.issueDate" type="date" />
            </div>
            <div class="field">
              <label>Due Date</label>
              <input v-model="form.dueDate" type="date" />
            </div>
          </div>
        </section>

        <section class="card">
          <div class="card-title">
            <h2>Client</h2>
            <div v-if="store.clients.length" class="row" style="gap: 8px">
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                :class="{ 'btn-secondary': clientMode === 'saved' }"
                @click="clientMode = 'saved'"
              >
                Saved client
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                :class="{ 'btn-secondary': clientMode === 'new' }"
                @click="clientMode = 'new'"
              >
                New client
              </button>
            </div>
          </div>

          <div v-if="clientMode === 'saved' && store.clients.length" class="field" style="margin-bottom: 16px">
            <label>Choose a saved client</label>
            <select @change="pickClient">
              <option value="">Select client…</option>
              <option v-for="c in store.clients" :key="c.id" :value="c.id">
                {{ c.name }}
              </option>
            </select>
          </div>

          <div class="grid-2">
            <div class="field span-2">
              <label>Client / Business Name *</label>
              <input
                v-model.trim="form.client.name"
                type="text"
                placeholder="e.g. Chioma Logistics Ltd"
              />
            </div>
            <div class="field span-2">
              <label>Address</label>
              <input
                v-model.trim="form.client.address"
                type="text"
                placeholder="e.g. 12 Ogui Road"
              />
            </div>
            <div class="field">
              <label>City / LGA</label>
              <input v-model.trim="form.client.city" type="text" placeholder="e.g. Enugu" />
            </div>
            <div class="field">
              <label>State</label>
              <select v-model="form.client.state">
                <option v-for="state in NIGERIAN_STATES" :key="state" :value="state">
                  {{ state }}
                </option>
              </select>
            </div>
            <div class="field">
              <label>Phone</label>
              <input v-model.trim="form.client.phone" type="tel" placeholder="0803 123 4567" />
            </div>
            <div class="field">
              <label>Email</label>
              <input v-model.trim="form.client.email" type="email" placeholder="client@email.com" />
            </div>
            <div class="field">
              <label>RC Number (optional)</label>
              <input v-model.trim="form.client.rcNumber" type="text" placeholder="RC 1234567" />
            </div>
            <div class="field">
              <label>TIN (optional)</label>
              <input v-model.trim="form.client.tin" type="text" placeholder="20123456-0001" />
            </div>
          </div>
        </section>

        <section class="card">
          <div class="card-title"><h2>Line Items</h2></div>

          <div class="items-editor">
            <div class="items-head">
              <span>Description</span>
              <span class="num">Qty</span>
              <span class="num">Rate (₦)</span>
              <span class="num">Amount</span>
              <span></span>
            </div>

            <div v-for="(item, i) in form.items" :key="item.id" class="item-row">
              <div class="field item-desc">
                <input
                  v-model.trim="item.description"
                  type="text"
                  :placeholder="i === 0 ? 'e.g. Website design & development' : 'Item description'"
                />
              </div>
              <div class="field">
                <input v-model.number="item.qty" type="number" min="0" step="1" class="num" />
              </div>
              <div class="field">
                <input v-model.number="item.rate" type="number" min="0" step="0.01" class="num" />
              </div>
              <div class="item-amount">{{ formatMoney(lineTotal(item)) }}</div>
              <button
                type="button"
                class="icon-btn item-del"
                aria-label="Remove item"
                @click="removeItem(i)"
              >
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fill-rule="evenodd"
                    d="M8.7 3.3a1 1 0 0 1 1.4 0l.6.6H16a1 1 0 1 1 0 2h-.6l-.7 9.3a2 2 0 0 1-2 1.9H9.3a2 2 0 0 1-2-1.9L6.6 7.9H6a1 1 0 1 1 0-2h3.3l.4-.6Z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <div class="add-item-row">
              <button type="button" class="btn btn-secondary btn-sm" @click="addItem">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add item
              </button>
            </div>
          </div>
        </section>

        <section class="card">
          <div class="card-title"><h2>Taxes &amp; Discount</h2></div>

          <div class="stack">
            <div class="row">
              <label class="switch">
                <input v-model="form.vat.enabled" type="checkbox" />
                <span class="track"></span>
                <span>Charge VAT</span>
              </label>
              <div v-if="form.vat.enabled" class="field" style="max-width: 170px">
                <select v-model.number="form.vat.rate">
                  <option v-for="rate in VAT_RATES" :key="rate" :value="rate">
                    {{ rate }}%
                  </option>
                </select>
              </div>
              <span class="help">Nigerian VAT rate: 7.5%</span>
            </div>

            <div class="row">
              <label class="switch">
                <input v-model="form.wht.enabled" type="checkbox" />
                <span class="track"></span>
                <span>Withholding Tax (WHT)</span>
              </label>
              <div v-if="form.wht.enabled" class="field" style="max-width: 170px">
                <select v-model.number="form.wht.rate">
                  <option v-for="rate in WHT_RATES" :key="rate" :value="rate">
                    {{ rate }}%
                  </option>
                </select>
              </div>
              <span class="help">Deducted at source — reduces amount due</span>
            </div>

            <div class="row">
              <label class="switch">
                <input
                  :checked="Number(form.discount.value) > 0"
                  type="checkbox"
                  @change="
                    form.discount.value = $event.target.checked
                      ? form.discount.type === 'fixed'
                        ? 5000
                        : 5
                      : 0
                  "
                />
                <span class="track"></span>
                <span>Apply discount</span>
              </label>
              <template v-if="Number(form.discount.value) > 0">
                <div class="field" style="max-width: 130px">
                  <input
                    v-model.number="form.discount.value"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                  />
                </div>
                <div class="field" style="max-width: 170px">
                  <select v-model="form.discount.type">
                    <option v-for="type in DISCOUNT_TYPES" :key="type.value" :value="type.value">
                      {{ type.label }}
                    </option>
                  </select>
                </div>
              </template>
            </div>

            <div class="totals-summary">
              <div><span>Subtotal</span><strong>{{ formatMoney(totals.subtotal) }}</strong></div>
              <div v-if="totals.discount > 0"><span>Discount</span><strong>-{{ formatMoney(totals.discount) }}</strong></div>
              <div v-if="form.vat.enabled"><span>VAT ({{ form.vat.rate }}%)</span><strong>{{ formatMoney(totals.vat) }}</strong></div>
              <div v-if="form.wht.enabled && totals.wht > 0"><span>WHT ({{ form.wht.rate }}%)</span><strong>-{{ formatMoney(totals.wht) }}</strong></div>
              <div class="grand"><span>Amount Due</span><strong>{{ formatMoney(totals.amountDue) }}</strong></div>
            </div>
          </div>
        </section>

        <section class="card">
          <div class="card-title"><h2>Notes &amp; Terms</h2></div>
          <div class="stack">
            <div class="field">
              <label>Notes (shown on invoice)</label>
              <textarea
                v-model.trim="form.notes"
                placeholder="e.g. Thank you for your business!"
              ></textarea>
            </div>
            <div class="field">
              <label>Terms &amp; Conditions</label>
              <textarea
                v-model.trim="form.terms"
                placeholder="e.g. Payment due within 14 days. Late payment attracts 5% monthly interest."
              ></textarea>
            </div>
            <div class="field">
              <label>Bank for payment</label>
              <select v-model="store.company.bankName">
                <option value="">Select bank</option>
                <option v-for="bank in BANKS" :key="bank" :value="bank">{{ bank }}</option>
              </select>
              <span class="help">
                Bank details are managed on the
                <router-link to="/">Dashboard</router-link>.
              </span>
            </div>
          </div>
        </section>

        <div class="row">
          <button class="btn btn-primary" :disabled="saving" @click="save()">
            {{ isEditing ? 'Save Changes' : 'Save Invoice' }}
          </button>
          <router-link
            class="btn btn-secondary"
            :to="isEditing ? `/invoice/${id}` : '/invoices'"
          >
            Cancel
          </router-link>
        </div>
      </div>

      <!-- LIVE PREVIEW -->
      <div class="preview-pane">
        <div class="preview-label no-print">Live preview</div>
        <InvoiceDocument :invoice="form" :company="store.company" :totals="totals" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.preview-pane {
  position: sticky;
  top: 24px;
}

.preview-label {
  font-size: 0.74rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
  margin-bottom: 10px;
}

.error-bar {
  background: var(--overdue-bg);
  color: var(--overdue);
  border: 1px solid #f2c9c4;
  border-radius: var(--radius-sm);
  padding: 11px 16px;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 18px;
}

.totals-summary {
  background: var(--brand-50);
  border: 1px solid var(--brand-100);
  border-radius: var(--radius-sm);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.totals-summary > div {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
}

.totals-summary span { color: var(--muted); }
.totals-summary strong { font-variant-numeric: tabular-nums; }

.totals-summary .grand {
  border-top: 1px solid var(--brand-100);
  padding-top: 8px;
  margin-top: 4px;
  font-size: 1rem;
}

.totals-summary .grand strong { color: var(--brand-800); font-weight: 800; }

.item-row .num { text-align: right; }
</style>
