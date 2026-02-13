import { useMemo } from "react"
import { useVerifications } from "@/hooks/use-verifications"
import { useCompliance } from "@/hooks/use-compliance"
import { useToast } from "@/components/ui/toast"
import { useK10Calculation } from "@/components/rapporter/k10/use-k10-calculation"

export interface DividendDecision {
    id: string
    year: number
    amount: number
    taxRate: string
    tax: number
    netAmount: number
    status: 'planned' | 'decided' | 'booked'
    meetingId: string
    meetingDate: string
    decisionId: string
}

export function useDividendLogic() {
    const { verifications, addVerification } = useVerifications()
    const { documents: realDocuments, addDocument, updateDocument } = useCompliance()
    const toast = useToast()
    const { k10Data } = useK10Calculation()

    // ABL 17:3 — Calculate distributable equity from free equity accounts (2090-2099)
    // Credit balance = positive equity, debit reduces it
    const distributableEquity = useMemo(() => {
        return verifications.reduce((sum, v) => {
            return sum + v.rows.reduce((rowSum, r) => {
                const acc = parseInt(r.account)
                if (acc >= 2090 && acc <= 2099) {
                    // Credits increase equity, debits decrease it
                    return rowSum + (r.credit || 0) - (r.debit || 0)
                }
                return rowSum
            }, 0)
        }, 0)
    }, [verifications])

    // Calculate dividend tax respecting gränsbelopp from K10
    // Within gränsbelopp: 20% capital gains tax
    // Above gränsbelopp: taxed as tjänsteinkomst (~32% municipal + potential state tax ~52%)
    const calculateDividendTax = (amount: number): { tax: number; taxRate: string } => {
        const gransbelopp = k10Data.gransbelopp || 0

        if (gransbelopp <= 0 || amount <= gransbelopp) {
            // Entire amount within gränsbelopp — 20% flat
            return { tax: Math.round(amount * 0.2), taxRate: '20%' }
        }

        // Split: part within gränsbelopp at 20%, excess as tjänsteinkomst
        const capitalPart = gransbelopp
        const incomePart = amount - gransbelopp
        const capitalTax = Math.round(capitalPart * 0.2)
        // Tjänsteinkomst approximation: ~32% municipal tax (varies by municipality)
        // Conservative estimate; actual rate depends on marginal tax bracket
        const incomeTax = Math.round(incomePart * 0.32)
        const totalTax = capitalTax + incomeTax
        const effectiveRate = Math.round((totalTax / amount) * 100)

        return { tax: totalTax, taxRate: `~${effectiveRate}% (blandat)` }
    }

    // Parse dividend decisions from meeting documents
    const realDividendHistory = useMemo<DividendDecision[]>(() => {
        const history: DividendDecision[] = []

        const meetings = (realDocuments || [])
            .filter(doc => doc.type === 'general_meeting_minutes')
            .map(doc => {
                let content = { year: new Date(doc.date).getFullYear(), decisions: [] as any[] }
                try {
                    const parsed = JSON.parse(doc.content)
                    content = { ...content, ...parsed }
                } catch { /* Ignored */ }
                return { id: doc.id, ...content, date: doc.date, status: doc.status }
            })

        meetings.forEach(meeting => {
            (meeting.decisions || [])
                .filter((d: any) => d.type === 'dividend' && d.amount)
                .forEach((d: any) => {
                    const amount = d.amount || 0
                    const { tax, taxRate } = calculateDividendTax(amount)

                    // Determine status based on meeting status and booked flag
                    let status: 'planned' | 'decided' | 'booked' = 'planned'
                    if (d.booked) {
                        status = 'booked'
                    } else if (meeting.status === 'signed') {
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
                        decisionId: d.id,
                    })
                })
        })

        return history.sort((a, b) => b.year - a.year)
    }, [realDocuments, k10Data.gransbelopp])

    // Step 1: Plan a dividend (creates draft meeting)
    const planDividend = async (year: number, amount: number, meetingDate?: string) => {
        if (!amount || !year) return

        // ABL 17:3 solvency check — cannot distribute more than distributable equity
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
        const decisionId = `div-${Math.random().toString(36).substr(2, 9)}`

        await addDocument({
            type: 'general_meeting_minutes',
            title: `Extra bolagsstämma - Utdelning ${year}`,
            date,
            content: JSON.stringify({
                year,
                type: 'extra',
                decisions: [{
                    id: decisionId,
                    title: 'Förslag om vinstutdelning',
                    decision: `Styrelsen föreslår att dela ut ${amount.toLocaleString('sv-SE')} kr till aktieägarna.`,
                    type: 'dividend',
                    amount,
                    booked: false,
                }],
            }),
            status: 'draft',
            source: 'manual',
        })

        toast.success(
            "Utdelning planerad",
            `Förslag om ${amount.toLocaleString('sv-SE')} kr registrerat. Kalla till stämma för att besluta.`
        )
    }

    // Step 2: Book a decided dividend (creates accounting entries)
    const bookDividend = async (dividend: DividendDecision) => {
        if (dividend.status !== 'decided') {
            toast.error("Kan inte bokföra", "Utdelningen måste vara beslutad på stämma först.")
            return
        }

        // ABL 17:3 solvency check at booking time (equity may have changed since planning)
        if (distributableEquity < dividend.amount) {
            toast.error(
                "Otillräckligt fritt eget kapital",
                `Utdelningsbart kapital: ${distributableEquity.toLocaleString('sv-SE')} kr. ` +
                `Beslutad utdelning: ${dividend.amount.toLocaleString('sv-SE')} kr. ` +
                `Utdelningen överskrider fritt eget kapital (ABL 17:3).`
            )
            return
        }

        // Create accounting entries:
        // Step 1: Record liability - Debit 2098 (Vinst föregående år) → Credit 2898 (Utdelningsskuld)
        await addVerification({
            description: `Beslutad utdelning ${dividend.year}`,
            date: dividend.meetingDate,
            rows: [
                {
                    account: "2098",
                    debit: dividend.amount,
                    credit: 0,
                    description: "Minskning av fritt eget kapital",
                },
                {
                    account: "2898",
                    debit: 0,
                    credit: dividend.amount,
                    description: "Skuld till aktieägare",
                },
            ],
        })

        // Update the meeting document to mark decision as booked
        const doc = realDocuments?.find(d => d.id === dividend.meetingId)
        if (doc) {
            const content = JSON.parse(doc.content)
            const decision = content.decisions?.find((d: any) => d.id === dividend.decisionId)
            if (decision) {
                decision.booked = true
                await updateDocument({
                    id: doc.id,
                    content: JSON.stringify(content),
                })
            }
        }

        toast.success(
            "Utdelning bokförd",
            `${dividend.amount.toLocaleString('sv-SE')} kr bokförd som skuld till aktieägare.`
        )
    }

    // Step 3: Pay out dividend (settles the liability)
    const payDividend = async (dividend: DividendDecision, paymentDate?: string) => {
        if (dividend.status !== 'booked') {
            toast.error("Kan inte betala", "Utdelningen måste vara bokförd först.")
            return
        }

        const date = paymentDate || new Date().toISOString().split('T')[0]

        // Settle liability - Debit 2898 (Utdelningsskuld) → Credit 1930 (Bank)
        await addVerification({
            description: `Utbetalning utdelning ${dividend.year}`,
            date,
            rows: [
                {
                    account: "2898",
                    debit: dividend.amount,
                    credit: 0,
                    description: "Reglering utdelningsskuld",
                },
                {
                    account: "1930",
                    debit: 0,
                    credit: dividend.amount,
                    description: "Utbetalning till aktieägare",
                },
            ],
        })

        toast.success(
            "Utdelning utbetald",
            `${dividend.amount.toLocaleString('sv-SE')} kr utbetald till aktieägarna.`
        )
    }

    // Legacy function - now just plans the dividend
    const registerDividend = async (year: number, amount: number) => {
        await planDividend(year, amount)
    }

    const stats = useMemo(() => {
        const currentYear = new Date().getFullYear()

        // Count dividends by status for current year
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
        }
    }, [k10Data.gransbelopp, realDividendHistory])

    return {
        k10Data,
        realDividendHistory,
        stats,
        distributableEquity,
        // Actions
        planDividend,
        bookDividend,
        payDividend,
        registerDividend, // Legacy - now just plans
    }
}
