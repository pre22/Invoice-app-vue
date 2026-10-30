import { defineStore } from 'pinia'

import { DEFAULT_COMPANY, blankInvoiceDraft } from '../data/nigeria.js'
import {
  computeTotals,
  effectiveStatus,
  todayISO,
  uid,
} from '../utils/format.js'

const STORAGE_KEY = 'invoice-ng:v1'

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const useAppStore = defineStore('app', {
  state: () => {
    const saved = loadState()
    return {
      company: { ...DEFAULT_COMPANY, ...(saved?.company || {}) },
      invoices: saved?.invoices || [],
      clients: saved?.clients || [],
      toast: null,
    }
  },

  getters: {
    companyComplete(state) {
      return Boolean(state.company.name && state.company.email)
    },

    companyHasBank(state) {
      return Boolean(
        state.company.bankName && state.company.bankAccountNumber,
      )
    },

    sortedInvoices(state) {
      return [...state.invoices].sort((a, b) =>
        (b.createdAt || '').localeCompare(a.createdAt || ''),
      )
    },

    nextInvoiceNumber(state) {
      const max = state.invoices.reduce((highest, inv) => {
        const match = /(\d+)$/.exec(inv.number || '')
        return match ? Math.max(highest, Number(match[1])) : highest
      }, 0)
      return `INV-${String(max + 1).padStart(4, '0')}`
    },

    stats(state) {
      const acc = {
        totalInvoiced: 0,
        collected: 0,
        outstanding: 0,
        overdue: 0,
        overdueCount: 0,
        vatDue: 0,
        count: state.invoices.length,
      }

      for (const inv of state.invoices) {
        const totals = inv.totals || computeTotals(inv)
        const status = effectiveStatus(inv)

        if (status !== 'draft') acc.totalInvoiced += totals.total
        acc.vatDue += totals.vat

        if (status === 'paid') {
          acc.collected += totals.total
        } else if (status !== 'draft') {
          acc.outstanding += totals.total
          if (status === 'overdue') {
            acc.overdue += totals.total
            acc.overdueCount += 1
          }
        }
      }

      return acc
    },
  },

  actions: {
    _persist() {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            company: this.company,
            invoices: this.invoices,
            clients: this.clients,
          }),
        )
      } catch (error) {
        console.error('Could not save data', error)
      }
    },

    notify(message, tone = 'success') {
      this.toast = { id: uid(), message, tone }
    },

    clearToast() {
      this.toast = null
    },

    saveCompany(profile) {
      this.company = { ...this.company, ...profile }
      this._persist()
      this.notify('Company details saved')
    },

    newInvoiceDraft() {
      const draft = blankInvoiceDraft(this.company)
      draft.number = this.nextInvoiceNumber
      return draft
    },

    getInvoice(id) {
      return this.invoices.find((inv) => inv.id === id) || null
    },

    saveInvoice(draft) {
      const now = new Date().toISOString()
      const invoice = {
        ...draft,
        id: draft.id || uid(),
        number: draft.number || this.nextInvoiceNumber,
        totals: computeTotals(draft),
        createdAt: draft.createdAt || now,
        updatedAt: now,
      }

      const index = this.invoices.findIndex((inv) => inv.id === invoice.id)
      if (index === -1) {
        this.invoices.unshift(invoice)
      } else {
        this.invoices.splice(index, 1, invoice)
      }

      this._upsertClient(invoice.client)
      this._persist()
      this.notify(`Invoice ${invoice.number} saved`)
      return invoice
    },

    deleteInvoice(id) {
      const invoice = this.getInvoice(id)
      this.invoices = this.invoices.filter((inv) => inv.id !== id)
      this._persist()
      if (invoice) this.notify(`Invoice ${invoice.number} deleted`, 'warn')
    },

    duplicateInvoice(id) {
      const source = this.getInvoice(id)
      if (!source) return null

      const copy = {
        ...JSON.parse(JSON.stringify(source)),
        id: null,
        number: this.nextInvoiceNumber,
        status: 'draft',
        issueDate: todayISO(),
        createdAt: null,
        updatedAt: null,
      }

      // Duplicate line items get fresh ids.
      copy.items = copy.items.map((item) => ({ ...item, id: uid() }))
      return this.saveInvoice(copy)
    },

    setInvoiceStatus(id, status) {
      const invoice = this.getInvoice(id)
      if (!invoice) return
      invoice.status = status
      invoice.updatedAt = new Date().toISOString()
      this._persist()
      this.notify(`Invoice ${invoice.number} marked ${status}`)
    },

    _upsertClient(client) {
      if (!client?.name) return
      const key = client.name.trim().toLowerCase()
      const existing = this.clients.findIndex(
        (c) => c.name.trim().toLowerCase() === key,
      )
      const record = { ...client, id: existing !== -1 ? this.clients[existing].id : uid() }
      if (existing !== -1) {
        this.clients.splice(existing, 1, record)
      } else {
        this.clients.unshift(record)
      }
    },
  },
})
