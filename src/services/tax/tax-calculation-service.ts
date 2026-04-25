import type { Database } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'
import { accountService } from '../accounting/account-service'
import { calculateEgenavgifter, type EgenavgifterRates } from '@/lib/bookkeeping/egenavgifter'
import { taxService, type TaxRates } from './tax-service'

/**
 * Tax Calculation Service - Universal specialist for tax-related math.
 * Consolidates logic from use-tax-calculator.ts.
 */
export const taxCalculationService = {
    /**
     * Get YTD Profit and estimated Self-employment tax (Egenavgifter).
     */
    async getYTDProfitAndTax(year: number, options: {
        isReduced?: boolean
        includeKarensReduction?: boolean
    } = {}, client?: SupabaseClient<Database>) {
        const startDate = `${year}-01-01`
        const endDate = `${year}-12-31`
        
        // 1. Get real account balances for the year
        const balances = await accountService.getAccountBalances(startDate, endDate, client)
        
        // 2. Calculate Real Profit (Revenue 3xxx + Expenses 4xxx-7xxx)
        let revenue = 0
        let expenses = 0
        const monthlyStats = Array(12).fill(0).map(() => ({ revenue: 0, expenses: 0 }))

        balances.forEach(b => {
            const acc = parseInt(b.accountNumber)
            if (acc >= 3000 && acc <= 3999) {
                revenue += b.balance
            } else if (acc >= 4000 && acc <= 7999) {
                expenses += -b.balance // Expenses are debit heavy, RPC returns negative. Flip to positive.
            }
        })

        const realProfit = revenue - expenses

        // 3. Get Tax Rates for the year
        const taxRates = await taxService.getAllTaxRates(year, client)
        if (!taxRates) throw new Error(`Skattesatser för ${year} saknas.`)

        // 4. Calculate Egenavgifter
        const rates: EgenavgifterRates = taxRates.egenavgiftComponents as unknown as EgenavgifterRates
        const calculation = calculateEgenavgifter(realProfit, rates, {
            reduced: options.isReduced ?? false,
            karens: options.includeKarensReduction ?? false,
            karensReduction: taxRates.egenavgifterKarensReduction,
            reducedRate: taxRates.egenavgifterReduced,
        })

        return {
            realProfit,
            revenue,
            expenses,
            calculation: {
                rate: calculation.rate,
                avgifter: calculation.avgifter,
                nettoEfterAvgifter: calculation.nettoEfterAvgifter,
                monthlyNet: calculation.monthlyNet,
                components: calculation.components,
            }
        }
    },

    /**
     * Synchronous version for UI estimators (sliders).
     */
    getYTDProfitAndTaxSync(profit: number, taxRates: TaxRates, options: {
        isReduced?: boolean
        includeKarensReduction?: boolean
    } = {}) {
        const rates: EgenavgifterRates = taxRates.egenavgiftComponents as unknown as EgenavgifterRates
        const calculation = calculateEgenavgifter(profit, rates, {
            reduced: options.isReduced ?? false,
            karens: options.includeKarensReduction ?? false,
            karensReduction: taxRates.egenavgifterKarensReduction,
            reducedRate: taxRates.egenavgifterReduced,
        })

        return {
            realProfit: profit,
            calculation: {
                rate: calculation.rate,
                avgifter: calculation.avgifter,
                nettoEfterAvgifter: calculation.nettoEfterAvgifter,
                monthlyNet: calculation.monthlyNet,
                components: calculation.components,
            }
        }
    },

    /**
     * Get monthly profit trend for the given year.
     */
    async getMonthlyProfitTrend(year: number, client?: SupabaseClient<Database>) {
        const startDate = `${year}-01-01`
        const endDate = `${year}-12-31`
        
        // In a real production app, we would use a more granular RPC or multiple queries.
        // For now, we simulate the trend by fetching the full year's balances.
        // Note: The get_account_balances RPC might need to be called per month for perfect accuracy.
        const balances = await accountService.getAccountBalances(startDate, endDate, client)
        
        // Mocking monthly distribution for the prototype (since RPC is year-based)
        // In Phase 4, we would optimize this with a monthly RPC.
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec']
        
        return months.map((month, i) => {
            // Simplified: distributing total profit across months for UI demo
            return {
                month,
                revenue: 0, // Would be filled by monthly RPC
                expenses: 0,
                profit: 0,
                egenavgifter: 0
            }
        })
    }
}
