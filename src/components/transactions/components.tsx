"use client"

import { memo, useState } from "react"
import { 
    Check, X, Search, ArrowRightLeft, Plus,
    Sparkles, Zap, AlertTriangle, Undo2,
    Building2, Coffee, Smartphone, Plane, Briefcase, Tag, User,
    type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { AppStatusBadge } from "@/components/ui/status-badge"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog"
import type { Transaction, AISuggestion } from "@/types"

// =============================================================================
// Constants
// =============================================================================

export const MIN_CONFIDENCE_AUTO_APPROVE = 90

export const ICON_MAP: Record<string, LucideIcon> = {
    Building2,
    Coffee,
    Smartphone,
    Plane,
    Briefcase,
    Tag,
    User,
}

// =============================================================================
// AISuggestionBadge
// =============================================================================

interface AISuggestionBadgeProps {
    suggestion: AISuggestion
    onApprove: () => void
    onReject: () => void
    isApproved: boolean
    compact?: boolean
}

export const AISuggestionBadge = memo(function AISuggestionBadge({ 
    suggestion, 
    onApprove, 
    onReject,
    isApproved,
    compact = false,
}: AISuggestionBadgeProps) {
    if (isApproved) {
        return (
            <div className="flex items-center gap-2 text-emerald-600 py-1">
                <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Check className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">Godkänd</span>
            </div>
        )
    }

    return (
        <div className={cn(
            "flex items-center gap-3",
            compact ? "flex-row" : "flex-col sm:flex-row"
        )}>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-violet-50 dark:bg-violet-950/50 border border-violet-100 dark:border-violet-800/50">
                <span className="text-sm font-medium text-violet-700 dark:text-violet-400/80">{suggestion.category}</span>
                <span className={cn(
                    "text-xs font-semibold px-1.5 py-0.5 rounded",
                    suggestion.confidence >= 90 
                        ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400/80" 
                        : suggestion.confidence >= 70 
                            ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400/80"
                            : "bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-400/80"
                )}>
                    {suggestion.confidence}%
                </span>
            </div>
            
            <div className="flex items-center gap-1">
                <button
                    onClick={(e) => { e.stopPropagation(); onApprove(); }}
                    className={cn(
                        "min-h-[44px] min-w-[44px] px-3 rounded-lg flex items-center justify-center gap-2",
                        "text-emerald-700 bg-emerald-50 border border-emerald-200",
                        "hover:bg-emerald-100 hover:border-emerald-300",
                        "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1",
                        "active:bg-emerald-200 transition-colors touch-manipulation"
                    )}
                    title="Godkänn förslag"
                    aria-label={`Godkänn kategorisering: ${suggestion.category}`}
                >
                    <Check className="h-5 w-5" />
                    <span className="text-sm font-medium hidden sm:inline">Godkänn</span>
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onReject(); }}
                    className={cn(
                        "min-h-[44px] min-w-[44px] px-3 rounded-lg flex items-center justify-center gap-2",
                        "text-muted-foreground bg-muted/50 border border-border/50",
                        "hover:text-red-600 hover:bg-red-50 hover:border-red-200",
                        "focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1",
                        "active:bg-red-100 transition-colors touch-manipulation"
                    )}
                    title="Avvisa förslag"
                    aria-label={`Avvisa kategorisering: ${suggestion.category}`}
                >
                    <X className="h-5 w-5" />
                    <span className="text-sm font-medium hidden sm:inline">Avvisa</span>
                </button>
            </div>
        </div>
    )
})

// =============================================================================
// AISuggestionsBanner
// =============================================================================

interface AISuggestionsBannerProps {
    pendingSuggestions: number
    onApproveAll: () => void
    totalAmount?: string
    categories?: string[]
    onUndo?: () => void
}

