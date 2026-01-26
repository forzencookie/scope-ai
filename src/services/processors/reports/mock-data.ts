/**
 * Mock Data Generators for Reports
 */

import type {
  NakedVATPeriod,
  NakedFinancialItem,
  NakedReportSection,
  ProcessedVATPeriod,
  ProcessedFinancialItem,
  ProcessedReportSection,
} from './types'

import {
  processVATPeriods,
  processFinancialItems,
  processReportSections,
} from './processors'

/**
 * Generate mock VAT periods
 */
export function generateMockVATPeriods(): ProcessedVATPeriod[] {
  const mockNaked: NakedVATPeriod[] = [
    { id: "vat-1", period: "Q4 2024", dueDate: "12 feb 2025", salesVat: 125000, inputVat: 45000, status: "upcoming" },
    { id: "vat-2", period: "Q3 2024", dueDate: "12 nov 2024", salesVat: 118500, inputVat: 42300, status: "submitted" },
    { id: "vat-3", period: "Q2 2024", dueDate: "12 aug 2024", salesVat: 132000, inputVat: 48500, status: "submitted" },
    { id: "vat-4", period: "Q1 2024", dueDate: "12 maj 2024", salesVat: 98000, inputVat: 35200, status: "submitted" },
  ]
  return processVATPeriods(mockNaked)
}

/**
 * Generate mock income statement
 */
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

/**
 * Generate mock balance sheet
 */
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

/**
 * Generate mock report sections
 */
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
