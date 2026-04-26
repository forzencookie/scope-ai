import { common, nav, actions, labels, errors, confirm } from "./core"
import { transactions, invoices, assets, supplierInvoices, receipts } from "./finance"
import { reports, payroll, owners, bookkeeping, stats, periodiseringsfonder, formaner, investments } from "./business"
import { settings } from "./settings"

export const translations = {
    common,
    nav,
    actions,
    labels,
    errors,
    confirm,
    transactions,
    invoices,
    assets,
    supplierInvoices,
    receipts,
    reports,
    payroll,
    owners,
    bookkeeping,
    stats,
    periodiseringsfonder,
    formaner,
    investments,
    settings,
} as const

/** Direct access to all translated strings */
export const text = translations

export type Translations = typeof translations
