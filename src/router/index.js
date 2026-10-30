import { createRouter, createWebHistory } from 'vue-router'

import Dashboard from '../views/Dashboard.vue'
import InvoicesView from '../views/InvoicesView.vue'
import InvoiceEditor from '../views/InvoiceEditor.vue'
import InvoiceDetail from '../views/InvoiceDetail.vue'

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: Dashboard,
    meta: { title: 'Dashboard' },
  },
  {
    path: '/invoices',
    name: 'invoices',
    component: InvoicesView,
    meta: { title: 'Invoices' },
  },
  {
    path: '/invoice/new',
    name: 'invoice-new',
    component: InvoiceEditor,
    meta: { title: 'New Invoice' },
  },
  {
    path: '/invoice/:id',
    name: 'invoice-detail',
    component: InvoiceDetail,
    props: true,
    meta: { title: 'Invoice' },
  },
  {
    path: '/invoice/:id/edit',
    name: 'invoice-edit',
    component: InvoiceEditor,
    props: true,
    meta: { title: 'Edit Invoice' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.afterEach((to) => {
  document.title = to.meta.title
    ? `${to.meta.title} · InvoiceNG`
    : 'InvoiceNG'
})

export default router
