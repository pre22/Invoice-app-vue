// Nigerian reference data: states, banks, tax rates and the default company profile.

export const NIGERIAN_STATES = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'FCT (Abuja)',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
]

export const BANKS = [
  'Access Bank',
  'Citizens Bank',
  'Ecobank Nigeria',
  'Fidelity Bank',
  'First Bank of Nigeria',
  'First City Monument Bank (FCMB)',
  'Globus Bank',
  'Guaranty Trust Bank (GTBank)',
  'Heritage Banking',
  'Jaiz Bank',
  'Keystone Bank',
  'Kuda Microfinance Bank',
  'Moniepoint MFB',
  'Opay Digital Services',
  'PalmPay',
  'Polaris Bank',
  'Providus Bank',
  'Stanbic IBTC Bank',
  'Standard Chartered Bank',
  'Sterling Bank',
  'Suntrust Bank',
  'Titan Trust Bank',
  'Union Bank of Nigeria',
  'Unity Bank',
  'Wema Bank',
  'Zenith Bank',
]

/** Standard Nigerian VAT rate (7.5% since February 2020, per the Finance Act). */
export const STANDARD_VAT_RATE = 7.5

export const VAT_RATES = [STANDARD_VAT_RATE, 0]

/** Common withholding tax (WHT) rates — 5% on goods, 10% on services. */
export const WHT_RATES = [5, 10, 2.5, 0]

export const INVOICE_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
]

export const DISCOUNT_TYPES = [
  { value: 'percent', label: '% (percentage)' },
  { value: 'fixed', label: '\u20a6 (fixed amount)' },
]

export const DEFAULT_COMPANY = {
  name: '',
  legalSuffix: '',
  slogan: '',
  logo: '',
  rcNumber: '', // CAC registration — RC / BN number
  tin: '', // Tax Identification Number (13 digits)
  address: '',
  city: '',
  state: 'Lagos',
  postalCode: '',
  phone: '',
  email: '',
  website: '',
  bankName: '',
  bankAccountName: '',
  bankAccountNumber: '',
  defaultPaymentDays: 14,
  defaultVatEnabled: true,
  defaultVatRate: STANDARD_VAT_RATE,
}

export function blankInvoiceDraft(company) {
  const today = new Date()
  const issueDate = toISODate(today)
  const due = new Date(today)
  due.setDate(due.getDate() + (company?.defaultPaymentDays || 14))

  return {
    id: null,
    number: '',
    status: 'draft',
    issueDate,
    dueDate: toISODate(due),
    client: {
      name: '',
      address: '',
      city: '',
      state: 'Lagos',
      phone: '',
      email: '',
      rcNumber: '',
      tin: '',
    },
    items: [{ id: uid(), description: '', qty: 1, unit: 'job', rate: 0 }],
    discount: { type: 'percent', value: 0 },
    vat: {
      enabled: company?.defaultVatEnabled ?? true,
      rate: company?.defaultVatRate ?? STANDARD_VAT_RATE,
    },
    wht: { enabled: false, rate: 5 },
    notes: '',
    terms: `Payment due within ${company?.defaultPaymentDays || 14} days.`,
    createdAt: null,
    updatedAt: null,
  }
}

function toISODate(d) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}
