import { common, nav, actions, labels, errors, confirm } from "./core"
import { transactions, invoices, assets, supplierInvoices, receipts } from "./finance"
import { reports, payroll, owners, bookkeeping, stats, periodiseringsfonder, formaner, investments } from "./business"
import { settings } from "./settings"
import { ai } from "./ai"

export const translations = {
    // Core
    common,
    nav,
    actions,
    labels,
    errors,
    confirm,

    // Finance
    transactions,
    invoices,
    assets,
    supplierInvoices,
    receipts,

    // Business
    reports,
    payroll,
    owners,
    bookkeeping,
    stats,
    periodiseringsfonder,
    formaner,
    investments,

    // Settings
    settings,

    // AI
    ai,
} as const

// Type helpers
export type TranslationKey = keyof typeof translations
export type Translations = typeof translations
