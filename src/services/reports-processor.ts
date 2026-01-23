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

import { getYear, parseISO, isWithinInterval } from "date-fns"

export interface AccountBalance {
  account: string;
  balance: number;
}

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
  calculateIncomeStatement(balances: AccountBalance[]): ProcessedFinancialItem[] {
    let totalRevenue = 0
    let totalDirectCosts = 0 // 4xxx
    let totalPersonnel = 0 // 7xxx
    let totalOtherExternal = 0 // 5-6xxx
    let totalDepreciation = 0 // 77xx-79xx
    let totalFinancial = 0 // 8xxx
    let totalTax = 0 // 89xx

    balances.forEach(b => {
      const acc = parseInt(b.account)
      const amount = b.balance // Positive = Income/Profit (Credit > Debit), Negative = Expense/Loss

      if (acc >= 3000 && acc <= 3999) totalRevenue += amount
      else if (acc >= 4000 && acc <= 4999) totalDirectCosts += amount
      else if (acc >= 5000 && acc <= 6999) totalOtherExternal += amount
      else if (acc >= 7000 && acc <= 7699) totalPersonnel += amount
      else if (acc >= 7700 && acc <= 7999) totalDepreciation += amount
      else if (acc >= 8000 && acc <= 8899) totalFinancial += amount
      else if (acc >= 8900 && acc <= 8999) totalTax += amount
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
  calculateBalanceSheet(balances: AccountBalance[]): ProcessedFinancialItem[] {
    let assetsFixed = 0 // 10xx - 13xx
    let assetsCurrent = 0 // 14xx - 19xx
    let equity = 0 // 20xx
    let liabilitiesLong = 0 // 23xx
    let liabilitiesShort = 0 // 24xx - 29xx
    let untaxedReserves = 0 // 21xx

    balances.forEach(b => {
      const acc = parseInt(b.account)
      // Balance sheet balances from RPC. 
      // Assets: Usually Debit > Credit (Negative in our credit-debit logic?). 
      // Wait, RPC returns SUM(credit - debit).
      // So Assets will be NEGATIVE. Liabilities POSITIVE.
      // Let's flip signs for display where needed.

      const balance = b.balance

      if (acc >= 1000 && acc <= 1399) assetsFixed += -balance // Flip to positive for asset
      else if (acc >= 1400 && acc <= 1999) assetsCurrent += -balance // Flip to positive for asset
      else if (acc >= 2000 && acc <= 2099) equity += balance
      else if (acc >= 2100 && acc <= 2199) untaxedReserves += balance
      else if (acc >= 2300 && acc <= 2399) liabilitiesLong += balance
      else if (acc >= 2400 && acc <= 2999) liabilitiesShort += balance
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

  // ============================================
  // SECTIONED OUTPUT (for CollapsibleTableSection)
  // ============================================

  /**
   * Calculate Income Statement as sections for CollapsibleTableSection
   * Groups items by account to allow drill-down
   */
  calculateIncomeStatementSections(balances: AccountBalance[]): FinancialSection[] {
    const accountBalances: Record<string, number> = {}

    balances.forEach(b => {
      accountBalances[b.account] = b.balance
    })

    const getItemsInRange = (start: number, end: number) => {
      return Object.entries(accountBalances)
        .filter(([acc]) => {
          const num = parseInt(acc)
          return num >= start && num <= end && Math.abs(accountBalances[acc]) > 0.01
        })
        .map(([acc, val]) => {
          const accountInfo = basAccounts.find(a => a.number === acc)
          return {
            id: acc,
            label: accountInfo?.name || `Konto ${acc}`,
            value: val
          }
        })
        .sort((a, b) => a.id.localeCompare(b.id))
    }

    const revenueItems = getItemsInRange(3000, 3999)
    const materialItems = getItemsInRange(4000, 4999)
    const otherExternalItems = getItemsInRange(5000, 6999)
    const personnelItems = getItemsInRange(7000, 7699)
    const depreciationItems = getItemsInRange(7700, 7999)
    const financialItems = getItemsInRange(8000, 8899)
    const taxItems = getItemsInRange(8900, 8999)

    const totalRevenue = revenueItems.reduce((sum, item) => sum + item.value, 0)
    const totalCosts = materialItems.reduce((sum, item) => sum + item.value, 0) +
      otherExternalItems.reduce((sum, item) => sum + item.value, 0) +
      personnelItems.reduce((sum, item) => sum + item.value, 0) +
      depreciationItems.reduce((sum, item) => sum + item.value, 0)

    // Financial math
    const ebitda = totalRevenue + materialItems.reduce((sum, i) => sum + i.value, 0) + otherExternalItems.reduce((sum, i) => sum + i.value, 0) + personnelItems.reduce((sum, i) => sum + i.value, 0)
    const ebit = ebitda + depreciationItems.reduce((sum, i) => sum + i.value, 0)
    const ebt = ebit + financialItems.reduce((sum, i) => sum + i.value, 0)
    const netIncome = ebt + taxItems.reduce((sum, i) => sum + i.value, 0)

    return [
      {
        title: "Rörelseintäkter",
        items: revenueItems,
        total: totalRevenue,
      },
      {
        title: "Kostnader för material och varor",
        items: materialItems,
        total: materialItems.reduce((sum, i) => sum + i.value, 0),
      },
      {
        title: "Övriga externa kostnader",
        items: otherExternalItems,
        total: otherExternalItems.reduce((sum, i) => sum + i.value, 0),
      },
      {
        title: "Personalkostnader",
        items: personnelItems,
        total: personnelItems.reduce((sum, i) => sum + i.value, 0),
      },
      {
        title: "Avskrivningar",
        items: depreciationItems,
        total: depreciationItems.reduce((sum, i) => sum + i.value, 0),
      },
      {
        title: "Finansiella poster",
        items: financialItems,
        total: financialItems.reduce((sum, i) => sum + i.value, 0),
      },
      {
        title: "Skatt",
        items: taxItems,
        total: taxItems.reduce((sum, i) => sum + i.value, 0),
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
  calculateBalanceSheetSections(balances: AccountBalance[]): FinancialSection[] {
    const accountBalances: Record<string, number> = {}

    balances.forEach(b => {
      const acc = parseInt(b.account)
      // Assets need flipping to be positive
      if (acc < 2000) {
        accountBalances[b.account] = -b.balance
      } else {
        accountBalances[b.account] = b.balance
      }
    })

    const getItemsInRange = (start: number, end: number, flipSign: boolean = false) => {
      return Object.entries(accountBalances)
        .filter(([acc]) => {
          const num = parseInt(acc)
          return num >= start && num <= end && Math.abs(accountBalances[acc]) > 0.01
        })
        .map(([acc, val]) => {
          const accountInfo = basAccounts.find(a => a.number === acc)
          return {
            id: acc,
            label: accountInfo?.name || `Konto ${acc}`,
            value: flipSign ? -val : val
          }
        })
        .sort((a, b) => a.id.localeCompare(b.id))
    }

    const fixedAssets = getItemsInRange(1000, 1399)
    const currentAssets = getItemsInRange(1400, 1999)
    const equityItems = getItemsInRange(2000, 2099, true)
    const untaxedItems = getItemsInRange(2100, 2199, true)
    const longLiabilities = getItemsInRange(2300, 2399, true)
    const shortLiabilities = getItemsInRange(2400, 2999, true)

    const totalAssets = fixedAssets.reduce((sum, i) => sum + i.value, 0) + currentAssets.reduce((sum, i) => sum + i.value, 0)
    const totalEqLiab = equityItems.reduce((sum, i) => sum + i.value, 0) +
      untaxedItems.reduce((sum, i) => sum + i.value, 0) +
      longLiabilities.reduce((sum, i) => sum + i.value, 0) +
      shortLiabilities.reduce((sum, i) => sum + i.value, 0)

    return [
      {
        title: "Anläggningstillgångar",
        items: fixedAssets,
        total: fixedAssets.reduce((sum, i) => sum + i.value, 0),
      },
      {
        title: "Omsättningstillgångar",
        items: currentAssets,
        total: currentAssets.reduce((sum, i) => sum + i.value, 0),
      },
      {
        title: "Eget kapital",
        items: equityItems,
        total: equityItems.reduce((sum, i) => sum + i.value, 0),
      },
      {
        title: "Obeskattade reserver",
        items: untaxedItems,
        total: untaxedItems.reduce((sum, i) => sum + i.value, 0),
      },
      {
        title: "Långfristiga skulder",
        items: longLiabilities,
        total: longLiabilities.reduce((sum, i) => sum + i.value, 0),
      },
      {
        title: "Kortfristiga skulder",
        items: shortLiabilities,
        total: shortLiabilities.reduce((sum, i) => sum + i.value, 0),
      },
    ]
  },
}

// ============================================
// Sectioned Types
// ============================================

export interface FinancialSectionItem {
  id?: string
  label: string
  value: number
}

export interface FinancialSection {
  title: string
  items: FinancialSectionItem[]
  total: number
  isHighlight?: boolean
}

