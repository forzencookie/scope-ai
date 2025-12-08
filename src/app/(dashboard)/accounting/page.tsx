"use client"

import { useCallback, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { 
    BookOpen, 
    FileText, 
    Receipt, 
    ClipboardCheck, 
    Sparkles,
    ArrowLeftRight,
    Check,
    X,
    RefreshCw,
    Zap,
    CheckCircle2,
} from "lucide-react"

import { TransactionsTable } from "@/components/transactions-table"
import { ReceiptsTable } from "@/components/receipts-table"
import { InvoicesTable } from "@/components/invoices-table"
import { VerifikationerTable } from "@/components/verifikationer-table"
import { allTransactions } from "@/lib/transaction-data"

// Tab configuration
const tabs = [
    {
        id: "transaktioner",
        label: "Transaktioner",
        icon: BookOpen,
    },
    {
        id: "ai-matchning",
        label: "AI-matchning",
        icon: Sparkles,
    },
    {
        id: "underlag",
        label: "Underlag",
        icon: FileText,
    },
    {
        id: "verifikationer",
        label: "Verifikationer",
        icon: ClipboardCheck,
    },
    {
        id: "fakturor",
        label: "Fakturor",
        icon: Receipt,
    },
]

// Get contextual info for each tab
function getTabInfo(tabId: string) {
    switch (tabId) {
        case "transaktioner":
            return "Senast uppdaterad: idag 14:32 • 12 nya denna vecka"
        case "ai-matchning":
            return "Senast uppdaterad: idag 14:32"
        case "underlag":
            return "Senast uppdaterad: idag 14:32"
        case "verifikationer":
            return "Senast uppdaterad: idag 14:32"
        case "fakturor":
            return "Senast uppdaterad: idag 14:32"
        default:
            return ""
    }
}

// ============ AI MATCHING TYPES & DATA ============
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

const mockMatches: Match[] = [
    {
        id: "m1",
        transaction: { id: "t1", name: "IKEA Online", date: "2024-12-05", amount: -1249, account: "Företagskonto" },
        underlag: { id: "u1", fileName: "kvitto_ikea_dec5.pdf", vendor: "IKEA AB", date: "2024-12-05", amount: -1249, type: "receipt" },
        confidence: "high",
        matchReason: "Exakt belopp och datum matchar. Leverantörsnamn överensstämmer.",
        status: "pending"
    },
    {
        id: "m2",
        transaction: { id: "t2", name: "SPOTIFY AB", date: "2024-12-04", amount: -169, account: "Företagskonto" },
        underlag: { id: "u2", fileName: "spotify_faktura_dec.pdf", vendor: "Spotify Technology", date: "2024-12-04", amount: -169, type: "invoice" },
        confidence: "high",
        matchReason: "Återkommande prenumeration identifierad. Belopp och leverantör matchar.",
        status: "pending"
    },
    {
        id: "m3",
        transaction: { id: "t3", name: "SAS SCANDINAVIAN", date: "2024-12-03", amount: -2450, account: "Företagskort" },
        underlag: { id: "u3", fileName: "sas_booking_ref123.pdf", vendor: "SAS AB", date: "2024-12-02", amount: -2450, type: "receipt" },
        confidence: "medium",
        matchReason: "Belopp matchar. Datum skiljer 1 dag (bokningsdatum vs betaldatum).",
        status: "pending"
    },
    {
        id: "m4",
        transaction: { id: "t4", name: "AMAZON EU S.A.R.L", date: "2024-12-02", amount: -599, account: "Företagskonto" },
        underlag: { id: "u4", fileName: "amazon_order_dec2.pdf", vendor: "Amazon", date: "2024-12-01", amount: -589, type: "receipt" },
        confidence: "low",
        matchReason: "Leverantör matchar men belopp skiljer 10 kr (frakt?). Datum skiljer 1 dag.",
        status: "pending"
    },
    {
        id: "m5",
        transaction: { id: "t5", name: "ADOBE SYSTEMS", date: "2024-12-01", amount: -599, account: "Företagskonto" },
        underlag: { id: "u5", fileName: "adobe_cc_november.pdf", vendor: "Adobe Inc", date: "2024-12-01", amount: -599, type: "invoice" },
        confidence: "high",
        matchReason: "Återkommande prenumeration. Exakt belopp och datum matchar.",
        status: "pending"
    },
]

// ============ AI MATCHING COMPONENTS ============
function ConfidenceBadge({ confidence }: { confidence: MatchConfidence }) {
    const styles = {
        high: "text-emerald-600 dark:text-emerald-400",
        medium: "text-amber-600 dark:text-amber-400",
        low: "text-red-600 dark:text-red-400",
    }
    const labels = { high: "Hög", medium: "Medel", low: "Låg" }
    const percentages = { high: "95%", medium: "72%", low: "45%" }

    return (
        <span className={`inline-flex items-center gap-1 text-xs ${styles[confidence]}`}>
            <span>{labels[confidence]}</span>
            <span className="opacity-60">{percentages[confidence]}</span>
        </span>
    )
}

function MatchRow({ match, onApprove, onReject, isSelected, onSelect }: { 
    match: Match; onApprove: () => void; onReject: () => void; isSelected: boolean; onSelect: () => void 
}) {
    const formatAmount = (amount: number) => {
        const formatted = new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", minimumFractionDigits: 0 }).format(Math.abs(amount))
        return amount < 0 ? `-${formatted}` : `+${formatted}`
    }
    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("sv-SE", { day: "numeric", month: "short" })
    
    const confidenceColor = { high: "bg-emerald-500", medium: "bg-amber-500", low: "bg-red-500" }

    if (match.status !== "pending") return null

    return (
        <div className={`py-3 border-b border-border/40 hover:bg-muted/20 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}>
            {/* Main row */}
            <div className="flex items-center gap-3">
                <Checkbox checked={isSelected} onCheckedChange={onSelect} className="h-4 w-4" />
                
                {/* Confidence indicator dot */}
                <div className={`w-2 h-2 rounded-full ${confidenceColor[match.confidence]}`} />
                
                {/* Transaction → Underlag */}
                <div className="flex-1 flex items-center gap-2 min-w-0">
                    <span className="font-medium text-sm truncate">{match.transaction.name}</span>
                    <ArrowLeftRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-sm text-muted-foreground truncate">{match.underlag.vendor}</span>
                </div>
                
                {/* Amount */}
                <span className="text-sm font-medium tabular-nums w-24 text-right">
                    {formatAmount(match.transaction.amount)}
                </span>
                
                {/* Date & Confidence */}
                <div className="flex items-center gap-3 w-32 justify-end">
                    <span className="text-xs text-muted-foreground">{formatDate(match.transaction.date)}</span>
                    <ConfidenceBadge confidence={match.confidence} />
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-1 ml-2">
                    <button onClick={onReject} className="p-1.5 rounded-full text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                    <button onClick={onApprove} className="p-1.5 rounded-full text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors">
                        <Check className="h-4 w-4" />
                    </button>
                </div>
            </div>
            
            {/* AI reasoning - subtle inline */}
            <div className="mt-1 ml-9 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary/60" />
                <span>{match.matchReason}</span>
            </div>
        </div>
    )
}

// ============ AI MATCHING TAB CONTENT ============
function AIMatchingContent() {
    const [matches, setMatches] = useState<Match[]>(mockMatches)
    const [selectedMatches, setSelectedMatches] = useState<Set<string>>(new Set())
    const [isProcessing, setIsProcessing] = useState(false)

    const pendingMatches = matches.filter(m => m.status === "pending")
    const approvedCount = matches.filter(m => m.status === "approved").length
    const highConfidenceCount = pendingMatches.filter(m => m.confidence === "high").length

    const handleApprove = (matchId: string) => {
        setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: "approved" } : m))
        setSelectedMatches(prev => { const next = new Set(prev); next.delete(matchId); return next })
    }

    const handleReject = (matchId: string) => {
        setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: "rejected" } : m))
        setSelectedMatches(prev => { const next = new Set(prev); next.delete(matchId); return next })
    }

    const handleApproveSelected = () => {
        setIsProcessing(true)
        const toApprove = Array.from(selectedMatches)
        toApprove.forEach((id, i) => setTimeout(() => handleApprove(id), i * 200))
        setTimeout(() => setIsProcessing(false), toApprove.length * 200 + 100)
    }

    const handleApproveAllHighConfidence = () => {
        const highConfidence = pendingMatches.filter(m => m.confidence === "high").map(m => m.id)
        setIsProcessing(true)
        highConfidence.forEach((id, i) => setTimeout(() => handleApprove(id), i * 200))
        setTimeout(() => setIsProcessing(false), highConfidence.length * 200 + 100)
    }

    const toggleSelect = (matchId: string) => {
        setSelectedMatches(prev => { const next = new Set(prev); next.has(matchId) ? next.delete(matchId) : next.add(matchId); return next })
    }

    const selectAll = () => {
        selectedMatches.size === pendingMatches.length ? setSelectedMatches(new Set()) : setSelectedMatches(new Set(pendingMatches.map(m => m.id)))
    }

    return (
        <div className="space-y-4">
            {/* Compact stats row */}
            <div className="flex items-center gap-6 text-sm">
                <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">{pendingMatches.length}</span> att granska
                </span>
                <span className="text-muted-foreground">
                    <span className="font-medium text-emerald-600">{highConfidenceCount}</span> hög säkerhet
                </span>
                <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">{approvedCount}</span> godkända idag
                </span>
                
                <div className="flex-1" />
                
                {/* Bulk actions */}
                {selectedMatches.size > 0 && (
                    <Button size="sm" onClick={handleApproveSelected} disabled={isProcessing} className="h-7 bg-emerald-600 hover:bg-emerald-700 text-white">
                        {isProcessing ? <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" /> : <Check className="h-3 w-3 mr-1.5" />}
                        Godkänn {selectedMatches.size} valda
                    </Button>
                )}
                {highConfidenceCount > 0 && selectedMatches.size === 0 && (
                    <Button size="sm" variant="ghost" onClick={handleApproveAllHighConfidence} disabled={isProcessing} className="h-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                        <Zap className="h-3 w-3 mr-1.5" />Snabbgodkänn {highConfidenceCount} st
                    </Button>
                )}
            </div>

            {/* Header row */}
            {pendingMatches.length > 0 && (
                <div className="flex items-center gap-3 py-2 border-b border-border text-xs text-muted-foreground">
                    <Checkbox 
                        checked={selectedMatches.size === pendingMatches.length && pendingMatches.length > 0} 
                        onCheckedChange={selectAll}
                        className="h-4 w-4" 
                    />
                    <div className="w-2" />
                    <span className="flex-1">Transaktion → Underlag</span>
                    <span className="w-24 text-right">Belopp</span>
                    <span className="w-32 text-right">Datum & Säkerhet</span>
                    <span className="w-16 text-center">Åtgärd</span>
                </div>
            )}

            {/* Match rows */}
            <div>
                {pendingMatches.map(match => (
                    <MatchRow 
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
                <div className="flex items-center justify-center py-12 text-center">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <span className="text-muted-foreground">Alla matchningar granskade</span>
                        <Button size="sm" variant="ghost" className="h-7 text-xs">
                            <RefreshCw className="h-3 w-3 mr-1.5" />Sök fler
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

// ============ MAIN PAGE COMPONENT ============
export default function AccountingPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const currentTab = searchParams.get("tab") || "transaktioner"

    const setCurrentTab = useCallback((tab: string) => {
        router.push(`/accounting?tab=${tab}`, { scroll: false })
    }, [router])

    return (
        <TooltipProvider>
            <div className="flex flex-col h-svh">
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Bokföring</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>

                {/* Tab Content */}
                <div className="flex-1 flex flex-col bg-background overflow-auto p-6">
                    <div className="max-w-6xl w-full">
                        {/* Tabs */}
                        <div className="flex items-center gap-1 pb-2 mb-6 border-b border-border/20">
                            {tabs.map((tab) => {
                                const isActive = currentTab === tab.id
                                const Icon = tab.icon
                                
                                return (
                                    <Tooltip key={tab.id}>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={() => setCurrentTab(tab.id)}
                                                className={cn(
                                                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                                    isActive 
                                                        ? "bg-primary/10 text-primary" 
                                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                                )}
                                            >
                                                <Icon className="h-4 w-4" />
                                                {isActive && <span>{tab.label}</span>}
                                            </button>
                                        </TooltipTrigger>
                                        {!isActive && (
                                            <TooltipContent side="bottom">
                                                <p>{tab.label}</p>
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                )
                            })}
                            
                            <div className="ml-auto text-sm text-muted-foreground">
                                {getTabInfo(currentTab)}
                            </div>
                        </div>

                        {/* Content */}
                        {currentTab === "transaktioner" && (
                            <TransactionsTable 
                                title="Transaktioner" 
                                subtitle="Senast uppdaterad: idag 14:32 • 12 nya denna vecka"
                                transactions={allTransactions} 
                            />
                        )}
                        {currentTab === "ai-matchning" && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>Senast uppdaterad: idag 14:32</span>
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-primary" />
                                        <span>AI analyserar kontinuerligt nya transaktioner</span>
                                    </div>
                                </div>
                                <AIMatchingContent />
                            </div>
                        )}
                        {currentTab === "underlag" && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>Senast uppdaterad: idag 14:32</span>
                                    <span>3 underlag väntar på granskning</span>
                                </div>
                                <ReceiptsTable />
                            </div>
                        )}
                        {currentTab === "verifikationer" && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>Senast uppdaterad: idag 14:32</span>
                                    <span>7 verifikationer denna månad</span>
                                </div>
                                <VerifikationerTable />
                            </div>
                        )}
                        {currentTab === "fakturor" && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>Senast uppdaterad: idag 14:32</span>
                                    <span>2 obetalda fakturor</span>
                                </div>
                                <InvoicesTable />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </TooltipProvider>
    )
}
