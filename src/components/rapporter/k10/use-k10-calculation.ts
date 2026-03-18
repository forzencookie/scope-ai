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
    rantebaseratUtrymme: number
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
    const { verifications, isLoading } = useVerifications()
    const { shareholders } = useCompliance()
    const [k10History, setK10History] = useState<K10Report[]>([])
    const [selectedShareholderIdx, setSelectedShareholderIdx] = useState(0)

    // Get dynamic beskattningsår using shared hook
    const { taxYear, setYear, availableYears } = useTaxPeriod({
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
        if (!params) {
            return {
                year: String(taxYear.year),
                schablonbelopp: 0,
                lonebaseratUtrymme: 0,
                rantebaseratUtrymme: 0,
                gransbelopp: 0,
                totalDividends: 0,
                remainingUtrymme: 0,
                aktiekapital: 0,
                omkostnadsbelopp: 0,
                agarandel: 0,
                egenLon: 0,
                klararLonekrav: false,
                hasData: false,
                sparatUtdelningsutrymme: 0,
            }
        }
        const ibb = params.ibb
        const schablonRate = params.schablonRate

        const aktiekapital = company?.shareCapital || 0
        const omkostnadsbelopp = aktiekapital

        // Calculate ownership percentage for selected shareholder
        const totalShares = shareholders.reduce((sum, s) => sum + (s.sharesCount || 0), 0)
        const selectedShareholder = shareholders.length > 0 ? shareholders[selectedShareholderIdx] || shareholders[0] : null
        const selectedShares = selectedShareholder?.sharesCount || 0
        const agarandel = totalShares > 0 ? Math.round((selectedShares / totalShares) * 100) : 100

        // Filter verifications for the tax year
        const yearVerifications = verifications.filter(v => v.date.startsWith(taxYear.year.toString()))
        const hasData = yearVerifications.length > 0 || shareholders.length > 0

        // Calculate Total Salaries (Löneunderlag) - Accounts 70xx-73xx
        const arslonSumma = yearVerifications.reduce((sum, v) => {
            return sum + v.rows.reduce((rowSum, r) => {
                const acc = parseInt(r.account)
                if (acc >= 7000 && acc <= 7399) return rowSum + r.debit
                return rowSum
            }, 0)
        }, 0)

        // Calculate Owner's Salary - Accounts 7210-7229 (Lön till företagsledare/delägare)
        const egenLon = yearVerifications.reduce((sum, v) => {
            return sum + v.rows.reduce((rowSum, r) => {
                const acc = parseInt(r.account)
                if (acc >= 7210 && acc <= 7229) return rowSum + r.debit
                return rowSum
            }, 0)
        }, 0)

        // Calculate Dividends Taken
        // 2091 = Balanserad vinst, 2098 = Vinst/förlust, 2898 = Outtagen vinstutdelning
        const dividendAccounts = [2091, 2098, 2898]
        const totalDividends = yearVerifications.reduce((sum, v) => {
            return sum + v.rows.reduce((rowSum, r) => {
                const acc = parseInt(r.account)
                if (dividendAccounts.includes(acc) && r.debit > 0) return rowSum + r.debit
                return rowSum
            }, 0)
        }, 0)

        // Per-shareholder dividend portion (proportional to ownership)
        const shareholderDividends = Math.round(totalDividends * (agarandel / 100))

        // Förenklingsregeln: schablonRate (2.75) × IBB × ägarandel
        const schablonbelopp = Math.round(ibb * schablonRate * (agarandel / 100))

        // Lönebaserat utrymme (Main rule)
        // Requirement: Owner salary must be >= min(6×IBB + 5%×löner, 9.6×IBB)
        const lonekrav1 = (6 * ibb) + (0.05 * arslonSumma)
        const lonekrav2 = 9.6 * ibb
        const minLonKrav = Math.min(lonekrav1, lonekrav2)

        const klararLonekrav = egenLon >= minLonKrav
        const lonebaseratUtrymme = klararLonekrav ? Math.round(arslonSumma * 0.5 * (agarandel / 100)) : 0

        // Räntebaserat utrymme: omkostnadsbelopp × (statslåneränta + 9pp) × ägarandel
        const rantebaseratUtrymme = Math.round(omkostnadsbelopp * params.rantebaseratRate * (agarandel / 100))

        const huvudregel = lonebaseratUtrymme + rantebaseratUtrymme
        const gransbelopp = Math.max(schablonbelopp, huvudregel)

        // Sparat utdelningsutrymme with uppräkning (statslåneränta + 3%)
        const sparatUtdelningsutrymme = k10History
            .filter(report => report.tax_year < taxYear.year)
            .reduce((sum, report) => {
                const remaining = report.data?.remainingUtrymme || 0
                if (remaining <= 0) return sum
                // Uppräkning: remaining × (statslåneränta + 3%)
                // Use rantebaseratRate as proxy (statslåneränta + 9pp), adjust: SLR ≈ rantebaseratRate - 0.09
                const slr = Math.max(0, (params.rantebaseratRate || 0.09) - 0.09)
                const upprakningRate = slr + 0.03
                const yearsAgo = taxYear.year - report.tax_year
                const uppraknat = Math.round(remaining * Math.pow(1 + upprakningRate, yearsAgo))
                return sum + uppraknat
            }, 0)

        const totaltUtrymme = gransbelopp + sparatUtdelningsutrymme
        const remainingUtrymme = totaltUtrymme - shareholderDividends

        return {
            year: taxYear.year.toString(),
            schablonbelopp,
            lonebaseratUtrymme,
            rantebaseratUtrymme,
            gransbelopp: totaltUtrymme,
            totalDividends: shareholderDividends,
            remainingUtrymme,
            aktiekapital,
            omkostnadsbelopp,
            agarandel,
            egenLon,
            klararLonekrav,
            hasData,
            sparatUtdelningsutrymme
        }
    }, [taxYear.year, verifications, params?.ibb, params?.schablonRate, params?.rantebaseratRate, shareholders, company?.shareCapital, k10History, selectedShareholderIdx])

    return {
        k10Data,
        taxYear,
        setYear,
        availableYears,
        isLoading,
        shareholders,
        selectedShareholderIdx,
        setSelectedShareholderIdx,
    }
}
