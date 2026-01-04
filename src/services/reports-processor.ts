/**
 * Reports Processor Service
 * 
 * Takes NAKED report data and "clothes" them:
 * - VAT periods (Momsdeklaration)
 * - Income statement items (Resultaträkning)
 * - Balance sheet items (Balansräkning)
 * - Annual report sections (Årsredovisning)
 */

// ============================================================================
// Types
// ============================================================================

import { type Verification } from "@/hooks/use-verifications"
import { getYear, parseISO, isWithinInterval } from "date-fns"

/**
 * Raw VAT period - "naked"
 */
export interface NakedVATPeriod {
  id: string
  period: string           // "Q4 2024"
  dueDate: string          // "12 feb 2025"
  salesVat: number         // Utgående moms
  inputVat: number         // Ingående moms
  status: 'upcoming' | 'submitted'
}

/**
 * Raw financial statement line item - "naked"
 */
export interface NakedFinancialItem {
  id: string
  label: string
  value: number
  isHighlight?: boolean
  isHeader?: boolean
}

/**
 * Raw annual report section - "naked"
 */
export interface NakedReportSection {
  id: string
  name: string
  description: string
  status: 'complete' | 'incomplete' | 'pending'
}

// ============================================================================
// Processed Types
// ============================================================================

export interface ProcessedVATPeriod {
  period: string
  dueDate: string
  salesVat: number
  inputVat: number
  netVat: number
  status: 'Kommande' | 'Inskickad'
}

export interface ProcessedFinancialItem {
  label: string
  value: number
  highlight: boolean
  isHeader: boolean
}

export interface ProcessedReportSection {
  name: string
  description: string
  status: 'Klar' | 'Ofullständig' | 'Väntar'
}

// ============================================================================
// Status Mappings
// ============================================================================

const VAT_STATUS_MAP: Record<NakedVATPeriod['status'], ProcessedVATPeriod['status']> = {
  upcoming: 'Kommande',
  submitted: 'Inskickad',
}

const REPORT_STATUS_MAP: Record<NakedReportSection['status'], ProcessedReportSection['status']> = {
  complete: 'Klar',
  incomplete: 'Ofullständig',
  pending: 'Väntar',
}

// ============================================================================
// Processors
// ============================================================================

export function processVATPeriod(naked: NakedVATPeriod): ProcessedVATPeriod {
  return {
    period: naked.period,
    dueDate: naked.dueDate,
    salesVat: naked.salesVat,
    inputVat: naked.inputVat,
    netVat: naked.salesVat - naked.inputVat,
    status: VAT_STATUS_MAP[naked.status],
  }
}

export function processFinancialItem(naked: NakedFinancialItem): ProcessedFinancialItem {
  return {
    label: naked.label,
    value: naked.value,
    highlight: naked.isHighlight || false,
    isHeader: naked.isHeader || false,
  }
}

export function processReportSection(naked: NakedReportSection): ProcessedReportSection {
  return {
    name: naked.name,
    description: naked.description,
    status: REPORT_STATUS_MAP[naked.status],
  }
}

export function processVATPeriods(naked: NakedVATPeriod[]): ProcessedVATPeriod[] {
  return naked.map(processVATPeriod)
}

export function processFinancialItems(naked: NakedFinancialItem[]): ProcessedFinancialItem[] {
  return naked.map(processFinancialItem)
}

export function processReportSections(naked: NakedReportSection[]): ProcessedReportSection[] {
  return naked.map(processReportSection)
}

// ============================================================================
// Mock Data Generators
// ============================================================================

export function generateMockVATPeriods(): ProcessedVATPeriod[] {
  const mockNaked: NakedVATPeriod[] = [
    { id: "vat-1", period: "Q4 2024", dueDate: "12 feb 2025", salesVat: 125000, inputVat: 45000, status: "upcoming" },
    { id: "vat-2", period: "Q3 2024", dueDate: "12 nov 2024", salesVat: 118500, inputVat: 42300, status: "submitted" },
    { id: "vat-3", period: "Q2 2024", dueDate: "12 aug 2024", salesVat: 132000, inputVat: 48500, status: "submitted" },
    { id: "vat-4", period: "Q1 2024", dueDate: "12 maj 2024", salesVat: 98000, inputVat: 35200, status: "submitted" },
  ]
  return processVATPeriods(mockNaked)
}

