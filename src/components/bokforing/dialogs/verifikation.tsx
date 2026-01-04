"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import {
    Bot,
    Check,
    ArrowRight,
    Receipt,
    FileText,
    Building2,
    Banknote,
    Sparkles,
    CheckCircle2,
    RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { AiProcessingState } from "@/components/shared"

// Types for matching
export interface Transaction {
    id: string
    date: string
    description: string
    amount: number
    status: string
}

export interface Underlag {
    id: string
    type: 'kvitto' | 'kundfaktura' | 'leverantorsfaktura'
    supplier: string
    date: string
    amount: string
    status: string
}

interface MatchedPair {
    transaction: Transaction
    underlag: Underlag
    confidence: number
}

interface VerifikationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onVerifikationCreated?: (transactionId: string, underlagId: string, underlagType: string) => void
}

// Mock data (temporary)
const getMockTransactions = (): Transaction[] => [
    { id: "TXN-001", date: "2024-12-10", description: "Swish från kund", amount: 1500, status: "Verifierad" },
    { id: "TXN-002", date: "2024-12-08", description: "Kortköp Clas Ohlson", amount: -450, status: "Verifierad" },
    { id: "TXN-003", date: "2024-12-05", description: "Bankgiro ut", amount: -2500, status: "Verifierad" },
]

const getMockUnderlag = (): Underlag[] => [
    { id: "REC-001", type: "kvitto", supplier: "Clas Ohlson", date: "2024-12-08", amount: "450 kr", status: "Verifierad" },
    { id: "INV-001", type: "kundfaktura", supplier: "Kund AB", date: "2024-12-10", amount: "1 500 kr", status: "Verifierad" },
    { id: "SUP-001", type: "leverantorsfaktura", supplier: "Leverantör AB", date: "2024-12-05", amount: "2 500 kr", status: "Verifierad" },
]

