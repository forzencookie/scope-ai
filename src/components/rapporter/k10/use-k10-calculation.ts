import { useMemo } from "react"
import { useCompany } from "@/providers/company-provider"
import { useVerifications } from "@/hooks/use-verifications"
import { useTaxPeriod } from "@/hooks/use-tax-period"
import { useTaxParameters } from "@/hooks/use-tax-parameters"
import { k10Declarations } from "@/components/loner/constants"

export interface K10Data {
    year: string
    schablonbelopp: number
    lonebaseratUtrymme: number
    gransbelopp: number
    totalDividends: number
    remainingUtrymme: number
    aktiekapital: number
    omkostnadsbelopp: number
    agarandel: number
    egenLon: number
    klararLonekrav: boolean
}

export function useK10Calculation() {
    const { company } = useCompany()
    const { verifications } = useVerifications()

    // Get dynamic beskattningsår using shared hook
    const { taxYear } = useTaxPeriod({ 
        fiscalYearEnd: company?.fiscalYearEnd || '12-31',
        type: 'k10' 
    })

    const { params } = useTaxParameters(taxYear.year)

    // Calculate K10 using dynamic year & real ledger data
    const k10Data = useMemo<K10Data>(() => {
        // Constants fetched from System Parameters (with fallback)
        const ibb = params.ibb
        const schablonRate = params.schablonRate
        
        const aktiekapital = 25000 // Common min since 2020
        const omkostnadsbelopp = 25000 // Assumed equal to limits
        const agarandel = 100 // Assumed 100% for single owner view

        // Filter verifications for the tax year
        const yearVerifications = verifications.filter(v => v.date.startsWith(taxYear.year.toString()))

        // Calculate Total Salaries (Löneunderlag) - Accounts 70xx-73xx
        // Debit increases expense (positive salary cost)
        const arslonSumma = yearVerifications.reduce((sum, v) => {
            return sum + v.rows.reduce((rowSum, r) => {
                const acc = parseInt(r.account)
                if (acc >= 7000 && acc <= 7399) return rowSum + r.debit
                return rowSum
            }, 0)
        }, 0)

        // Calculate Owner's Salary - Check for specific account usually used for owner
        // Often 7220 "Lön till företagsledare"
        const egenLon = yearVerifications.reduce((sum, v) => {
            return sum + v.rows.reduce((rowSum, r) => {
                const acc = parseInt(r.account)
                if (acc === 7220) return rowSum + r.debit
                return rowSum
            }, 0)
        }, 0)

        // Calculate Dividends Taken - Account 2898 "Outnyttjade vinstmedel" (Debit when paid out)
        // Or 8910 "Skatt på årets resultat"? No, usually booked against Equity.
        // Let's assume 2898 Debit = Dividend Payout
        const totalDividends = yearVerifications.reduce((sum, v) => {
            return sum + v.rows.reduce((rowSum, r) => {
                const acc = parseInt(r.account)
                if (acc === 2898 && r.debit > 0) return rowSum + r.debit
                return rowSum
            }, 0)
        }, 0)

        // Schablonbelopp (2.75 * IBB * 9.65%? No, the rule is 2.75 * IBB * ownership portion, wait.)
        // Original code said: const schablonbelopp = Math.round(ibb2024 * 2.75 * schablonRate * (agarandel / 100))
        // But schablonRate was undefined in the second implementation in original file.
        // Actually, Förenklingsregeln says: 2.75 * IBB. That's it.
        // But the previous file had: `const schablonRate = 2.75` and `const schablonbelopp = Math.round(ibb2024 * schablonRate * (agarandel / 100))`
        // That matches the simplification rule (2.75 IBB shared among shares).
        const schablonbelopp = Math.round(ibb * schablonRate * (agarandel / 100))

        // Lönebaserat utrymme (Main rule)
        // 50% of total salaries
        // Requirement: Owner salary must be >= 6 IBB + 5% of total salaries OR 9.6 IBB
        const lonekrav1 = (6 * ibb) + (0.05 * arslonSumma)
        const lonekrav2 = 9.6 * ibb
        const minLonKrav = Math.min(lonekrav1, lonekrav2)

        const klararLonekrav = egenLon >= minLonKrav
        const lonebaseratUtrymme = klararLonekrav ? Math.round(arslonSumma * 0.5 * (agarandel / 100)) : 0

        // Total Gränsbelopp (Max of Main vs Simplification)
        const gransbelopp = Math.max(schablonbelopp, lonebaseratUtrymme)

        // Saved space from previous years (from K10 declarations history)
        const historicalData = k10Declarations.find(d => d.year === (taxYear.year - 1).toString())
        const ingaendeSparat = historicalData ? historicalData.savedAmount : 0

        const totaltUtrymme = gransbelopp + ingaendeSparat
        const remainingUtrymme = totaltUtrymme - totalDividends

        return {
            year: taxYear.year.toString(),
            schablonbelopp,
            lonebaseratUtrymme,
            gransbelopp: totaltUtrymme,
            totalDividends,
            remainingUtrymme,
            aktiekapital,
            omkostnadsbelopp,
            agarandel,
            egenLon,
            klararLonekrav
        }
    }, [taxYear.year, verifications, params.ibb, params.schablonRate])

    return {
        k10Data,
        taxYear
    }
}