export function AISuggestionsBanner({ 
    pendingSuggestions, 
    onApproveAll,
    totalAmount,
    categories = [],
    onUndo,
}: AISuggestionsBannerProps) {
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [showUndoBanner, setShowUndoBanner] = useState(false)
    const [undoTimeLeft, setUndoTimeLeft] = useState(10)

    const handleConfirmedApproval = () => {
        setShowConfirmDialog(false)
        onApproveAll()
        
        setShowUndoBanner(true)
        setUndoTimeLeft(10)
        
        const interval = setInterval(() => {
            setUndoTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval)
                    setShowUndoBanner(false)
                    return 0
                }
                return prev - 1
            })
        }, 1000)
    }

    const handleUndo = () => {
        setShowUndoBanner(false)
        onUndo?.()
    }

    if (showUndoBanner && onUndo) {
        return (
            <div className="flex items-center justify-between py-3 px-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                        <p className="font-medium text-sm text-emerald-800">✓ Alla förslag godkända</p>
                        <p className="text-xs text-emerald-600">Ångra inom {undoTimeLeft} sekunder</p>
                    </div>
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                    onClick={handleUndo}
                >
                    <Undo2 className="h-4 w-4 mr-1" />
                    Ångra
                </Button>
            </div>
        )
    }

    if (pendingSuggestions <= 0) return null

    return (
        <>
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Bekräfta massåtgärd
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3">
                                <p>
                                    Du är på väg att godkänna <strong>{pendingSuggestions} transaktioner</strong> 
                                    med AI-kategorisering på ≥{MIN_CONFIDENCE_AUTO_APPROVE}% säkerhet.
                                </p>
                                
                                {totalAmount && (
                                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                                        <span className="text-sm text-muted-foreground">Totalt belopp:</span>
                                        <span className="text-sm font-semibold">{totalAmount}</span>
                                    </div>
                                )}
                                
                                {categories.length > 0 && (
                                    <div className="space-y-1">
                                        <span className="text-xs text-muted-foreground">Kategorier som tillämpas:</span>
                                        <div className="flex flex-wrap gap-1">
                                            {categories.slice(0, 5).map((cat, i) => (
                                                <span key={i} className="text-xs px-2 py-0.5 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-400 rounded">
                                                    {cat}
                                                </span>
                                            ))}
                                            {categories.length > 5 && (
                                                <span className="text-xs text-muted-foreground">+{categories.length - 5} till</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                <p className="text-xs text-muted-foreground">
                                    Denna åtgärd kan påverka din bokföring och skatteunderlag. 
                                    Du kan ångra inom 10 sekunder efter godkännande.
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Avbryt</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmedApproval} className="bg-violet-600 hover:bg-violet-700 dark:bg-violet-700 dark:hover:bg-violet-600">
                            <Zap className="h-4 w-4 mr-1" />
                            Godkänn alla
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex items-center justify-between py-3 px-4 bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-950 dark:to-blue-950 rounded-lg border border-violet-100 dark:border-violet-800">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                        <p className="font-medium text-sm">AI har {pendingSuggestions} kategoriseringsförslag</p>
                        <p className="text-xs text-muted-foreground">Granska och godkänn för snabbare bokföring</p>
                    </div>
                </div>
                <Button 
                    variant="default" 
                    size="default"
                    className="bg-violet-600 hover:bg-violet-700 dark:bg-violet-700 dark:hover:bg-violet-600 text-white min-h-[44px] px-4"
                    onClick={() => setShowConfirmDialog(true)}
                >
                    <Zap className="h-4 w-4 mr-2" />
                    Godkänn alla ({MIN_CONFIDENCE_AUTO_APPROVE}%+)
                </Button>
            </div>
        </>
    )
}

// =============================================================================
// TransactionRow
// =============================================================================

export interface TransactionRowProps {
    transaction?: Transaction
    isEmpty?: boolean
    suggestion?: AISuggestion
    onApproveSuggestion?: () => void
    onRejectSuggestion?: () => void
    isApproved?: boolean
    isRejected?: boolean
}

export const TransactionRow = memo(function TransactionRow({ 
    transaction, 
    isEmpty = false, 
    suggestion,
    onApproveSuggestion,
    onRejectSuggestion,
    isApproved = false,
    isRejected = false,
}: TransactionRowProps) {
    const shouldRenderEmpty = isEmpty || !transaction
    const Icon = !shouldRenderEmpty && transaction?.iconName 
        ? (ICON_MAP[transaction.iconName] || Tag) 
        : Tag

    return (
        <tr className="border-b border-border/40 hover:bg-muted/30 data-[state=selected]:bg-muted group">
            {!shouldRenderEmpty && transaction ? (
                <>
                    <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-medium">{transaction.name}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{transaction.date}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                        {suggestion && onApproveSuggestion && onRejectSuggestion ? (
                            <AISuggestionBadge
                                suggestion={suggestion}
                                onApprove={onApproveSuggestion}
                                onReject={onRejectSuggestion}
                                isApproved={isApproved}
                            />
                        ) : isRejected ? (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <X className="h-3.5 w-3.5" />
                                <span className="text-xs font-medium">Inte godkänd</span>
                            </div>
                        ) : (
                            <span className="text-xs text-muted-foreground">–</span>
                        )}
                    </td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                        <span className={cn(transaction.amount.startsWith("+") ? "text-green-600 dark:text-green-500/70" : "text-foreground")}>
                            {transaction.amount}
                        </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                        <AppStatusBadge status={transaction.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{transaction.account}</td>
                    <td className="px-4 py-3">
                        <Checkbox className="translate-y-[2px] opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100 transition-opacity" />
                    </td>
                </>
            ) : (
                <>
                    <td className="px-4 py-3">&nbsp;</td>
                    <td className="px-4 py-3">&nbsp;</td>
                    <td className="px-4 py-3">&nbsp;</td>
                    <td className="px-4 py-3">&nbsp;</td>
                    <td className="px-4 py-3">&nbsp;</td>
                    <td className="px-4 py-3">&nbsp;</td>
                    <td className="px-4 py-3">
                        <Checkbox className="translate-y-[2px] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </td>
                </>
            )}
        </tr>
    )
})

// =============================================================================
// TransactionsEmptyState
// =============================================================================

interface TransactionsEmptyStateProps {
    hasFilters: boolean
    onAddTransaction: () => void
}

export function TransactionsEmptyState({ hasFilters, onAddTransaction }: TransactionsEmptyStateProps) {
    return (
        <tr className="h-[200px]">
            <td colSpan={7} className="text-center">
                <div className="flex flex-col items-center justify-center py-8">
                    <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                        {hasFilters ? (
                            <Search className="h-8 w-8 text-muted-foreground/50" />
                        ) : (
                            <ArrowRightLeft className="h-8 w-8 text-muted-foreground/50" />
                        )}
                    </div>
                    <p className="font-medium text-foreground mb-1">
                        {hasFilters ? "Inga transaktioner matchar din sökning" : "Här är det tomt — ännu!"}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                        {hasFilters 
                            ? "Försök med andra söktermer eller avaktivera något filter" 
                            : "Koppla din bank så börjar vi jobba — du kommer älska hur enkelt det blir"}
                    </p>
                    {!hasFilters && (
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={onAddTransaction}>
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Lägg till transaktion
                        </Button>
                    )}
                </div>
            </td>
        </tr>
    )
}

// =============================================================================
// NewTransactionDialog
// =============================================================================

interface NewTransactionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function NewTransactionDialog({ open, onOpenChange }: NewTransactionDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Lägg till transaktion</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Beskrivning</label>
                        <Input placeholder="Ange beskrivning..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Belopp</label>
                            <Input placeholder="0.00 kr" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Datum</label>
                            <Input type="date" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Konto</label>
                        <Input placeholder="Välj konto..." />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Avbryt</Button>
                    </DialogClose>
                    <Button className="bg-blue-600 hover:bg-blue-700">Lägg till</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// =============================================================================
// TransactionDetailsDialog
// =============================================================================

interface TransactionDetailsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    transaction: Transaction | null
    aiSuggestion?: AISuggestion
}

export function TransactionDetailsDialog({ 
    open, 
    onOpenChange, 
    transaction,
    aiSuggestion,
}: TransactionDetailsDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Transaktionsdetaljer</DialogTitle>
                </DialogHeader>
                {transaction && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Beskrivning</p>
                                <p className="font-medium">{transaction.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Datum</p>
                                <p className="font-medium">{transaction.date}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Belopp</p>
                                <p className={cn("font-medium", transaction.amount.startsWith("+") ? "text-green-600" : "")}>
                                    {transaction.amount}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <AppStatusBadge status={transaction.status} />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Konto</p>
                                <p className="font-medium">{transaction.account}</p>
                            </div>
                            {aiSuggestion && (
                                <div>
                                    <p className="text-sm text-muted-foreground">AI-förslag</p>
                                    <p className="font-medium">{aiSuggestion.category} ({aiSuggestion.confidence}%)</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Stäng</Button>
                    </DialogClose>
                    <Button className="bg-blue-600 hover:bg-blue-700">Bokför</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
