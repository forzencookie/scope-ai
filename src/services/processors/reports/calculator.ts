/**
 * Financial Report Calculator
 * Calculates income statements and balance sheets from account balances
 */

import { basAccounts } from "@/data/accounts"
import type { AccountBalance, ProcessedFinancialItem, FinancialSection } from './types'

export const FinancialReportCalculator = {
  /**
   * Calculate Income Statement (Resultaträkning) from account balances
   */
  calculateIncomeStatement(balances: AccountBalance[]): ProcessedFinancialItem[] {
    let totalRevenue = 0
    let totalDirectCosts = 0
    let totalPersonnel = 0
    let totalOtherExternal = 0
    let totalDepreciation = 0
    let totalFinancial = 0
    let totalTax = 0

    balances.forEach(b => {
      const acc = parseInt(b.account)
      const amount = b.balance

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
    const ebt = ebit + totalFinancial
    const netIncome = ebt + totalTax

    return [
      { label: "Rörelsens intäkter", value: totalRevenue, isHeader: false, highlight: false },
      { label: "Rörelsekostnader", value: 0, isHeader: true, highlight: false },
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
   * Calculate Balance Sheet (Balansräkning) from account balances
   */
  calculateBalanceSheet(balances: AccountBalance[]): ProcessedFinancialItem[] {
    let assetsFixed = 0
    let assetsCurrent = 0
    let equity = 0
    let liabilitiesLong = 0
    let liabilitiesShort = 0
    let untaxedReserves = 0

    balances.forEach(b => {
      const acc = parseInt(b.account)
      const balance = b.balance

      if (acc >= 1000 && acc <= 1399) assetsFixed += -balance
      else if (acc >= 1400 && acc <= 1999) assetsCurrent += -balance
      else if (acc >= 2000 && acc <= 2099) equity += balance
      else if (acc >= 2100 && acc <= 2199) untaxedReserves += balance
      else if (acc >= 2300 && acc <= 2399) liabilitiesLong += balance
      else if (acc >= 2400 && acc <= 2999) liabilitiesShort += balance
    })

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

  /**
   * Calculate Income Statement as sections for CollapsibleTableSection
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
        .sort((a, b) => a.id!.localeCompare(b.id!))
    }

    const revenueItems = getItemsInRange(3000, 3999)
    const materialItems = getItemsInRange(4000, 4999)
    const otherExternalItems = getItemsInRange(5000, 6999)
    const personnelItems = getItemsInRange(7000, 7699)
    const depreciationItems = getItemsInRange(7700, 7999)
    const financialItems = getItemsInRange(8000, 8899)
    const taxItems = getItemsInRange(8900, 8999)

    const totalRevenue = revenueItems.reduce((sum, item) => sum + item.value, 0)
    const ebitda = totalRevenue + 
      materialItems.reduce((sum, i) => sum + i.value, 0) + 
      otherExternalItems.reduce((sum, i) => sum + i.value, 0) + 
      personnelItems.reduce((sum, i) => sum + i.value, 0)
    const ebit = ebitda + depreciationItems.reduce((sum, i) => sum + i.value, 0)
    const ebt = ebit + financialItems.reduce((sum, i) => sum + i.value, 0)
    const netIncome = ebt + taxItems.reduce((sum, i) => sum + i.value, 0)

    return [
      { title: "Rörelseintäkter", items: revenueItems, total: totalRevenue },
      { title: "Kostnader för material och varor", items: materialItems, total: materialItems.reduce((sum, i) => sum + i.value, 0) },
      { title: "Övriga externa kostnader", items: otherExternalItems, total: otherExternalItems.reduce((sum, i) => sum + i.value, 0) },
      { title: "Personalkostnader", items: personnelItems, total: personnelItems.reduce((sum, i) => sum + i.value, 0) },
      { title: "Avskrivningar", items: depreciationItems, total: depreciationItems.reduce((sum, i) => sum + i.value, 0) },
      { title: "Finansiella poster", items: financialItems, total: financialItems.reduce((sum, i) => sum + i.value, 0) },
      { title: "Skatt", items: taxItems, total: taxItems.reduce((sum, i) => sum + i.value, 0) },
      { title: "Årets resultat", items: [{ label: "Nettoresultat", value: netIncome }], total: netIncome, isHighlight: true },
    ]
  },

  /**
   * Calculate Balance Sheet as sections for CollapsibleTableSection
   */
  calculateBalanceSheetSections(balances: AccountBalance[]): FinancialSection[] {
    const accountBalances: Record<string, number> = {}
    balances.forEach(b => {
      const acc = parseInt(b.account)
      accountBalances[b.account] = acc < 2000 ? -b.balance : b.balance
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
        .sort((a, b) => a.id!.localeCompare(b.id!))
    }

    const fixedAssets = getItemsInRange(1000, 1399)
    const currentAssets = getItemsInRange(1400, 1999)
    const equityItems = getItemsInRange(2000, 2099, true)
    const untaxedItems = getItemsInRange(2100, 2199, true)
    const longLiabilities = getItemsInRange(2300, 2399, true)
    const shortLiabilities = getItemsInRange(2400, 2999, true)

    return [
      { title: "Anläggningstillgångar", items: fixedAssets, total: fixedAssets.reduce((sum, i) => sum + i.value, 0) },
      { title: "Omsättningstillgångar", items: currentAssets, total: currentAssets.reduce((sum, i) => sum + i.value, 0) },
      { title: "Eget kapital", items: equityItems, total: equityItems.reduce((sum, i) => sum + i.value, 0) },
      { title: "Obeskattade reserver", items: untaxedItems, total: untaxedItems.reduce((sum, i) => sum + i.value, 0) },
      { title: "Långfristiga skulder", items: longLiabilities, total: longLiabilities.reduce((sum, i) => sum + i.value, 0) },
      { title: "Kortfristiga skulder", items: shortLiabilities, total: shortLiabilities.reduce((sum, i) => sum + i.value, 0) },
    ]
  },

  /**
   * Get empty Income Statement sections with 0 values
   * Used when there's no data to display but we still want to show the structure
   */
  getEmptyIncomeStatementSections(): FinancialSection[] {
    return [
      { title: "Rörelseintäkter", items: [], total: 0 },
      { title: "Kostnader för material och varor", items: [], total: 0 },
      { title: "Övriga externa kostnader", items: [], total: 0 },
      { title: "Personalkostnader", items: [], total: 0 },
      { title: "Avskrivningar", items: [], total: 0 },
      { title: "Finansiella poster", items: [], total: 0 },
      { title: "Skatt", items: [], total: 0 },
      { title: "Årets resultat", items: [{ label: "Nettoresultat", value: 0 }], total: 0, isHighlight: true },
    ]
  },

  /**
   * Get empty Balance Sheet sections with 0 values
   * Used when there's no data to display but we still want to show the structure
   */
  getEmptyBalanceSheetSections(): FinancialSection[] {
    return [
      { title: "Tillgångar", items: [], total: 0 },
      { title: "Anläggningstillgångar", items: [], total: 0 },
      { title: "Omsättningstillgångar", items: [], total: 0 },
      { title: "Eget kapital och skulder", items: [], total: 0 },
      { title: "Eget kapital", items: [], total: 0 },
      { title: "Obeskattade reserver", items: [], total: 0 },
      { title: "Långfristiga skulder", items: [], total: 0 },
      { title: "Kortfristiga skulder", items: [], total: 0 },
    ]
  },
}
