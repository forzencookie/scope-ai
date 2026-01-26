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
    /** Pass transactions from parent - fetched from API */
    transactions?: Transaction[]
    /** Pass underlag (receipts, invoices) from parent - fetched from API */
    underlag?: Underlag[]
}

export function VerifikationDialog({
    open,
    onOpenChange,
    onVerifikationCreated,
    transactions: externalTransactions = [],
    underlag: externalUnderlag = []
}: VerifikationDialogProps) {
    const [activeTab, setActiveTab] = useState<"manual" | "ai">("manual")
    const [aiState, setAiState] = useState<'idle' | 'processing' | 'preview'>('idle')
    const [matchedPairs, setMatchedPairs] = useState<MatchedPair[]>([])

    // Manual tab state
    const [selectedTransaction, setSelectedTransaction] = useState<string>("")
    const [selectedUnderlagType, setSelectedUnderlagType] = useState<string>("")
    const [selectedUnderlag, setSelectedUnderlag] = useState<string>("")

    // Use external data passed from parent (which fetches from API)
    const transactions = useMemo(() => externalTransactions, [externalTransactions])
    const allUnderlag = useMemo(() => externalUnderlag, [externalUnderlag])

    const filteredUnderlag = useMemo(() => {
        if (!selectedUnderlagType) return []
        return allUnderlag.filter(u => u.type === selectedUnderlagType)
    }, [selectedUnderlagType, allUnderlag])

    const runAiMatching = async () => {
        if (transactions.length === 0 || allUnderlag.length === 0) {
            // No data to match
            setAiState('preview')
            setMatchedPairs([])
            return
        }

        setAiState('processing')
        
        // Simple matching algorithm based on amount and date proximity
        const matches: MatchedPair[] = []
        const usedUnderlag = new Set<string>()

        for (const tx of transactions) {
            const txAmount = Math.abs(tx.amount)
            
            // Find best matching underlag
            let bestMatch: { underlag: Underlag; confidence: number } | null = null
            
            for (const u of allUnderlag) {
                if (usedUnderlag.has(u.id)) continue
                
                // Parse underlag amount (remove currency formatting)
                const uAmount = parseFloat(u.amount.replace(/[^0-9.-]/g, '')) || 0
                
                // Calculate confidence based on amount match
                const amountDiff = Math.abs(txAmount - uAmount)
                const amountConfidence = Math.max(0, 100 - (amountDiff / txAmount) * 100)
                
                if (amountConfidence > 70 && (!bestMatch || amountConfidence > bestMatch.confidence)) {
                    bestMatch = { underlag: u, confidence: Math.round(amountConfidence) }
                }
            }
            
            if (bestMatch) {
                matches.push({
                    transaction: tx,
                    underlag: bestMatch.underlag,
                    confidence: bestMatch.confidence
                })
                usedUnderlag.add(bestMatch.underlag.id)
            }
        }

        setMatchedPairs(matches)
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

                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
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
