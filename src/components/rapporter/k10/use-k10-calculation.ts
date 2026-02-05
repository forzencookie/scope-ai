import { useMemo, useEffect, useState } from "react"
import { useCompany } from "@/providers/company-provider"
import { useVerifications } from "@/hooks/use-verifications"
import { useTaxPeriod } from "@/hooks/use-tax-period"
import { useTaxParameters } from "@/hooks/use-tax-parameters"
import { useCompliance } from "@/hooks/use-compliance"

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
    hasData: boolean // Flag to indicate if real data exists
    sparatUtdelningsutrymme: number // Saved space from previous K10 declarations
}

interface K10Report {
    tax_year: number
    data: {
        remainingUtrymme?: number
        gransbelopp?: number
        totalDividends?: number
    }
}

export function useK10Calculation() {
    const { company } = useCompany()
    const { verifications } = useVerifications()
    const { shareholders } = useCompliance()
    const [k10History, setK10History] = useState<K10Report[]>([])

    // Get dynamic beskattningsår using shared hook
    const { taxYear } = useTaxPeriod({
        fiscalYearEnd: company?.fiscalYearEnd || '12-31',
        type: 'k10'
    })

    const { params } = useTaxParameters(taxYear.year)

    // Fetch K10 history to calculate sparat utdelningsutrymme
    useEffect(() => {
        async function fetchK10History() {
            try {
                const response = await fetch('/api/reports/k10')
                if (response.ok) {
                    const { reports } = await response.json()
                    setK10History(reports || [])
                }
            } catch (error) {
                console.error('Failed to fetch K10 history:', error)
            }
        }
        fetchK10History()
    }, [])

    // Calculate K10 using dynamic year & real ledger data
    const k10Data = useMemo<K10Data>(() => {
        // Constants fetched from System Parameters (with fallback)
        const ibb = params.ibb
        const schablonRate = params.schablonRate
        
        // Get aktiekapital from company data or use default minimum
        const aktiekapital = company?.shareCapital || 25000
        const omkostnadsbelopp = aktiekapital // Assumed equal to share capital for simplicity
        
        // Calculate ownership percentage from shareholders data
        // If no shareholders data, assume 100%
        const totalShares = shareholders.reduce((sum, s) => sum + (s.shares_count || 0), 0)
        const primaryShareholder = shareholders.length > 0 ? shareholders[0] : null
        const primaryShares = primaryShareholder?.shares_count || 0
        const agarandel = totalShares > 0 ? Math.round((primaryShares / totalShares) * 100) : 100

        // Filter verifications for the tax year
        const yearVerifications = verifications.filter(v => v.date.startsWith(taxYear.year.toString()))
        
        // Check if we have any real data
        const hasData = yearVerifications.length > 0 || shareholders.length > 0

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

        // Calculate sparat utdelningsutrymme from previous K10 declarations
        // Sum up remainingUtrymme from all previous years
        const sparatUtdelningsutrymme = k10History
            .filter(report => report.tax_year < taxYear.year)
            .reduce((sum, report) => {
                const remaining = report.data?.remainingUtrymme || 0
                return sum + (remaining > 0 ? remaining : 0)
            }, 0)

        const totaltUtrymme = gransbelopp + sparatUtdelningsutrymme
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
            klararLonekrav,
            hasData,
            sparatUtdelningsutrymme
        }
    }, [taxYear.year, verifications, params.ibb, params.schablonRate, shareholders, company?.shareCapital, k10History])

    return {
        k10Data,
        taxYear
    }
}
