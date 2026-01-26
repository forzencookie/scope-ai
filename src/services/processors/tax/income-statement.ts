/**
 * INK2R Income Statement Field Calculator
 * Maps BAS accounts to SRU field codes for Swedish tax declarations
 */

import type { SRUField } from "@/types/sru"
import type { AccountBalance } from './types'
import { sumAccountRange } from './types'

/**
 * Calculate INK2R Income Statement fields
 */
export function calculateIncomeStatement(balances: Map<string, AccountBalance>): SRUField[] {
  const fields: SRUField[] = []

  // Revenue (Intäkter) - accounts 3000-3999

  // Nettoomsättning (3000-3799)
  const revenue = Math.abs(sumAccountRange(balances, 3000, 3799))
  if (revenue > 0) fields.push({ code: 7410, value: revenue })

  // Övriga rörelseintäkter (3900-3999)
  const otherOperatingIncome = Math.abs(sumAccountRange(balances, 3900, 3999))
  if (otherOperatingIncome > 0) fields.push({ code: 7413, value: otherOperatingIncome })

  // Expenses (Kostnader) - accounts 4000-7999

  // Råvaror och förnödenheter (4000-4099)
  const rawMaterials = Math.abs(sumAccountRange(balances, 4000, 4099))
  if (rawMaterials > 0) fields.push({ code: 7511, value: rawMaterials })

  // Handelsvaror (4100-4899)
  const goods = Math.abs(sumAccountRange(balances, 4100, 4899))
  if (goods > 0) fields.push({ code: 7512, value: goods })

  // Övriga externa kostnader (5000-6999)
  const otherExternalExpenses = Math.abs(sumAccountRange(balances, 5000, 6999))
  if (otherExternalExpenses > 0) fields.push({ code: 7513, value: otherExternalExpenses })

  // Personalkostnader (7000-7699)
  const personnelCosts = Math.abs(sumAccountRange(balances, 7000, 7699))
  if (personnelCosts > 0) fields.push({ code: 7514, value: personnelCosts })

  // Avskrivningar (7800-7899)
  const depreciation = Math.abs(sumAccountRange(balances, 7800, 7899))
  if (depreciation > 0) fields.push({ code: 7515, value: depreciation })

  // Övriga rörelsekostnader (7900-7999)
  const otherOperatingExpenses = Math.abs(sumAccountRange(balances, 7900, 7999))
  if (otherOperatingExpenses > 0) fields.push({ code: 7517, value: otherOperatingExpenses })

  // Financial items (8000-8999)

  // Ränteintäkter (8300-8399)
  const interestIncome = Math.abs(sumAccountRange(balances, 8300, 8399))
  if (interestIncome > 0) fields.push({ code: 7417, value: interestIncome })

  // Räntekostnader (8400-8499)
  const interestExpenses = Math.abs(sumAccountRange(balances, 8400, 8499))
  if (interestExpenses > 0) fields.push({ code: 7522, value: interestExpenses })

  // Bokslutsdispositioner - Mottagna koncernbidrag (8810-8819)
  const closingDispositionsPos = Math.abs(sumAccountRange(balances, 8810, 8819))
  if (closingDispositionsPos > 0) fields.push({ code: 7419, value: closingDispositionsPos })

  // Skatt på årets resultat (8900-8999)
  const incomeTax = Math.abs(sumAccountRange(balances, 8900, 8999))
  if (incomeTax > 0) fields.push({ code: 7528, value: incomeTax })

  // Calculate net result
  const totalRevenue = revenue + otherOperatingIncome + interestIncome + closingDispositionsPos
  const totalExpenses = rawMaterials + goods + otherExternalExpenses + personnelCosts +
    depreciation + otherOperatingExpenses + interestExpenses + incomeTax
  const netResult = totalRevenue - totalExpenses

  if (netResult >= 0) {
    fields.push({ code: 7450, value: netResult }) // Vinst
  } else {
    fields.push({ code: 7550, value: Math.abs(netResult) }) // Förlust
  }

  return fields
}
