"use client"

import { useState, useEffect } from "react"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbLink,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    ArrowLeftRight,
    Check,
    X,
    Sparkles,
    FileText,
    CreditCard,
    AlertCircle,
    ChevronRight,
    RefreshCw,
    ThumbsUp,
    ThumbsDown,
    Eye,
    Zap,
    CheckCircle2,
    Clock,
    TrendingUp,
} from "lucide-react"

// Types
type MatchConfidence = "high" | "medium" | "low"

type Transaction = {
    id: string
    name: string
    date: string
    amount: number
    account: string
}

type Underlag = {
    id: string
    fileName: string
    vendor: string
    date: string
    amount: number
    type: "receipt" | "invoice" | "contract"
}

type Match = {
    id: string
    transaction: Transaction
    underlag: Underlag
    confidence: MatchConfidence
    matchReason: string
    status: "pending" | "approved" | "rejected"
}

// Mock data - AI suggested matches
const mockMatches: Match[] = [
    {
        id: "m1",
        transaction: {
            id: "t1",
            name: "IKEA Online",
            date: "2024-12-05",
            amount: -1249,
            account: "Företagskonto"
        },
        underlag: {
            id: "u1",
            fileName: "kvitto_ikea_dec5.pdf",
            vendor: "IKEA AB",
            date: "2024-12-05",
            amount: -1249,
            type: "receipt"
        },
        confidence: "high",
        matchReason: "Exakt belopp och datum matchar. Leverantörsnamn överensstämmer.",
        status: "pending"
    },
    {
        id: "m2",
        transaction: {
            id: "t2",
            name: "SPOTIFY AB",
            date: "2024-12-04",
            amount: -169,
            account: "Företagskonto"
        },
        underlag: {
            id: "u2",
            fileName: "spotify_faktura_dec.pdf",
            vendor: "Spotify Technology",
            date: "2024-12-04",
            amount: -169,
            type: "invoice"
        },
        confidence: "high",
        matchReason: "Återkommande prenumeration identifierad. Belopp och leverantör matchar.",
        status: "pending"
    },
    {
        id: "m3",
        transaction: {
            id: "t3",
            name: "SAS SCANDINAVIAN",
            date: "2024-12-03",
            amount: -2450,
            account: "Företagskort"
        },
        underlag: {
            id: "u3",
            fileName: "sas_booking_ref123.pdf",
            vendor: "SAS AB",
            date: "2024-12-02",
            amount: -2450,
            type: "receipt"
        },
        confidence: "medium",
        matchReason: "Belopp matchar. Datum skiljer 1 dag (bokningsdatum vs betaldatum).",
        status: "pending"
    },
    {
        id: "m4",
        transaction: {
            id: "t4",
            name: "AMAZON EU S.A.R.L",
            date: "2024-12-02",
            amount: -599,
            account: "Företagskonto"
        },
        underlag: {
            id: "u4",
            fileName: "amazon_order_dec2.pdf",
            vendor: "Amazon",
            date: "2024-12-01",
            amount: -589,
            type: "receipt"
        },
        confidence: "low",
        matchReason: "Leverantör matchar men belopp skiljer 10 kr (frakt?). Datum skiljer 1 dag.",
        status: "pending"
    },
    {
        id: "m5",
        transaction: {
            id: "t5",
            name: "ADOBE SYSTEMS",
            date: "2024-12-01",
            amount: -599,
            account: "Företagskonto"
        },
        underlag: {
            id: "u5",
            fileName: "adobe_cc_november.pdf",
            vendor: "Adobe Inc",
            date: "2024-12-01",
            amount: -599,
            type: "invoice"
        },
        confidence: "high",
        matchReason: "Återkommande prenumeration. Exakt belopp och datum matchar.",
        status: "pending"
    },
]