export function generateMockIncomeStatement(): ProcessedFinancialItem[] {
  const mockNaked: NakedFinancialItem[] = [
    { id: "is-1", label: "Rörelseintäkter", value: 1850000 },
    { id: "is-2", label: "Rörelsekostnader", value: -1420000 },
    { id: "is-3", label: "Rörelseresultat", value: 430000, isHighlight: true },
    { id: "is-4", label: "Finansiella intäkter", value: 2500 },
    { id: "is-5", label: "Finansiella kostnader", value: -8500 },
    { id: "is-6", label: "Resultat före skatt", value: 424000, isHighlight: true },
    { id: "is-7", label: "Skatt (20,6%)", value: -87344 },
    { id: "is-8", label: "Årets resultat", value: 336656, isHighlight: true },
  ]
  return processFinancialItems(mockNaked)
}

export function generateMockBalanceSheet(): ProcessedFinancialItem[] {
  const mockNaked: NakedFinancialItem[] = [
    { id: "bs-1", label: "TILLGÅNGAR", value: 0, isHeader: true },
    { id: "bs-2", label: "Anläggningstillgångar", value: 125000 },
    { id: "bs-3", label: "Omsättningstillgångar", value: 845000 },
    { id: "bs-4", label: "Summa tillgångar", value: 970000, isHighlight: true },
    { id: "bs-5", label: "EGET KAPITAL OCH SKULDER", value: 0, isHeader: true },
    { id: "bs-6", label: "Eget kapital", value: 586656 },
    { id: "bs-7", label: "Långfristiga skulder", value: 150000 },
    { id: "bs-8", label: "Kortfristiga skulder", value: 233344 },
    { id: "bs-9", label: "Summa eget kapital och skulder", value: 970000, isHighlight: true },
  ]
  return processFinancialItems(mockNaked)
}

export function generateMockReportSections(): ProcessedReportSection[] {
  const mockNaked: NakedReportSection[] = [
    { id: "rs-1", name: "Förvaltningsberättelse", description: "Verksamhetsbeskrivning och väsentliga händelser", status: "complete" },
    { id: "rs-2", name: "Resultaträkning", description: "Intäkter, kostnader och årets resultat", status: "complete" },
    { id: "rs-3", name: "Balansräkning", description: "Tillgångar, skulder och eget kapital", status: "complete" },
    { id: "rs-4", name: "Noter", description: "Tilläggsupplysningar och redovisningsprinciper", status: "incomplete" },
    { id: "rs-5", name: "Underskrifter", description: "Styrelsens underskrifter", status: "pending" },
  ]
  return processReportSections(mockNaked)
}
// ============================================================================
// Real Data Processors
// ============================================================================

