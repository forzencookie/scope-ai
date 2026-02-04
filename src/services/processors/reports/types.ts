/**
 * Financial Reports Types
 */

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

/**
 * Processed VAT period for display
 */
export interface ProcessedVATPeriod {
  period: string
  dueDate: string
  salesVat: number
  inputVat: number
  netVat: number
  status: 'Kommande' | 'Inskickad'
}

/**
 * Processed financial item for display
 */
export interface ProcessedFinancialItem {
  label: string
  value: number
  highlight: boolean
  isHeader: boolean
}

/**
 * Processed report section for display
 */
export interface ProcessedReportSection {
  name: string
  description: string
  status: 'Klar' | 'Ofullständig' | 'Väntar'
}

/**
 * Account balance for calculations
 */
export interface AccountBalance {
  account: string
  balance: number
}

/**
 * Financial section item for drill-down
 */
export interface FinancialSectionItem {
  id?: string
  label: string
  value: number
  previousValue?: number  // Previous year value for YoY comparison
}

/**
 * Financial section for collapsible display
 */
export interface FinancialSection {
  title: string
  items: FinancialSectionItem[]
  total: number
  previousTotal?: number  // Previous year total for YoY comparison
  isHighlight?: boolean
}
