<script setup>
import { computed, ref } from 'vue'

import { formatMoney } from '../utils/format.js'
import { useAppStore } from '../stores/appStore.js'

import StatusBadge from '../components/StatusBadge.vue'

const store = useAppStore()

const search = ref('')
const statusFilter = ref('all')

const filters = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'paid', label: 'Paid' },
]

const filteredInvoices = computed(() => {
  const term = search.value.trim().toLowerCase()

  return store.sortedInvoices.filter((inv) => {
    if (statusFilter.value !== 'all') {
      const badge = inv.status === 'sent' && inv.dueDate && inv.dueDate < today()
        ? 'overdue'
        : inv.status
      if (badge !== statusFilter.value) return false
    }

    if (!term) return true
    return (
      (inv.number || '').toLowerCase().includes(term) ||
      (inv.client?.name || '').toLowerCase().includes(term)
    )
  })
})

function today() {
  return new Date().toISOString().slice(0, 10)
}
</script>

<template>
  <div>
    <header class="page-head">
      <div>
        <h1>Invoices</h1>
        <p class="subtitle">Track every invoice — draft, sent, paid and overdue.</p>
      </div>
      <router-link class="btn btn-primary" to="/invoice/new">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        New Invoice
      </router-link>
    </header>

    <!-- Toolbar -->
    <div class="card toolbar no-print">
      <input
        v-model="search"
        type="text"
        class="search"
        placeholder="Search by invoice number or client name…"
        aria-label="Search invoices"
      />
      <div class="filters">
        <button
          v-for="f in filters"
          :key="f.value"
          type="button"
          class="chip"
          :class="{ active: statusFilter === f.value }"
          @click="statusFilter = f.value"
        >
          {{ f.label }}
        </button>
      </div>
    </div>

    <!-- List -->
    <div v-if="filteredInvoices.length" class="table-wrap">
      <table class="data">
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Client</th>
            <th>Issued</th>
            <th>Due</th>
            <th>Status</th>
            <th class="num">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="inv in filteredInvoices"
            :key="inv.id"
            class="clickable"
            @click="$router.push(`/invoice/${inv.id}`)"
          >
            <td class="cell-strong">{{ inv.number }}</td>
            <td>{{ inv.client?.name || '—' }}</td>
            <td class="cell-muted">{{ inv.issueDate }}</td>
            <td class="cell-muted">{{ inv.dueDate }}</td>
            <td><StatusBadge :invoice="inv" /></td>
            <td class="num cell-strong">
              {{ formatMoney(inv.totals?.amountDue ?? 0) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="empty-state">
      <div class="art">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
          <path d="M14 2v6h6M9 13h6M9 17h4" />
        </svg>
      </div>
      <h3>{{ store.invoices.length ? 'No invoices match your search' : 'No invoices yet' }}</h3>
      <p v-if="store.invoices.length">
        Try a different search term or clear the status filter above.
      </p>
      <p v-else>
        Create your first invoice and it will show up here, ready to track and print.
      </p>
      <router-link v-if="!store.invoices.length" class="btn btn-primary" to="/invoice/new">
        Create your first invoice
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  gap: 14px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  margin-bottom: 20px;
  padding: 14px 16px;
}

.search {
  flex: 1;
  min-width: 220px;
  max-width: 380px;
}

.filters {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.chip {
  font: inherit;
  font-size: 0.84rem;
  font-weight: 600;
  padding: 7px 14px;
  border-radius: 999px;
  border: 1px solid var(--line-strong);
  background: var(--surface);
  color: var(--muted);
  cursor: pointer;
  transition: all 0.14s ease;
}

.chip:hover { border-color: var(--brand-600); color: var(--brand-700); }

.chip.active {
  background: var(--brand-700);
  border-color: var(--brand-700);
  color: #fff;
}
</style>
