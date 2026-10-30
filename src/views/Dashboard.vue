<script setup>
import { computed, reactive, ref, watch } from 'vue'

import { NIGERIAN_STATES, BANKS } from '../data/nigeria.js'
import { formatMoney } from '../utils/format.js'
import { useAppStore } from '../stores/appStore.js'

import StatsCard from '../components/StatsCard.vue'
import StatusBadge from '../components/StatusBadge.vue'

const store = useAppStore()

// Local editable copy of the company profile, seeded from the store.
const form = reactive({ ...store.company })
const logoInput = ref(null)
const logoError = ref('')

// Keep the form in sync if the store changes elsewhere (e.g. reset).
watch(
  () => store.company,
  (next) => Object.assign(form, next),
  { deep: true },
)

const initials = computed(() => {
  const name = form.name || ''
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('') || '₦'
  )
})

const recentInvoices = computed(() => store.sortedInvoices.slice(0, 6))

const stats = computed(() => store.stats)

function onLogoChange(event) {
  const file = event.target.files?.[0]
  logoError.value = ''
  if (!file) return

  if (!file.type.startsWith('image/')) {
    logoError.value = 'Please choose an image file (PNG, JPG or SVG).'
    return
  }
  if (file.size > 300 * 1024) {
    logoError.value = 'Logo should be under 300KB for best performance.'
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    form.logo = reader.result
  }
  reader.readAsDataURL(file)
}

function removeLogo() {
  form.logo = ''
  logoError.value = ''
  if (logoInput.value) logoInput.value.value = ''
}

function saveProfile() {
  store.saveCompany({ ...form })
}
</script>

