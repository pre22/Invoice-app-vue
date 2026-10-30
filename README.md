# InvoiceNG — Invoice Generator for Nigerian Businesses

A clean, fast invoicing app built with **Vue 3**, **Vite** and **Pinia**, tailored for
Nigerian businesses. Set up your company details once on the dashboard, then generate
professional ₦ (Naira) invoices with a live preview and one-click print/PDF.

## Features

- **Company profile on the dashboard** — business name, CAC/RC number, TIN, address,
  logo, phone, email and website. Saved once, used on every invoice.
- **Nigerian bank details** — pick your bank from the list of Nigerian banks; payment
  details are printed on every invoice.
- **Naira currency** — all amounts formatted as ₦ with the `en-NG` locale.
- **VAT at 7.5%** — the standard Nigerian VAT rate since February 2020 (toggleable).
- **Withholding Tax (WHT)** — 5% / 10% / 2.5% options, deducted at source so the
  *Amount Due* reflects what the client actually pays.
- **Line items, discounts & terms** — percentage or fixed-amount discounts, notes and
  terms & conditions.
- **Live preview** — see the exact printable invoice as you type.
- **Print / Save as PDF** — A4 print stylesheet; use your browser's "Save as PDF".
- **Status tracking** — draft, sent, paid, plus automatic *overdue* detection.
- **Client book** — clients are remembered and reusable on future invoices.
- **Local storage** — all data stays in your browser; nothing is sent to a server.

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # production build into dist/
npm run preview  # preview the production build
```

> **Note on npm cache permissions.** If `npm install` fails with `EACCES` under
> `~/.npm/_cacache` (caused by an earlier `sudo npm install`), install with a clean
> cache: `npm install --cache /tmp/npm-cache`.

## Suggested workflow

1. Open the **Dashboard** and fill in your company details, bank account and invoice
   defaults (payment terms, VAT). Save.
2. Go to **New Invoice**, add the client and line items — the preview updates live.
3. Save, then **Print / PDF** to share a copy with your client.
4. Track it from the **Invoices** page and mark it paid when the money lands.

## Tech stack

| Concern    | Choice                                          |
| ---------- | ----------------------------------------------- |
| Framework  | Vue 3 (`<script setup>` composition API)        |
| Build tool | Vite                                            |
| State      | Pinia, persisted to `localStorage`              |
| Routing    | Vue Router 4                                    |
| Styling    | Hand-rolled CSS design system (no framework)    |

## Project structure

```
src/
├── components/        # Reusable UI (sidebar, invoice document, cards…)
├── data/nigeria.js    # Nigerian states, banks, VAT/WHT rates, defaults
├── router/            # Route definitions
├── stores/appStore.js # Pinia store + localStorage persistence
├── styles/main.css    # Design system & print styles
├── utils/format.js    # ₦ currency, dates, totals calculations
└── views/             # Dashboard, Invoices, Editor, Detail
```

## Print / PDF tips

Open an invoice and click **Print / PDF**. In the print dialog choose *Save as PDF*.
The layout is A4 with the navigation and toolbars hidden automatically.

## License

MIT
