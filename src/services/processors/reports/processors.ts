/**
 * Report Processors - Transform raw data to display format
 */

import type {
  NakedVATPeriod,
  NakedFinancialItem,
  NakedReportSection,
  ProcessedVATPeriod,
  ProcessedFinancialItem,
  ProcessedReportSection,
} from './types'

// Status Mappings
const VAT_STATUS_MAP: Record<NakedVATPeriod['status'], ProcessedVATPeriod['status']> = {
  upcoming: 'Kommande',
  submitted: 'Inskickad',
}

const REPORT_STATUS_MAP: Record<NakedReportSection['status'], ProcessedReportSection['status']> = {
  complete: 'Klar',
  incomplete: 'Ofullständig',
  pending: 'Väntar',
}

/**
 * Process a single VAT period
 */
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

/**
 * Process a single financial item
 */
export function processFinancialItem(naked: NakedFinancialItem): ProcessedFinancialItem {
  return {
    label: naked.label,
    value: naked.value,
    highlight: naked.isHighlight || false,
    isHeader: naked.isHeader || false,
  }
}

/**
 * Process a single report section
 */
export function processReportSection(naked: NakedReportSection): ProcessedReportSection {
  return {
    name: naked.name,
    description: naked.description,
    status: REPORT_STATUS_MAP[naked.status],
  }
}

/**
 * Process multiple VAT periods
 */
export function processVATPeriods(naked: NakedVATPeriod[]): ProcessedVATPeriod[] {
  return naked.map(processVATPeriod)
}

/**
 * Process multiple financial items
 */
export function processFinancialItems(naked: NakedFinancialItem[]): ProcessedFinancialItem[] {
  return naked.map(processFinancialItem)
}

/**
 * Process multiple report sections
 */
export function processReportSections(naked: NakedReportSection[]): ProcessedReportSection[] {
  return naked.map(processReportSection)
}
