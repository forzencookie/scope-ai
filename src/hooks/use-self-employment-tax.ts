/**
 * Self-Employment Tax Hook — Egenavgifter for EF/HB/KB
 *
 * Calculates estimated egenavgifter from current profit using
 * rates from useAllTaxRates.
 */

import { useMemo } from 'react'
import { useNormalizedBalances } from './use-normalized-balances'
import { useAllTaxRates } from './use-tax-parameters'
import { useCompany } from '@/providers/company-provider'

export interface SelfEmploymentTaxData {
  /** Estimated profit (revenue - expenses) */
  estimatedProfit: number
  /** Egenavgifter rate used (e.g. 0.2821) */
  rate: number
  /** Total egenavgifter amount */
  egenavgifterAmount: number
  /** Monthly provision for F-skatt */
  monthlyProvision: number
  /** Whether this hook is applicable (EF/HB/KB only) */
  isApplicable: boolean
  isLoading: boolean
}

export function useSelfEmploymentTax(): SelfEmploymentTaxData {
  const { companyType } = useCompany()
  const { totals, isLoading: isLoadingBalances } = useNormalizedBalances()
  const currentYear = new Date().getFullYear()
  const { rates, isLoading: isLoadingRates } = useAllTaxRates(currentYear)

  const data = useMemo((): Omit<SelfEmploymentTaxData, 'isLoading'> => {
    const isApplicable = companyType === 'ef' || companyType === 'hb' || companyType === 'kb'

    if (!isApplicable) {
      return {
        estimatedProfit: 0,
        rate: 0,
        egenavgifterAmount: 0,
        monthlyProvision: 0,
        isApplicable: false,
      }
    }

    const estimatedProfit = totals.netIncome
    const rate = rates?.egenavgifterFull ?? 0.2821 // Fallback to 2024 rate
    const egenavgifterAmount = Math.max(0, estimatedProfit * rate)
    const monthlyProvision = egenavgifterAmount / 12

    return {
      estimatedProfit,
      rate,
      egenavgifterAmount,
      monthlyProvision,
      isApplicable: true,
    }
  }, [totals, rates, companyType])

  return { ...data, isLoading: isLoadingBalances || isLoadingRates }
}
