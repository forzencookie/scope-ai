import { useMemo, useCallback } from "react"
import { useCompliance } from "@/hooks/use-compliance"
import { useToast } from "@/components/ui/toast"
import { useK10Calculation } from "@/components/rapporter/k10/use-k10-calculation"
import { useDividends } from "@/hooks/use-dividends"
import { DividendDecision } from "./types"
export type { DividendDecision }

export function useDividendLogic() {
    const { documents: realDocuments, addDocument, updateDocument, refetchDocs } = useCompliance()
    const toast = useToast()
    const { k10Data } = useK10Calculation()
    const { freeEquity } = useDividends()

    // ABL 17:3 — distributable equity
    const distributableEquity = freeEquity

    // Calculate dividend tax respecting gränsbelopp from K10
    const calculateDividendTax = (amount: number): { tax: number; taxRate: string } => {
        const gransbelopp = k10Data.gransbelopp || 0

        if (gransbelopp <= 0 || amount <= gransbelopp) {
            return { tax: Math.round(amount * 0.2), taxRate: '20%' }
        }

        const capitalPart = gransbelopp
        const incomePart = amount - gransbelopp
        const capitalTax = Math.round(capitalPart * 0.2)
        const incomeTax = Math.round(incomePart * 0.32)
        const totalTax = capitalTax + incomeTax
        const effectiveRate = Math.round((totalTax / amount) * 100)

        return { tax: totalTax, taxRate: `~${effectiveRate}% (blandat)` }
    }

    // Parse dividend decisions from meeting documents
    const realDividendHistory = useMemo<DividendDecision[]>(() => {
        const history: DividendDecision[] = []

        const meetings = (realDocuments || [])
            .filter(doc => doc.meetingCategory === 'bolagsstamma')

        meetings.forEach(meeting => {
            (meeting.decisions || [])
                .filter((d) => d.type === 'dividend' && d.amount)
                .forEach((d) => {
                    const amount = d.amount || 0
                    const { tax, taxRate } = calculateDividendTax(amount)

                    let status: 'planned' | 'decided' | 'booked' = 'planned'
                    if (d.booked) {
                        status = 'booked'
                    } else if (meeting.status === 'protokoll signerat') {
                        status = 'decided'
                    }

                    history.push({
                        id: `${meeting.id}-${d.id}`,
                        year: Number(meeting.year || new Date(meeting.date).getFullYear()),
                        amount,
                        taxRate,
                        tax,
                        netAmount: amount - tax,
                        status,
                        meetingId: meeting.id,
                        meetingDate: meeting.date,
                        decisionId: d.id ?? '',
                    })
                })
        })

        return history.sort((a, b) => b.year - a.year)
    }, [realDocuments, k10Data.gransbelopp])

    // Step 1: Plan a dividend (creates draft meeting)
    const planDividend = async (year: number, amount: number, meetingDate?: string) => {
        if (!amount || !year) return

        if (distributableEquity < amount) {
            toast.error(
                "Otillräckligt fritt eget kapital",
                `Utdelningsbart kapital: ${distributableEquity.toLocaleString('sv-SE')} kr. ` +
                `Föreslagen utdelning: ${amount.toLocaleString('sv-SE')} kr. ` +
                `Enligt ABL 17:3 kan bolaget inte dela ut mer än det fria egna kapitalet.`
            )
            return
        }

        const date = meetingDate || new Date().toISOString().split('T')[0]
        
        try {
            await addDocument({
                type: 'annual', // Usually extra but mapped to general_meeting_minutes in compliance hook
                title: `Extra bolagsstämma - Utdelning ${year}`,
                date,
                status: 'draft',
            })

            toast.success(
                "Utdelning planerad",
                `Förslag om ${amount.toLocaleString('sv-SE')} kr registrerat. Kalla till stämma för att besluta.`
            )
            await refetchDocs()
        } catch (err) {
            console.error('[planDividend] Failed:', err)
            toast.error("Fel", "Kunde inte registrera utdelningsförslaget.")
        }
    }

    const bookDividend = async (meetingId: string, decisionId: string) => {
        const meeting = realDocuments.find(m => m.id === meetingId)
        if (!meeting) return

        const decision = meeting.decisions.find(d => d.id === decisionId)
        if (!decision || !decision.amount) return

        const updatedDecisions = meeting.decisions.map(d => 
            d.id === decisionId ? { ...d, booked: true } : d
        )

        try {
            await updateDocument({
                id: meetingId,
                decisions: updatedDecisions,
            })
            await refetchDocs()
            toast.success("Utdelning markerad som bokförd")
        } catch (err) {
            console.error('[bookDividend] Failed:', err)
            toast.error("Fel", "Kunde inte uppdatera status.")
        }
    }

    const registerDividend = async (year: number, amount: number) => {
        await planDividend(year, amount)
    }

    const stats = useMemo(() => {
        const currentYear = new Date().getFullYear()
        const currentYearDividends = realDividendHistory.filter(d => d.year === currentYear)
        
        const planerad = currentYearDividends
            .filter(d => d.status === 'planned')
            .reduce((sum, d) => sum + d.amount, 0)
        const beslutad = currentYearDividends
            .filter(d => d.status === 'decided')
            .reduce((sum, d) => sum + d.amount, 0)
        const bokford = currentYearDividends
            .filter(d => d.status === 'booked')
            .reduce((sum, d) => sum + d.amount, 0)

        const totalActive = planerad + beslutad
        const { tax: skatt } = calculateDividendTax(totalActive)

        return {
            gransbelopp: k10Data.gransbelopp,
            planerad,
            beslutad,
            bokford,
            skatt,
            distributableEquity,
        }
    }, [k10Data.gransbelopp, realDividendHistory, distributableEquity])

    return {
        k10Data,
        realDividendHistory,
        stats,
        distributableEquity,
        planDividend,
        bookDividend,
        registerDividend,
    }
}
