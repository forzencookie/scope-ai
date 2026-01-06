"use client"

import { useState, useMemo, useEffect } from "react"
import {
    Calendar,
    Wallet,
    Bot,
    Send,
    Download,
    User,
    CheckCircle2,
    Clock,
    DollarSign,
    Calculator,
    TrendingUp,
    Expand,
    AlertTriangle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"

import { SectionCard } from "@/components/ui/section-card"
import { SearchBar } from "@/components/ui/search-bar"

import { IconButton, IconButtonGroup } from "@/components/ui/icon-button"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { termExplanations, dividendHistory, k10Declarations } from "@/components/loner/constants"
import { useVerifications } from "@/hooks/use-verifications"
import { useToast } from "@/components/ui/toast"
import { useTextMode } from "@/providers/text-mode-provider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Dividend table sub-component
interface DividendTableProps {
    data: typeof dividendHistory
    className?: string
}

function DividendTable({ data, className }: DividendTableProps) {
    return (
        <table className={cn("w-full text-sm border-y-2 border-border/60", className)}>
            <thead>
                <tr className="bg-muted/30 text-muted-foreground">
                    <th className="text-left px-3 py-2 font-medium">
                        <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            År
                        </span>
                    </th>
                    <th className="text-right px-3 py-2 font-medium">
                        <span className="flex items-center justify-end gap-1.5">
                            <Wallet className="h-3.5 w-3.5" />
                            Belopp
                        </span>
                    </th>
                    <th className="text-right px-3 py-2 font-medium">
                        <span className="flex items-center justify-end gap-1.5">
                            <Calculator className="h-3.5 w-3.5" />
                            Skatt
                        </span>
                    </th>
                    <th className="text-right px-3 py-2 font-medium">
                        <span className="flex items-center justify-end gap-1.5">
                            <DollarSign className="h-3.5 w-3.5" />
                            Netto
                        </span>
                    </th>
                    <th className="text-right px-3 py-2 font-medium">
                        <span className="flex items-center justify-end gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Status
                        </span>
                    </th>
                </tr>
            </thead>
            <tbody>
                {data.map((row) => (
                    <tr key={row.year} className="border-b border-border/40">
                        <td className="px-3 py-2 font-medium">{row.year}</td>
                        <td className="text-right px-3 py-2">{row.amount.toLocaleString("sv-SE")} kr</td>
                        <td className="text-right px-3 py-2 text-red-600 dark:text-red-500/70">{row.tax.toLocaleString("sv-SE")} kr</td>
                        <td className="text-right px-3 py-2 font-medium">{row.netAmount.toLocaleString("sv-SE")} kr</td>
                        <td className="text-right px-3 py-2">
                            <AppStatusBadge
                                status={row.status === "planned" ? "Planerad" : "Utbetald"}
                            />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

import { useCompliance } from "@/hooks/use-compliance"

export function UtdelningContent() {
    const { documents: realDocuments, isLoadingDocuments, addDocument } = useCompliance()
    const { addVerification } = useVerifications()
    const toast = useToast()
    const { text } = useTextMode()

    const [showAIDialog, setShowAIDialog] = useState(false)
    const [showRegisterDialog, setShowRegisterDialog] = useState(false)
    const [registerAmount, setRegisterAmount] = useState("")
    const [registerYear, setRegisterYear] = useState(new Date().getFullYear().toString())

    // Fetch stats from server
    const [stats, setStats] = useState({
        gransbelopp: 195250, // Default fallback
        planerad: 150000,
        skatt: 30000
    })

    useEffect(() => {
        async function fetchStats() {
            const { supabase } = await import('@/lib/supabase')
            const currentYear = new Date().getFullYear()
            const { data, error } = await supabase.rpc('get_dividend_stats', { target_year: currentYear })

            if (!error && data) {
                setStats({
                    gransbelopp: Number(data.gransbelopp) || 0,
                    planerad: Number(data.planerad) || 0,
                    skatt: Number(data.skatt) || 0
                })
            }
        }
        fetchStats()
    }, [])

    const [step, setStep] = useState(1)
    const [chatInput, setChatInput] = useState("")
    const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "ai", text: string }>>([])

    const [useAIRecommendation, setUseAIRecommendation] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    // Derive dividend history from real documents
    const realDividendHistory = useMemo(() => {
        const history: typeof dividendHistory = []

        const meetings = (realDocuments || [])
            .filter(doc => doc.type === 'general_meeting_minutes')
            .map(doc => {
                let content = { year: new Date(doc.date).getFullYear(), decisions: [] }
                try { content = JSON.parse(doc.content) } catch (e) { }
                return { ...content, date: doc.date, status: doc.status }
            })

        meetings.forEach(meeting => {
            (meeting.decisions || [])
                .filter((d: any) => d.type === 'dividend' && d.amount)
                .forEach((d: any) => {
                    const amount = d.amount || 0
                    const tax = amount * 0.2 // Simplified 20% tax rule for demo
                    history.push({
                        year: (meeting.year || new Date(meeting.date).getFullYear()).toString(),
                        amount: amount,
                        taxRate: '20%',
                        tax: tax,
                        netAmount: amount - tax,
                        status: d.booked || meeting.status === 'signed' ? 'paid' : 'planned'
                    })
                })
        })

        // Sort by year descending
        return history.sort((a, b) => Number(b.year) - Number(a.year))
    }, [realDocuments])

    // Use mock history if no real data yet (for smooth transition)
    const displayHistory = realDividendHistory.length > 0 ? realDividendHistory : dividendHistory

    const handleRegisterDividend = async () => {
        const amount = parseInt(registerAmount.replace(/\s/g, ''))
        const year = parseInt(registerYear)

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

        // 2. Book Verification (The Money)
        await addVerification({
            description: `Utdelning ${year}`,
            date: meetingDate,
            rows: [
                {
                    account: "2091 Balanserad vinst",
                    debit: amount,
                    credit: 0,
                    description: "Minskning av fritt eget kapital"
                },
                {
                    account: "1930 Bankkonto",
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

        setShowRegisterDialog(false)
        setRegisterAmount("")
    }

    const filteredK10 = useMemo(() => {
        return k10Declarations.filter(k10 =>
            !searchQuery || k10.year.toString().includes(searchQuery)
        )
    }, [searchQuery])

    // Toggle selection for a single row
    const toggleSelection = (year: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(year)) {
                next.delete(year)
            } else {
                next.add(year)
            }
            return next
        })
    }

    // Toggle all rows
    const toggleAll = () => {
        if (selectedIds.size === k10Declarations.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(k10Declarations.map(k => String(k.year))))
        }
    }

    const resetDialog = () => {
        setStep(1)
        setChatInput("")
        setChatMessages([])
        setUseAIRecommendation(true)
        setShowAIDialog(false)
    }

    const handleSendMessage = () => {
        if (!chatInput.trim()) return
        const userMsg = chatInput.trim()
        setChatMessages(prev => [...prev, { role: "user", text: userMsg }])
        setChatInput("")

        setTimeout(() => {
            let response = "Jag har noterat det. Finns det något mer som påverkar K10-beräkningen?"
            if (userMsg.toLowerCase().includes("aktie") || userMsg.toLowerCase().includes("ägar")) {
                response = "Förstått! Jag har uppdaterat ägarandelen i beräkningen."
            } else if (userMsg.toLowerCase().includes("lönebaserat") || userMsg.toLowerCase().includes("huvudregel")) {
                response = "Noterat! Jag beräknar gränsbeloppet enligt huvudregeln med löneunderlag."
            }
            setChatMessages(prev => [...prev, { role: "ai", text: response }])
        }, 500)
    }



    return (
        <div className="space-y-6">
            {/* Page Heading */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Utdelning</h2>
                        <p className="text-muted-foreground mt-1">
                            Hantera utdelning och K10-underlag.
                        </p>
                    </div>
                </div>
            </div>
            <StatCardGrid columns={3}>
                <StatCard
                    label={`Gränsbelopp ${new Date().getFullYear()}`}
                    value={`${formatCurrency(stats.gransbelopp)}`}
                    subtitle="Schablonmetoden (2,75 IBB)"
                    headerIcon={TrendingUp}
                    tooltip={termExplanations["Gränsbelopp"]}
                />
                <StatCard
                    label="Planerad utdelning"
                    value={`${formatCurrency(stats.planerad)}`}
                    subtitle={stats.planerad <= stats.gransbelopp ? "Inom gränsbeloppet" : "Överstiger gränsbeloppet"}
                    headerIcon={DollarSign}
                    tooltip={termExplanations["Utdelning"]}
                />
                <StatCard
                    label="Skatt på utdelning"
                    value={`${formatCurrency(stats.skatt)}`}
                    subtitle="20% kapitalskatt"
                    headerIcon={Calculator}
                />
            </StatCardGrid>

            <SectionCard
                icon={AlertTriangle}
                title="3:12-reglerna"
                description="Som fåmansföretagare gäller särskilda regler för utdelning. Utdelning inom gränsbeloppet beskattas med 20% kapitalskatt. Utdelning över gränsbeloppet beskattas som tjänst."
                variant="warning"
            />

            <div className="grid grid-cols-2 gap-6">
                <Card className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-medium">Utdelningskalkylator</h2>
                        <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                            <Bot className="h-5 w-5 text-purple-600" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-muted-foreground">Löneunderlag</label>
                            <p className="text-lg font-semibold">1 020 000 kr</p>
                            <p className="text-xs text-muted-foreground">Kontrolluppgiftsbaserat</p>
                        </div>
                        <div>
                            <label className="text-sm text-muted-foreground">Sparat utdelningsutrymme</label>
                            <p className="text-lg font-semibold">45 000 kr</p>
                            <p className="text-xs text-muted-foreground">Från tidigare år</p>
                        </div>
                        <div>
                            <label className="text-sm text-muted-foreground">Totalt gränsbelopp</label>
                            <p className="text-lg font-semibold text-green-600 dark:text-green-500/70">240 250 kr</p>
                            <p className="text-xs text-muted-foreground">Schablonbelopp + sparat</p>
                        </div>
                    </div>
                </Card>

                <Card className="overflow-hidden flex flex-col">
                    <div className="px-4 py-3 border-b-2 border-border/60 flex items-center justify-between">
                        <h2 className="font-medium">Utdelningshistorik</h2>
                        <div className="flex gap-2">
                            <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
                                <DialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="h-7 text-xs">
                                        <DollarSign className="h-3 w-3 mr-1" />
                                        Registrera utdelning
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Registrera ny utdelning</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Belopp (kr)</Label>
                                            <Input
                                                value={registerAmount}
                                                onChange={e => setRegisterAmount(e.target.value)}
                                                placeholder="t.ex. 50 000"
                                                type="number"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Inkomstår</Label>
                                            <Input
                                                value={registerYear}
                                                onChange={e => setRegisterYear(e.target.value)}
                                                placeholder="2024"
                                                type="number"
                                            />
                                        </div>
                                        <div className="bg-muted p-3 rounded-md text-sm text-muted-foreground">
                                            <p className="font-medium text-foreground mb-1">Detta händer:</p>
                                            <ul className="list-disc list-inside space-y-1">
                                                <li>Ett digitalt stämmoprotokoll skapas automatiskt (Bolagsverket-krav).</li>
                                                <li>Beloppet bokförs och dras från Bolagets resultat.</li>
                                                <li>K10-underlaget uppdateras.</li>
                                            </ul>
                                        </div>
                                        <Button className="w-full" onClick={handleRegisterDividend}>
                                            Bekräfta utdelning
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                        <Expand className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-xl">
                                    <DialogHeader>
                                        <DialogTitle>Utdelningshistorik</DialogTitle>
                                    </DialogHeader>
                                    <div className="max-h-[60vh] overflow-y-auto">
                                        <DividendTable data={displayHistory} />
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                    <div className="max-h-[280px] overflow-y-auto">
                        <DividendTable data={displayHistory} className="border-y-0" />
                    </div>
                </Card>
            </div>
        </div>
    )
}