// Confidence badge component
function ConfidenceBadge({ confidence }: { confidence: MatchConfidence }) {
    const styles = {
        high: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        low: "bg-red-500/10 text-red-600 dark:text-red-400",
    }
    
    const labels = {
        high: "Hög säkerhet",
        medium: "Medel säkerhet",
        low: "Låg säkerhet",
    }
    
    const percentages = {
        high: "95%",
        medium: "72%",
        low: "45%",
    }

    return (
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${styles[confidence]}`}>
            <Sparkles className="h-3 w-3" />
            <span>{labels[confidence]}</span>
            <span className="opacity-60">({percentages[confidence]})</span>
        </div>
    )
}

// Stats card component
function StatCard({ 
    icon: Icon, 
    label, 
    value, 
    subtext,
    color 
}: { 
    icon: React.ElementType
    label: string
    value: string | number
    subtext?: string
    color: string
}) {
    return (
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-semibold">{value}</p>
                {subtext && <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>}
            </div>
            <div className={`p-3 rounded-lg ${color}`}>
                <Icon className="h-5 w-5" />
            </div>
        </div>
    )
}

// Match card component
function MatchCard({ 
    match, 
    onApprove, 
    onReject,
    isSelected,
    onSelect 
}: { 
    match: Match
    onApprove: () => void
    onReject: () => void
    isSelected: boolean
    onSelect: () => void
}) {
    const formatAmount = (amount: number) => {
        const formatted = new Intl.NumberFormat("sv-SE", {
            style: "currency",
            currency: "SEK",
            minimumFractionDigits: 0,
        }).format(Math.abs(amount))
        return amount < 0 ? `-${formatted}` : `+${formatted}`
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("sv-SE", {
            day: "numeric",
            month: "short",
        })
    }

    const borderColor = {
        high: "border-l-emerald-500",
        medium: "border-l-amber-500",
        low: "border-l-red-500",
    }

    if (match.status !== "pending") {
        return null
    }

    return (
        <div className={`relative bg-card border border-border/50 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md hover:border-border ${isSelected ? 'ring-2 ring-primary' : ''}`}>
            {/* Left border indicator */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${borderColor[match.confidence]}`} />
            
            <div className="p-5 pl-6">
                {/* Header with checkbox and confidence */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Checkbox 
                            checked={isSelected}
                            onCheckedChange={onSelect}
                            className="mt-0.5"
                        />
                        <ConfidenceBadge confidence={match.confidence} />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={onReject}
                            className="h-8 px-3 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                            <X className="h-4 w-4 mr-1" />
                            Avvisa
                        </Button>
                        <Button
                            size="sm"
                            onClick={onApprove}
                            className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            <Check className="h-4 w-4 mr-1" />
                            Godkänn
                        </Button>
                    </div>
                </div>

                {/* Match visualization */}
                <div className="flex items-stretch gap-3">
                    {/* Transaction side */}
                    <div className="flex-1 p-4 rounded-lg bg-muted/30 border border-border/50">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <CreditCard className="h-3.5 w-3.5" />
                            <span>Banktransaktion</span>
                        </div>
                        <p className="font-medium text-sm mb-1">{match.transaction.name}</p>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{formatDate(match.transaction.date)}</span>
                            <span className={`font-semibold ${match.transaction.amount < 0 ? 'text-foreground' : 'text-emerald-600'}`}>
                                {formatAmount(match.transaction.amount)}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{match.transaction.account}</p>
                    </div>

                    {/* Arrow connector */}
                    <div className="flex items-center justify-center px-2">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                            <ArrowLeftRight className="h-4 w-4" />
                        </div>
                    </div>

                    {/* Underlag side */}
                    <div className="flex-1 p-4 rounded-lg bg-muted/30 border border-border/50">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <FileText className="h-3.5 w-3.5" />
                            <span className="capitalize">{match.underlag.type === "receipt" ? "Kvitto" : match.underlag.type === "invoice" ? "Faktura" : "Avtal"}</span>
                        </div>
                        <p className="font-medium text-sm mb-1">{match.underlag.vendor}</p>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{formatDate(match.underlag.date)}</span>
                            <span className={`font-semibold ${match.underlag.amount < 0 ? 'text-foreground' : 'text-emerald-600'}`}>
                                {formatAmount(match.underlag.amount)}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 truncate">{match.underlag.fileName}</p>
                    </div>
                </div>

                {/* AI reasoning */}
                <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">AI-analys:</span> {match.matchReason}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function MatchingPage() {
    const [matches, setMatches] = useState<Match[]>(mockMatches)
    const [selectedMatches, setSelectedMatches] = useState<Set<string>>(new Set())
    const [isProcessing, setIsProcessing] = useState(false)
    const [showApprovedAnimation, setShowApprovedAnimation] = useState<string | null>(null)

    const pendingMatches = matches.filter(m => m.status === "pending")
    const approvedCount = matches.filter(m => m.status === "approved").length
    const highConfidenceCount = pendingMatches.filter(m => m.confidence === "high").length

    const handleApprove = (matchId: string) => {
        setShowApprovedAnimation(matchId)
        setTimeout(() => {
            setMatches(prev => prev.map(m => 
                m.id === matchId ? { ...m, status: "approved" } : m
            ))
            setSelectedMatches(prev => {
                const next = new Set(prev)
                next.delete(matchId)
                return next
            })
            setShowApprovedAnimation(null)
        }, 400)
    }

    const handleReject = (matchId: string) => {
        setMatches(prev => prev.map(m => 
            m.id === matchId ? { ...m, status: "rejected" } : m
        ))
        setSelectedMatches(prev => {
            const next = new Set(prev)
            next.delete(matchId)
            return next
        })
    }

    const handleApproveSelected = () => {
        setIsProcessing(true)
        const toApprove = Array.from(selectedMatches)
        let index = 0

        const approveNext = () => {
            if (index < toApprove.length) {
                handleApprove(toApprove[index])
                index++
                setTimeout(approveNext, 300)
            } else {
                setIsProcessing(false)
            }
        }

        approveNext()
    }

    const handleApproveAllHighConfidence = () => {
        const highConfidence = pendingMatches.filter(m => m.confidence === "high").map(m => m.id)
        setSelectedMatches(new Set(highConfidence))
        setTimeout(() => {
            setIsProcessing(true)
            let index = 0

            const approveNext = () => {
                if (index < highConfidence.length) {
                    handleApprove(highConfidence[index])
                    index++
                    setTimeout(approveNext, 300)
                } else {
                    setIsProcessing(false)
                    setSelectedMatches(new Set())
                }
            }

            approveNext()
        }, 100)
    }

    const toggleSelect = (matchId: string) => {
        setSelectedMatches(prev => {
            const next = new Set(prev)
            if (next.has(matchId)) {
                next.delete(matchId)
            } else {
                next.add(matchId)
            }
            return next
        })
    }

    const selectAll = () => {
        if (selectedMatches.size === pendingMatches.length) {
            setSelectedMatches(new Set())
        } else {
            setSelectedMatches(new Set(pendingMatches.map(m => m.id)))
        }
    }

    return (
        <>
            {/* Header */}
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/accounting">Bokföring</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>AI-matchning</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 p-6 overflow-auto">
                <div className="max-w-5xl mx-auto">
                    {/* Page header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Sparkles className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-semibold">Transaktionsmatchning</h1>
                                <p className="text-muted-foreground">AI har analyserat dina transaktioner och hittat potentiella matchningar med underlag</p>
                            </div>
                        </div>
                    </div>

                    {/* Stats cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <StatCard
                            icon={Clock}
                            label="Väntar på granskning"
                            value={pendingMatches.length}
                            color="bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        />
                        <StatCard
                            icon={Zap}
                            label="Hög säkerhet"
                            value={highConfidenceCount}
                            subtext="Rekommenderas godkänna"
                            color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        />
                        <StatCard
                            icon={CheckCircle2}
                            label="Godkända idag"
                            value={approvedCount}
                            color="bg-purple-500/10 text-purple-600 dark:text-purple-400"
                        />
                        <StatCard
                            icon={TrendingUp}
                            label="Tidsbesparad"
                            value="~12 min"
                            subtext="Baserat på manuell matchning"
                            color="bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        />
                    </div>

                    {/* Quick actions bar */}
                    {pendingMatches.length > 0 && (
                        <div className="flex items-center justify-between mb-6 p-4 rounded-xl bg-muted/30 border border-border/50">
                            <div className="flex items-center gap-4">
                                <Checkbox
                                    checked={selectedMatches.size === pendingMatches.length && pendingMatches.length > 0}
                                    onCheckedChange={selectAll}
                                />
                                <span className="text-sm text-muted-foreground">
                                    {selectedMatches.size > 0 
                                        ? `${selectedMatches.size} valda` 
                                        : `${pendingMatches.length} matchningar att granska`}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                {selectedMatches.size > 0 && (
                                    <Button
                                        onClick={handleApproveSelected}
                                        disabled={isProcessing}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        {isProcessing ? (
                                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <Check className="h-4 w-4 mr-2" />
                                        )}
                                        Godkänn valda ({selectedMatches.size})
                                    </Button>
                                )}
                                {highConfidenceCount > 0 && selectedMatches.size === 0 && (
                                    <Button
                                        variant="outline"
                                        onClick={handleApproveAllHighConfidence}
                                        disabled={isProcessing}
                                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950"
                                    >
                                        <Zap className="h-4 w-4 mr-2" />
                                        Snabbgodkänn alla med hög säkerhet ({highConfidenceCount})
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Match cards */}
                    <div className="space-y-4">
                        {pendingMatches.map(match => (
                            <MatchCard
                                key={match.id}
                                match={match}
                                onApprove={() => handleApprove(match.id)}
                                onReject={() => handleReject(match.id)}
                                isSelected={selectedMatches.has(match.id)}
                                onSelect={() => toggleSelect(match.id)}
                            />
                        ))}
                    </div>

                    {/* Empty state */}
                    {pendingMatches.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="p-4 rounded-full bg-emerald-500/10 mb-4">
                                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                            </div>
                            <h2 className="text-xl font-semibold mb-2">Alla matchningar granskade!</h2>
                            <p className="text-muted-foreground max-w-md">
                                Du har granskat alla AI-föreslagna matchningar. Nya matchningar visas här när fler transaktioner eller underlag läggs till.
                            </p>
                            <Button variant="outline" className="mt-6">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Sök efter fler matchningar
                            </Button>
                        </div>
                    )}
                </div>
            </main>
        </>
    )
}
