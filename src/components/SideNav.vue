<script setup>
const links = [
  {
    to: '/',
    label: 'Dashboard',
    icon: 'M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z',
  },
  {
    to: '/invoices',
    label: 'Invoices',
    icon: 'M6 2h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Zm8 1.5V8h4.5L14 3.5ZM8 12h8m-8 4h5',
  },
  {
    to: '/invoice/new',
    label: 'New Invoice',
    icon: 'M9 2a1 1 0 0 0 0 2h1v1a1 1 0 1 0 2 0V4h1a1 1 0 1 0 0-2h-1V1a1 1 0 1 0-2 0v1H9ZM4 7v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8H6a2 2 0 0 0-2 2v-2H1a1 1 0 1 1 0-2h3Z',
  },
]
</script>

<template>
  <aside class="sidebar">
    <div class="brand">
      <div class="brand-mark">₦</div>
      <div>
        <div class="brand-name">InvoiceNG</div>
        <div class="brand-tag">Made for Naija</div>
      </div>
    </div>

    <nav aria-label="Main navigation">
      <ul class="nav-list">
        <li v-for="link in links" :key="link.to">
          <router-link class="nav-link" :to="link.to" exact-active-class="router-link-active">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path :d="link.icon" />
            </svg>
            {{ link.label }}
          </router-link>
        </li>
      </ul>
    </nav>

    <div class="sidebar-foot">
      VAT charged at 7.5% per Nigerian law.<br />
      Data is stored locally in your browser.
    </div>
  </aside>
</template>