<template>
  <div>
    <header class="page-head">
      <div>
        <h1>Dashboard</h1>
        <p class="subtitle">
          Manage your company profile and keep an eye on your invoices.
        </p>
      </div>
      <router-link class="btn btn-primary" to="/invoice/new">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        New Invoice
      </router-link>
    </header>

    <!-- Setup nudge -->
    <div v-if="!store.companyComplete || !store.companyHasBank" class="banner">
      <div class="banner-icon">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M8.26 2.5A1.76 1.76 0 0 1 10 1.24h.01c.46 0 .9.18 1.23.51l6.5 6.5A1.76 1.76 0 0 1 18.26 9v5.24A2.5 2.5 0 0 1 15.76 17H4.74a2.5 2.5 0 0 1-2.5-2.5V6.5c0-.66.26-1.3.73-1.77l5.29-2.23ZM10 4.76a.24.24 0 0 0-.24.24v3.52a.24.24 0 0 0 .24.24h.01a.24.24 0 0 0 .24-.24V5a.24.24 0 0 0-.24-.24H10Z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
      <div>
        <strong>Finish setting up your business</strong>
        <p>
          Complete your company details and bank account below so they appear
          automatically on every invoice you send.
        </p>
      </div>
    </div>

    <!-- Stats -->
    <section class="stats-grid">
      <StatsCard
        label="Total Invoiced"
        :value="formatMoney(stats.totalInvoiced)"
        :caption="`${stats.count} invoice${stats.count === 1 ? '' : 's'} raised`"
      />
      <StatsCard
        label="Collected"
        :value="formatMoney(stats.collected)"
        caption="Paid in full"
        tone="good"
      />
      <StatsCard
        label="Outstanding"
        :value="formatMoney(stats.outstanding)"
        caption="Awaiting payment"
        tone="warn"
      />
      <StatsCard
        label="Overdue"
        :value="formatMoney(stats.overdue)"
        :caption="`${stats.overdueCount} invoice${stats.overdueCount === 1 ? '' : 's'} past due`"
        tone="bad"
      />
    </section>

    <!-- Company profile -->
    <section class="card">
      <div class="card-title">
        <h2>Company Details</h2>
        <span class="hint">Appears on every invoice you generate</span>
      </div>

      <form class="stack" @submit.prevent="saveProfile">
        <!-- Logo -->
        <div class="field">
          <label>Company Logo</label>
          <div class="logo-picker">
            <div class="logo-preview">
              <img v-if="form.logo" :src="form.logo" alt="Company logo" />
              <span v-else class="placeholder">{{ initials }}</span>
            </div>
            <div class="stack" style="gap: 8px">
              <div class="row">
                <input
                  ref="logoInput"
                  type="file"
                  accept="image/*"
                  class="no-print"
                  @change="onLogoChange"
                />
              </div>
              <div class="row">
                <button
                  v-if="form.logo"
                  type="button"
                  class="btn btn-ghost btn-sm"
                  @click="removeLogo"
                >
                  Remove logo
                </button>
                <span class="help">PNG, JPG or SVG · max 300KB</span>
              </div>
              <p v-if="logoError" class="help" style="color: var(--overdue)">
                {{ logoError }}
              </p>
            </div>
          </div>
        </div>

        <p class="form-section-title">Business Identity</p>
        <div class="grid-2">
          <div class="field">
            <label for="co-name">Business Name *</label>
            <input
              id="co-name"
              v-model.trim="form.name"
              type="text"
              placeholder="e.g. Adeyemi Ventures Ltd"
              required
            />
          </div>
          <div class="field">
            <label for="co-slogan">Slogan / Tagline</label>
            <input
              id="co-slogan"
              v-model.trim="form.slogan"
              type="text"
              placeholder="e.g. Quality you can trust"
            />
          </div>
          <div class="field">
            <label for="co-rc">CAC Registration (RC / BN No.)</label>
            <input
              id="co-rc"
              v-model.trim="form.rcNumber"
              type="text"
              placeholder="e.g. RC 1234567"
            />
            <span class="help">Your registration number with the Corporate Affairs Commission.</span>
          </div>
          <div class="field">
            <label for="co-tin">TIN (Tax Identification Number)</label>
            <input
              id="co-tin"
              v-model.trim="form.tin"
              type="text"
              placeholder="e.g. 20123456-0001"
            />
            <span class="help">Your FIRS tax identification number.</span>
          </div>
        </div>

        <p class="form-section-title">Contact &amp; Address</p>
        <div class="grid-2">
          <div class="field">
            <label for="co-email">Email</label>
            <input
              id="co-email"
              v-model.trim="form.email"
              type="email"
              placeholder="accounts@yourcompany.com"
            />
          </div>
          <div class="field">
            <label for="co-phone">Phone</label>
            <input
              id="co-phone"
              v-model.trim="form.phone"
              type="tel"
              placeholder="e.g. 0803 123 4567"
            />
          </div>
          <div class="field">
            <label for="co-website">Website</label>
            <input
              id="co-website"
              v-model.trim="form.website"
              type="text"
              placeholder="e.g. www.yourcompany.com"
            />
          </div>
          <div class="field">
            <label for="co-postal">Postal Code</label>
            <input
              id="co-postal"
              v-model.trim="form.postalCode"
              type="text"
              placeholder="e.g. 106104"
            />
          </div>
          <div class="field span-2">
            <label for="co-address">Street Address</label>
            <input
              id="co-address"
              v-model.trim="form.address"
              type="text"
              placeholder="e.g. 15 Adetokunbo Ademola Crescent"
            />
          </div>
          <div class="field">
            <label for="co-city">City / LGA</label>
            <input
              id="co-city"
              v-model.trim="form.city"
              type="text"
              placeholder="e.g. Ikeja"
            />
          </div>
          <div class="field">
            <label for="co-state">State</label>
            <select id="co-state" v-model="form.state">
              <option v-for="state in NIGERIAN_STATES" :key="state" :value="state">
                {{ state }}
              </option>
            </select>
          </div>
        </div>

        <p class="form-section-title">Bank Details</p>
        <div class="grid-3">
          <div class="field">
            <label for="co-bank">Bank</label>
            <select id="co-bank" v-model="form.bankName">
              <option value="">Select a bank</option>
              <option v-for="bank in BANKS" :key="bank" :value="bank">
                {{ bank }}
              </option>
            </select>
          </div>
          <div class="field">
            <label for="co-acct-name">Account Name</label>
            <input
              id="co-acct-name"
              v-model.trim="form.bankAccountName"
              type="text"
              placeholder="e.g. Adeyemi Ventures Ltd"
            />
          </div>
          <div class="field">
            <label for="co-acct-num">Account Number</label>
            <input
              id="co-acct-num"
              v-model.trim="form.bankAccountNumber"
              type="text"
              inputmode="numeric"
              placeholder="e.g. 0123456789"
            />
          </div>
        </div>

        <p class="form-section-title">Invoice Defaults</p>
        <div class="grid-3">
          <div class="field">
            <label for="co-terms">Payment Terms</label>
            <select id="co-terms" v-model.number="form.defaultPaymentDays">
              <option :value="7">Due in 7 days</option>
              <option :value="14">Due in 14 days</option>
              <option :value="30">Due in 30 days</option>
              <option :value="60">Due in 60 days</option>
            </select>
            <span class="help">Used to calculate the due date on new invoices.</span>
          </div>
          <div class="field">
            <label for="co-vat-rate">Default VAT Rate</label>
            <select id="co-vat-rate" v-model.number="form.defaultVatRate">
              <option :value="7.5">7.5% (standard)</option>
              <option :value="0">0% (no VAT)</option>
            </select>
            <span class="help">Nigerian VAT has been 7.5% since February 2020.</span>
          </div>
          <div class="field">
            <label>Charge VAT by default</label>
            <label class="switch">
              <input v-model="form.defaultVatEnabled" type="checkbox" />
              <span class="track"></span>
              <span>{{ form.defaultVatEnabled ? 'VAT on' : 'VAT off' }}</span>
            </label>
          </div>
        </div>

        <div class="row" style="justify-content: flex-end">
          <router-link class="btn btn-secondary" to="/invoices">
            View invoices
          </router-link>
          <button type="submit" class="btn btn-primary">Save Company Details</button>
        </div>
      </form>
    </section>

    <!-- Recent invoices -->
    <section class="card">
      <div class="card-title">
        <h2>Recent Invoices</h2>
        <router-link v-if="recentInvoices.length" class="btn btn-ghost btn-sm" to="/invoices">
          View all
        </router-link>
      </div>

      <div v-if="recentInvoices.length" class="table-wrap">
        <table class="data">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Client</th>
              <th>Due</th>
              <th>Status</th>
              <th class="num">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="inv in recentInvoices"
              :key="inv.id"
              class="clickable"
              @click="$router.push(`/invoice/${inv.id}`)"
            >
              <td class="cell-strong">{{ inv.number }}</td>
              <td>{{ inv.client?.name || '—' }}</td>
              <td class="cell-muted">{{ inv.dueDate }}</td>
              <td><StatusBadge :invoice="inv" /></td>
              <td class="num cell-strong">
                {{ formatMoney(inv.totals?.amountDue ?? 0) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-state" style="border: 0; padding: 34px 18px">
        <h3>No invoices yet</h3>
        <p>Save your company details above, then create your first invoice.</p>
        <router-link class="btn btn-primary" to="/invoice/new">Create your first invoice</router-link>
      </div>
    </section>
  </div>
</template>
