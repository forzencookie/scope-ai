"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AppStatusBadge } from "@/components/ui/status-badge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog"
import type { Transaction, AISuggestion } from "@/types"

// ============================================================================
// New Transaction Dialog
// ============================================================================

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

// ============================================================================
// Transaction Details Dialog
// ============================================================================

interface TransactionDetailsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    transaction: Transaction | null
    /** Optional AI suggestion for the transaction */
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
                                <p className={cn(
                                    "font-medium",
                                    transaction.amount.startsWith("+") ? "text-green-600" : ""
                                )}>{transaction.amount}</p>
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
                                    <p className="font-medium">
                                        {aiSuggestion.category} ({aiSuggestion.confidence}%)
                                    </p>
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