export function VerifikationDialog({
    open,
    onOpenChange,
    onVerifikationCreated
}: VerifikationDialogProps) {
    const [activeTab, setActiveTab] = useState<"manual" | "ai">("manual")
    const [aiState, setAiState] = useState<'idle' | 'processing' | 'preview'>('idle')
    const [matchedPairs, setMatchedPairs] = useState<MatchedPair[]>([])

    // Manual tab state
    const [selectedTransaction, setSelectedTransaction] = useState<string>("")
    const [selectedUnderlagType, setSelectedUnderlagType] = useState<string>("")
    const [selectedUnderlag, setSelectedUnderlag] = useState<string>("")

    const transactions = useMemo(() => getMockTransactions(), [])
    const allUnderlag = useMemo(() => getMockUnderlag(), [])

    const filteredUnderlag = useMemo(() => {
        if (!selectedUnderlagType) return []
        return allUnderlag.filter(u => u.type === selectedUnderlagType)
    }, [selectedUnderlagType, allUnderlag])

    const runAiMatching = async () => {
        setAiState('processing')
        await new Promise(resolve => setTimeout(resolve, 3000))

        // Mock matches
        setMatchedPairs([
            { transaction: transactions[0], underlag: allUnderlag[1], confidence: 95 },
            { transaction: transactions[1], underlag: allUnderlag[0], confidence: 92 },
            { transaction: transactions[2], underlag: allUnderlag[2], confidence: 88 },
        ])
        setAiState('preview')
    }

    const handleAcceptAll = () => {
        matchedPairs.forEach(pair => {
            onVerifikationCreated?.(pair.transaction.id, pair.underlag.id, pair.underlag.type)
        })
        onOpenChange(false)
    }

    const handleManualCreate = () => {
        if (!selectedTransaction || !selectedUnderlag) return
        const underlag = allUnderlag.find(u => u.id === selectedUnderlag)
        onVerifikationCreated?.(selectedTransaction, selectedUnderlag, underlag?.type || '')
        onOpenChange(false)
    }

    const getUnderlagTypeLabel = (type: string) => {
        switch (type) {
            case 'kvitto': return 'Kvitto'
            case 'kundfaktura': return 'Kundfaktura'
            case 'leverantorsfaktura': return 'Leverantörsfaktura'
            default: return type
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>Ny verifikation</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="manual" className="gap-2">
                            <FileText className="h-4 w-4" />
                            Manuell
                        </TabsTrigger>
                        <TabsTrigger value="ai" className="gap-2">
                            <Bot className="h-4 w-4" />
                            Auto-matchning
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="manual" className="space-y-4">
                        <div className="space-y-4">
                            {/* Select Transaction */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
                                    Välj transaktion
                                </Label>
                                <Select value={selectedTransaction} onValueChange={setSelectedTransaction}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Välj transaktion..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {transactions.map(t => (
                                            <SelectItem key={t.id} value={t.id}>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-muted-foreground">{t.date}</span>
                                                    <span>{t.description}</span>
                                                    <span className={cn("font-medium ml-auto", t.amount >= 0 ? "text-green-600" : "")}>
                                                        {t.amount.toLocaleString('sv-SE')} kr
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedTransaction && (
                                <div className="flex justify-center py-2">
                                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                                </div>
                            )}

                            {selectedTransaction && (
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                        Typ av underlag
                                    </Label>
                                    <Select value={selectedUnderlagType} onValueChange={(v) => {
                                        setSelectedUnderlagType(v)
                                        setSelectedUnderlag("")
                                    }}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Välj typ..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="kvitto"><div className="flex items-center gap-2"><Receipt className="h-4 w-4" /> Kvitto</div></SelectItem>
                                            <SelectItem value="kundfaktura"><div className="flex items-center gap-2"><FileText className="h-4 w-4" /> Kundfaktura</div></SelectItem>
                                            <SelectItem value="leverantorsfaktura"><div className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Leverantörsfaktura</div></SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {selectedUnderlagType && (
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                                        Välj {getUnderlagTypeLabel(selectedUnderlagType).toLowerCase()}
                                    </Label>
                                    <Select value={selectedUnderlag} onValueChange={setSelectedUnderlag}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={`Välj ${getUnderlagTypeLabel(selectedUnderlagType).toLowerCase()}...`} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredUnderlag.map(u => (
                                                <SelectItem key={u.id} value={u.id}>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-muted-foreground">{u.date}</span>
                                                        <span>{u.supplier}</span>
                                                        <span className="font-medium ml-auto">{u.amount}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                            {filteredUnderlag.length === 0 && <div className="p-2 text-sm text-muted-foreground text-center">Inga tillgängliga</div>}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                        <DialogFooter className="mt-6">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
                            <Button onClick={handleManualCreate} disabled={!selectedTransaction || !selectedUnderlag}>
                                <Check className="h-4 w-4 mr-2" />
                                Skapa verifikation
                            </Button>
                        </DialogFooter>
                    </TabsContent>

                    <TabsContent value="ai" className="space-y-4">
                        {aiState === 'idle' && (
                            <div className="text-center py-8 space-y-4">
                                <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                                    <Sparkles className="h-8 w-8 text-primary" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-lg">Automatisk matchning</h3>
                                    <p className="text-sm text-muted-foreground max-w-[300px] mx-auto">
                                        AI analyserar alla verifierade transaktioner och underlag och föreslår matchningar
                                    </p>
                                </div>
                                <Button onClick={runAiMatching} className="mt-4">
                                    <Bot className="h-4 w-4 mr-2" />
                                    Starta auto-matchning
                                </Button>
                            </div>
                        )}

                        {aiState === 'processing' && (
                            <AiProcessingState
                                messages={["Hämtar transaktioner...", "Hämtar underlag...", "Analyserar matchningar...", "Snart klar..."]}
                                subtext={`Analyserar ${transactions.length} transaktioner`}
                            />
                        )}

                        {aiState === 'preview' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800/30">
                                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    <div className="flex-1">
                                        <p className="font-medium text-green-900 dark:text-green-100 text-sm">
                                            {matchedPairs.length} matchningar hittade
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                    {matchedPairs.map((pair, idx) => (
                                        <div key={idx} className="p-3 border rounded-lg bg-muted/30">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1">
                                                    <p className="text-xs text-muted-foreground">Transaktion</p>
                                                    <p className="font-medium text-sm">{pair.transaction.description}</p>
                                                    <p className="text-xs text-muted-foreground">{pair.transaction.amount.toLocaleString('sv-SE')} kr</p>
                                                </div>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                                <div className="flex-1">
                                                    <p className="text-xs text-muted-foreground">{getUnderlagTypeLabel(pair.underlag.type)}</p>
                                                    <p className="font-medium text-sm">{pair.underlag.supplier}</p>
                                                    <p className="text-xs text-muted-foreground">{pair.underlag.amount}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className="text-xs text-green-600 font-medium">{pair.confidence}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <Button variant="outline" className="flex-1" onClick={() => setAiState('idle')}>
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Kör igen
                                    </Button>
                                    <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleAcceptAll}>
                                        <Check className="h-4 w-4 mr-2" />
                                        Godkänn alla
                                    </Button>
                                </div>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