export const FinancialReportProcessor = {
  /**
   * Calculate Income Statement (Resultaträkning) from verifications
   * Focuses on account classes 3, 4, 5, 6, 7, 8
   */
  calculateIncomeStatement(verifications: Verification[], year: number = new Date().getFullYear()): ProcessedFinancialItem[] {
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31)

    let revenue = 0
    let costs = 0
    let personnelCosts = 0
    let otherExpenses = 0
    let depreciation = 0
    let financialItems = 0
    let tax = 0

    verifications.forEach(v => {
      const vDate = parseISO(v.date)
      if (vDate >= startDate && vDate <= endDate) {
        v.rows.forEach(row => {
          const acc = parseInt(row.account)
          const netAmount = row.credit - row.debit // Income is credit > debit

          if (acc >= 3000 && acc <= 3999) revenue += netAmount
          else if (acc >= 4000 && acc <= 4999) costs += (row.debit - row.credit) // Expense is debit > credit
          else if (acc >= 5000 && acc <= 6999) otherExpenses += (row.debit - row.credit)
          else if (acc >= 7000 && acc <= 7699) personnelCosts += (row.debit - row.credit)
          else if (acc >= 7700 && acc <= 7999) depreciation += (row.debit - row.credit)
          else if (acc >= 8000 && acc <= 8899) financialItems += (row.debit - row.credit) // Usually expense? Check BAS. 8300 is income, 8400 expense. 
          // Let's simplified: 8xxx Net Result (Income - Expense)
          // If 8xxx is mostly financial expenses, calculate net.
          else if (acc >= 8900 && acc <= 8999) tax += (row.debit - row.credit)
        })
      }
    })

    // Financial items are tricky. 83xx = Net Income (Credit), 84xx = Interest (Debit). 
    // Let's refine financial items loop for accuracy if needed, but for now simple summation:
    // We want (Financial Income - Financial Expense). 
    // If we processed as (Debit - Credit) above, then Income is negative, Expense is positive.
    // So `financialItems` = Net Expense. 
    // Let's flip it for "Result" calculation.

    // Actually, let's restart the financial calc loop part implicitly:
    // Better: Calculate everything as 'Result Contribution' (Credit - Debit).
    // Revenue (3xxx): Credit - Debit (Positive)
    // Expenses (4-7xxx): Credit - Debit (Negative)
    // Financial (8xxx): Credit - Debit (Mixed)

    let totalRevenue = 0
    let totalDirectCosts = 0 // 4xxx
    let totalPersonnel = 0 // 7xxx
    let totalOtherExternal = 0 // 5-6xxx
    let totalDepreciation = 0 // 77xx-79xx
    let totalFinancial = 0 // 8xxx
    let totalTax = 0 // 89xx

    verifications.forEach(v => {
      const vDate = parseISO(v.date)
      if (vDate >= startDate && vDate <= endDate) {
        v.rows.forEach(row => {
          const acc = parseInt(row.account)
          const amount = row.credit - row.debit // Result impact (Positive = Income/Profit, Negative = Expense/Loss)

          if (acc >= 3000 && acc <= 3999) totalRevenue += amount
          else if (acc >= 4000 && acc <= 4999) totalDirectCosts += amount
          else if (acc >= 5000 && acc <= 6999) totalOtherExternal += amount
          else if (acc >= 7000 && acc <= 7699) totalPersonnel += amount
          else if (acc >= 7700 && acc <= 7999) totalDepreciation += amount
          else if (acc >= 8000 && acc <= 8899) totalFinancial += amount
          else if (acc >= 8900 && acc <= 8999) totalTax += amount
        })
      }
    })

    const grossProfit = totalRevenue + totalDirectCosts
    const ebitda = grossProfit + totalOtherExternal + totalPersonnel
    const ebit = ebitda + totalDepreciation
    const ebt = ebit + totalFinancial // Earnings Before Tax
    const netIncome = ebt + totalTax

    return [
      { label: "Rörelsens intäkter", value: totalRevenue, isHeader: false, highlight: false },
      { label: "Rörelsekostnader", value: 0, isHeader: true, highlight: false }, // Header line
      { label: "Material och varor", value: totalDirectCosts, isHeader: false, highlight: false },
      { label: "Bruttoresultat", value: grossProfit, isHeader: false, highlight: true },
      { label: "Övriga externa kostnader", value: totalOtherExternal, isHeader: false, highlight: false },
      { label: "Personalkostnader", value: totalPersonnel, isHeader: false, highlight: false },
      { label: "Rörelseresultat före avskrivningar (EBITDA)", value: ebitda, isHeader: false, highlight: true },
      { label: "Avskrivningar", value: totalDepreciation, isHeader: false, highlight: false },
      { label: "Rörelseresultat (EBIT)", value: ebit, isHeader: false, highlight: true },
      { label: "Finansiella poster", value: totalFinancial, isHeader: false, highlight: false },
      { label: "Resultat före skatt", value: ebt, isHeader: false, highlight: true },
      { label: "Skatt", value: totalTax, isHeader: false, highlight: false },
      { label: "ÅRETS RESULTAT", value: netIncome, isHeader: false, highlight: true },
    ]
  },

  /**
   * Calculate Balance Sheet (Balansräkning) from verifications
   * Focuses on account classes 1 (Assets) and 2 (Equity/Liabilities)
   * Accumulates ALL TIME transactions up to reporting date.
   */
  calculateBalanceSheet(verifications: Verification[], dateStr?: string): ProcessedFinancialItem[] {
    // Default to "today" if no date
    const targetDate = dateStr ? parseISO(dateStr) : new Date()

    let assetsFixed = 0 // 10xx - 13xx
    let assetsCurrent = 0 // 14xx - 19xx
    let equity = 0 // 20xx
    let liabilitiesLong = 0 // 23xx
    let liabilitiesShort = 0 // 24xx - 29xx
    let untaxedReserves = 0 // 21xx

    // 22xx is Distributions/Provisions, group with Long Term usually or separate. Let's group Short/Long based on standard.

    verifications.forEach(v => {
      const vDate = parseISO(v.date)
      // Balance sheet includes everything up to date
      if (vDate <= targetDate) {
        v.rows.forEach(row => {
          const acc = parseInt(row.account)
          // Assets: Normal balance Debit (Debit +, Credit -)
          const assetAmount = row.debit - row.credit

          // Liabilities/Equity: Normal balance Credit (Credit +, Debit -)
          const liabilityAmount = row.credit - row.debit

          if (acc >= 1000 && acc <= 1399) assetsFixed += assetAmount
          else if (acc >= 1400 && acc <= 1999) assetsCurrent += assetAmount
          else if (acc >= 2000 && acc <= 2099) equity += liabilityAmount
          else if (acc >= 2100 && acc <= 2199) untaxedReserves += liabilityAmount
          else if (acc >= 2300 && acc <= 2399) liabilitiesLong += liabilityAmount
          else if (acc >= 2400 && acc <= 2999) liabilitiesShort += liabilityAmount // Includes VAT (26xx), Tax (27xx), Suppliers (2440)
        })
      }
    })

    // Calculate Current Year Result (This is often part of Equity in computer generated reports)
    // Profit increases Equity (Credit).
    // The Income Statement calc above for "ALL TIME" (or YTD?) 
    // Actually, Balance Sheet Equity usually includes "Retained Earnings" + "Current Year Result".
    // The `equity` variable above tracks explicitly booked equity (2010, 2019 etc).
    // We might need to calculate YTD result and add it to equity visual if it hasn't been booked to 8999/2099 yet.
    // For simplicity in this "live" view, we calculate the implied result for the YTD period ending at targetDate.
    // But typically "Year End" booking moves Result -> Equity. 
    // Let's assume for this "Live View" we just show booked values + a computed "Calculated Result" line if needed.
    // Or simpler: Just showing booked balances.

    const totalAssets = assetsFixed + assetsCurrent
    const totalEquityAndLiabilities = equity + untaxedReserves + liabilitiesLong + liabilitiesShort

    return [
      { label: "TILLGÅNGAR", value: 0, isHeader: true, highlight: false },
      { label: "Anläggningstillgångar", value: assetsFixed, isHeader: false, highlight: false },
      { label: "Omsättningstillgångar", value: assetsCurrent, isHeader: false, highlight: false },
      { label: "SUMMA TILLGÅNGAR", value: totalAssets, isHeader: false, highlight: true },

      { label: "EGET KAPITAL OCH SKULDER", value: 0, isHeader: true, highlight: false },
      { label: "Eget kapital", value: equity, isHeader: false, highlight: false },
      { label: "Obeskattade reserver", value: untaxedReserves, isHeader: false, highlight: false },
      { label: "Långfristiga skulder", value: liabilitiesLong, isHeader: false, highlight: false },
      { label: "Kortfristiga skulder", value: liabilitiesShort, isHeader: false, highlight: false },
      { label: "SUMMA EGET KAPITAL OCH SKULDER", value: totalEquityAndLiabilities, isHeader: false, highlight: true },
    ]
  },

  // ============================================
  // SECTIONED OUTPUT (for CollapsibleTableSection)
  // ============================================

  /**
   * Calculate Income Statement as sections for CollapsibleTableSection
   */
  calculateIncomeStatementSections(verifications: Verification[], year: number = new Date().getFullYear()): FinancialSection[] {
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31)

    let totalRevenue = 0
    let totalDirectCosts = 0 // 4xxx
    let totalPersonnel = 0 // 7xxx
    let totalOtherExternal = 0 // 5-6xxx
    let totalDepreciation = 0 // 77xx-79xx
    let totalFinancial = 0 // 8xxx
    let totalTax = 0 // 89xx

    verifications.forEach(v => {
      const vDate = parseISO(v.date)
      if (vDate >= startDate && vDate <= endDate) {
        v.rows.forEach(row => {
          const acc = parseInt(row.account)
          const amount = row.credit - row.debit // Result impact

          if (acc >= 3000 && acc <= 3999) totalRevenue += amount
          else if (acc >= 4000 && acc <= 4999) totalDirectCosts += amount
          else if (acc >= 5000 && acc <= 6999) totalOtherExternal += amount
          else if (acc >= 7000 && acc <= 7699) totalPersonnel += amount
          else if (acc >= 7700 && acc <= 7999) totalDepreciation += amount
          else if (acc >= 8000 && acc <= 8899) totalFinancial += amount
          else if (acc >= 8900 && acc <= 8999) totalTax += amount
        })
      }
    })

    const grossProfit = totalRevenue + totalDirectCosts
    const ebitda = grossProfit + totalOtherExternal + totalPersonnel
    const ebit = ebitda + totalDepreciation
    const ebt = ebit + totalFinancial
    const netIncome = ebt + totalTax

    return [
      {
        title: "Rörelseintäkter",
        items: [
          { label: "Försäljning och intäkter", value: totalRevenue },
        ],
        total: totalRevenue,
      },
      {
        title: "Rörelsekostnader",
        items: [
          { label: "Material och varor", value: totalDirectCosts },
          { label: "Övriga externa kostnader", value: totalOtherExternal },
          { label: "Personalkostnader", value: totalPersonnel },
          { label: "Avskrivningar", value: totalDepreciation },
        ],
        total: totalDirectCosts + totalOtherExternal + totalPersonnel + totalDepreciation,
      },
      {
        title: "Rörelseresultat",
        items: [{ label: "EBIT", value: ebit }],
        total: ebit,
        isHighlight: true,
      },
      {
        title: "Finansiella poster",
        items: [
          { label: "Finansnetto", value: totalFinancial },
        ],
        total: totalFinancial,
      },
      {
        title: "Resultat före skatt",
        items: [
          { label: "EBT", value: ebt },
          { label: "Skatt", value: totalTax },
        ],
        total: ebt + totalTax,
      },
      {
        title: "Årets resultat",
        items: [{ label: "Nettoresultat", value: netIncome }],
        total: netIncome,
        isHighlight: true,
      },
    ]
  },

  /**
   * Calculate Balance Sheet as sections for CollapsibleTableSection
   */
  calculateBalanceSheetSections(verifications: Verification[], dateStr?: string): FinancialSection[] {
    const targetDate = dateStr ? parseISO(dateStr) : new Date()

    let assetsFixed = 0
    let assetsCurrent = 0
    let equity = 0
    let liabilitiesLong = 0
    let liabilitiesShort = 0
    let untaxedReserves = 0

    verifications.forEach(v => {
      const vDate = parseISO(v.date)
      if (vDate <= targetDate) {
        v.rows.forEach(row => {
          const acc = parseInt(row.account)
          const assetAmount = row.debit - row.credit
          const liabilityAmount = row.credit - row.debit

          if (acc >= 1000 && acc <= 1399) assetsFixed += assetAmount
          else if (acc >= 1400 && acc <= 1999) assetsCurrent += assetAmount
          else if (acc >= 2000 && acc <= 2099) equity += liabilityAmount
          else if (acc >= 2100 && acc <= 2199) untaxedReserves += liabilityAmount
          else if (acc >= 2300 && acc <= 2399) liabilitiesLong += liabilityAmount
          else if (acc >= 2400 && acc <= 2999) liabilitiesShort += liabilityAmount
        })
      }
    })

    const totalAssets = assetsFixed + assetsCurrent
    const totalEquityAndLiabilities = equity + untaxedReserves + liabilitiesLong + liabilitiesShort

    return [
      {
        title: "Tillgångar",
        items: [
          { label: "Anläggningstillgångar", value: assetsFixed },
          { label: "Omsättningstillgångar", value: assetsCurrent },
        ],
        total: totalAssets,
      },
      {
        title: "Eget kapital och skulder",
        items: [
          { label: "Eget kapital", value: equity },
          { label: "Obeskattade reserver", value: untaxedReserves },
          { label: "Långfristiga skulder", value: liabilitiesLong },
          { label: "Kortfristiga skulder", value: liabilitiesShort },
        ],
        total: totalEquityAndLiabilities,
      },
    ]
  },
}

// ============================================
// Sectioned Types
// ============================================

export interface FinancialSectionItem {
  label: string
  value: number
}

export interface FinancialSection {
  title: string
  items: FinancialSectionItem[]
  total: number
  isHighlight?: boolean
}

