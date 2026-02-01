import { useMemo } from "react"
import { useVerifications } from "@/hooks/use-verifications"
import { useCompliance } from "@/hooks/use-compliance"
import { useToast } from "@/components/ui/toast"
import { useK10Calculation } from "@/components/rapporter/k10/use-k10-calculation"

export function useDividendLogic() {
    const { addVerification } = useVerifications()
    const { documents: realDocuments, addDocument } = useCompliance()
    const toast = useToast()
    const { k10Data } = useK10Calculation()

    const realDividendHistory = useMemo(() => {
        const history: { year: number; amount: number; taxRate: string; tax: number; netAmount: number; status: string }[] = []

        const meetings = (realDocuments || [])
            .filter(doc => doc.type === 'general_meeting_minutes')
            .map(doc => {
                let content = { year: new Date(doc.date).getFullYear(), decisions: [] }
                try { 
                    const parsed = JSON.parse(doc.content);
                    content = { ...content, ...parsed }
                } catch { } // Ignored
                return { ...content, date: doc.date, status: doc.status }
            })

        meetings.forEach(meeting => {
            (meeting.decisions || [])
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .filter((d: any) => d.type === 'dividend' && d.amount)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .forEach((d: any) => {
                    const amount = d.amount || 0
                    const tax = amount * 0.2 // Simplified 20% tax rule
                    history.push({
                        year: Number(meeting.year || new Date(meeting.date).getFullYear()),
                        amount: amount,
                        taxRate: '20%',
                        tax: tax,
                        netAmount: amount - tax,
                        status: d.booked || meeting.status === 'signed' ? 'paid' : 'planned'
                    })
                })
        })

        return history.sort((a, b) => b.year - a.year)
    }, [realDocuments])

    const registerDividend = async (year: number, amount: number) => {
        if (!amount || !year) return

        const meetingDate = new Date().toISOString().split('T')[0]

        // 1. Create General Meeting Document
        await addDocument({
            type: 'general_meeting_minutes',
            title: `Extra bolagsstämma - Utdelning ${year}`,
            date: meetingDate,
            content: JSON.stringify({
                year: year,
                location: 'Digitalt beslut',
                type: 'extra',
                decisions: [{
                    id: `gmd-${Math.random().toString(36).substr(2, 9)}`,
                    title: 'Beslut om vinstutdelning',
                    decision: `Stämman beslutade att dela ut ${amount} kr till aktieägarna.`,
                    type: 'dividend',
                    amount: amount,
                    booked: true
                }],
                attendeesCount: 1
            }),
            status: 'signed',
            source: 'manual'
        })

        // 2. Book Verification
        await addVerification({
            description: `Utdelning ${year}`,
            date: meetingDate,
            rows: [
                {
                    account: "2091", // Balanserad vinst
                    debit: amount,
                    credit: 0,
                    description: "Minskning av fritt eget kapital"
                },
                {
                    account: "1930", // Bankkonto
                    debit: 0,
                    credit: amount,
                    description: "Utbetalning av utdelning"
                }
            ]
        })

        toast.success(
            "Utdelning registrerad",
            `Beslut protokollfört och ${amount.toLocaleString('sv-SE')} kr utbetalt.`
        )
    }

    const stats = useMemo(() => {
        const currentYear = new Date().getFullYear()
        const planerad = realDividendHistory
            .filter(d => d.year === currentYear && d.status === 'planned')
            .reduce((sum, d) => sum + d.amount, 0)
        const skatt = Math.round(planerad * 0.2)
        return {
            gransbelopp: k10Data.gransbelopp,
            planerad,
            skatt,
            netto: planerad - skatt,
        }
    }, [k10Data.gransbelopp, realDividendHistory])

    return {
        k10Data,
        realDividendHistory,
        stats,
        registerDividend
    }
}
