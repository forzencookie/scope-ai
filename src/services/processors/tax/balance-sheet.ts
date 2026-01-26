/**
 * INK2R Balance Sheet Field Calculator
 * Maps BAS accounts to SRU field codes for Swedish tax declarations
 */

import type { SRUField } from "@/types/sru"
import type { AccountBalance } from './types'
import { sumAccountRange } from './types'

/**
 * Calculate INK2R Balance Sheet fields
 */
export function calculateBalanceSheet(balances: Map<string, AccountBalance>): SRUField[] {
  const fields: SRUField[] = []

  // Assets (Tillgångar) - accounts 1000-1999

  // Immateriella anläggningstillgångar (1000-1099)
  const intangibleAssets = Math.abs(sumAccountRange(balances, 1000, 1099))
  if (intangibleAssets > 0) fields.push({ code: 7201, value: intangibleAssets })

  // Byggnader (1100-1199)
  const buildings = Math.abs(sumAccountRange(balances, 1100, 1199))
  if (buildings > 0) fields.push({ code: 7214, value: buildings })

  // Maskiner och inventarier (1200-1299)
  const machinery = Math.abs(sumAccountRange(balances, 1200, 1299))
  if (machinery > 0) fields.push({ code: 7215, value: machinery })

  // Finansiella anläggningstillgångar (1300-1399)
  const financialAssets = Math.abs(sumAccountRange(balances, 1300, 1399))
  if (financialAssets > 0) fields.push({ code: 7230, value: financialAssets })

  // Varulager (1400-1499)
  const inventory = Math.abs(sumAccountRange(balances, 1400, 1499))
  if (inventory > 0) fields.push({ code: 7243, value: inventory })

  // Kundfordringar (1500-1599)
  const receivables = Math.abs(sumAccountRange(balances, 1500, 1599))
  if (receivables > 0) fields.push({ code: 7251, value: receivables })

  // Övriga fordringar (1600-1699)
  const otherReceivables = Math.abs(sumAccountRange(balances, 1600, 1699))
  if (otherReceivables > 0) fields.push({ code: 7261, value: otherReceivables })

  // Förutbetalda kostnader (1700-1799)
  const prepaidExpenses = Math.abs(sumAccountRange(balances, 1700, 1799))
  if (prepaidExpenses > 0) fields.push({ code: 7263, value: prepaidExpenses })

  // Kortfristiga placeringar (1800-1899)
  const shortTermInvestments = Math.abs(sumAccountRange(balances, 1800, 1899))
  if (shortTermInvestments > 0) fields.push({ code: 7271, value: shortTermInvestments })

  // Kassa och bank (1900-1999)
  const cashAndBank = Math.abs(sumAccountRange(balances, 1900, 1999))
  if (cashAndBank > 0) fields.push({ code: 7281, value: cashAndBank })

  // Equity and Liabilities (Eget kapital och skulder) - accounts 2000-2999

  // Eget kapital - bundet (2080-2089)
  const restrictedEquity = Math.abs(sumAccountRange(balances, 2080, 2089))
  if (restrictedEquity > 0) fields.push({ code: 7301, value: restrictedEquity })

  // Eget kapital - fritt (2090-2099)
  const unrestrictedEquity = Math.abs(sumAccountRange(balances, 2090, 2099))
  if (unrestrictedEquity > 0) fields.push({ code: 7302, value: unrestrictedEquity })

  // Periodiseringsfonder (2110-2129)
  const periodizationFunds = Math.abs(sumAccountRange(balances, 2110, 2129))
  if (periodizationFunds > 0) fields.push({ code: 7321, value: periodizationFunds })

  // Ackumulerade överavskrivningar (2150-2159)
  const accumulatedDepreciation = Math.abs(sumAccountRange(balances, 2150, 2159))
  if (accumulatedDepreciation > 0) fields.push({ code: 7322, value: accumulatedDepreciation })

  // Avsättningar för pensioner (2210-2239)
  const pensionProvisions = Math.abs(sumAccountRange(balances, 2210, 2239))
  if (pensionProvisions > 0) fields.push({ code: 7331, value: pensionProvisions })

  // Övriga avsättningar (2250-2299)
  const otherProvisions = Math.abs(sumAccountRange(balances, 2250, 2299))
  if (otherProvisions > 0) fields.push({ code: 7333, value: otherProvisions })

  // Långfristiga skulder (2300-2399)
  const longTermLiabilities = Math.abs(sumAccountRange(balances, 2300, 2399))
  if (longTermLiabilities > 0) fields.push({ code: 7352, value: longTermLiabilities })

  // Checkräkningskredit (2410-2419)
  const overdraft = Math.abs(sumAccountRange(balances, 2410, 2419))
  if (overdraft > 0) fields.push({ code: 7360, value: overdraft })

  // Leverantörsskulder (2440-2449)
  const accountsPayable = Math.abs(sumAccountRange(balances, 2440, 2449))
  if (accountsPayable > 0) fields.push({ code: 7365, value: accountsPayable })

  // Skatteskulder (2500-2599) + Personalens källskatt (2700-2799)
  let taxLiabilities = Math.abs(sumAccountRange(balances, 2500, 2599))
  taxLiabilities += Math.abs(sumAccountRange(balances, 2700, 2799))
  if (taxLiabilities > 0) fields.push({ code: 7368, value: taxLiabilities })

  // Övriga kortfristiga skulder (2800-2899)
  const otherShortTermLiabilities = Math.abs(sumAccountRange(balances, 2800, 2899))
  if (otherShortTermLiabilities > 0) fields.push({ code: 7369, value: otherShortTermLiabilities })

  // Upplupna kostnader (2900-2999)
  const accruedExpenses = Math.abs(sumAccountRange(balances, 2900, 2999))
  if (accruedExpenses > 0) fields.push({ code: 7370, value: accruedExpenses })

  return fields
}
