"use client"

import { Building2, Calendar, Banknote, CreditCard, Receipt, FileText, Landmark, Clock, ArrowRightLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { PageOverlay } from "@/components/shared"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { TransactionWithAI } from "@/types"
import Image from "next/image"

interface TransactionDetailsOverlayProps {
    isOpen: boolean
    onClose: () => void
    transaction: TransactionWithAI | null
}

/**
 * TransactionDetailsOverlay - Immersive detail view for a bank transaction.
 * Shows matched receipts and ledger lines (if booked).
 */
export function TransactionDetailsOverlay({
    isOpen,
    onClose,
    transaction
}: TransactionDetailsOverlayProps) {
    if (!transaction) return null

    const isBooked = transaction.status === "Bokförd"
    const hasReceipt = transaction.attachments && transaction.attachments.length > 0
    const scoobyPrompt = `Berätta mer om transaktionen "${transaction.name}" på ${transaction.amount} kr.`

    return (
        <PageOverlay
            isOpen={isOpen}
            onClose={onClose}
            title={transaction.name}
            subtitle={`Banktransaktion • ${transaction.date}`}
            scoobyPrompt={scoobyPrompt}
            status={<AppStatusBadge status={transaction.status} size="sm" />}
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Transaction & Receipt */}
                <div className="lg:col-span-2 space-y-8">
                    {/* matched receipt */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Receipt className="h-4 w-4 text-muted-foreground" />
                                Underlag
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {hasReceipt ? (
                                <div className="space-y-4">
                                    <div className="aspect-video relative rounded-lg border overflow-hidden bg-muted/20 flex items-center justify-center">
                                        <Image
                                            src={transaction.attachments![0]}
                                            alt="Kvitto"
                                            fill
                                            className="object-contain"
                                            unoptimized
                                        />
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded bg-background border">
                                                <FileText className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">Kvitto_{transaction.id.slice(0, 8)}.pdf</p>
                                                <p className="text-xs text-muted-foreground">Matchad via Scooby AI</p>
                                            </div>
                                        </div>
                                        <AppStatusBadge status="Verifierad" size="sm" />
                                    </div>
                                </div>
                            ) : (
                                <div className="py-12 text-center border-2 border-dashed rounded-lg bg-muted/10">
                                    <Receipt className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground italic">Inget underlag matchat än.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* ledger lines if booked */}
                    {isBooked && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Landmark className="h-4 w-4 text-muted-foreground" />
                                    Bokföringsposter
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-lg border overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-muted/50 border-b">
                                                <th className="px-4 py-2 text-left font-medium">Konto</th>
                                                <th className="px-4 py-2 text-left font-medium">Benämning</th>
                                                <th className="px-4 py-2 text-right font-medium">Debit</th>
                                                <th className="px-4 py-2 text-right font-medium">Kredit</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y font-mono text-[13px]">
                                            <tr>
                                                <td className="px-4 py-3">1930</td>
                                                <td className="px-4 py-3 font-sans">Företagskonto</td>
                                                <td className="px-4 py-3 text-right">-</td>
                                                <td className="px-4 py-3 text-right">{transaction.amount.replace('-', '')}</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3">{transaction.account || '6xxx'}</td>
                                                <td className="px-4 py-3 font-sans">Motsvarande kostnadskonto</td>
                                                <td className="px-4 py-3 text-right">{transaction.amount.replace('-', '')}</td>
                                                <td className="px-4 py-3 text-right">-</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column: Metadata */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Bankdetaljer</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Valutadatum
                                </div>
                                <p className="text-sm font-semibold">{transaction.date}</p>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Banknote className="h-3.5 w-3.5" />
                                    Belopp
                                </div>
                                <p className={cn(
                                    "text-lg font-bold tabular-nums",
                                    transaction.amount.startsWith('+') ? "text-green-600" : ""
                                )}>
                                    {transaction.amount} kr
                                </p>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Building2 className="h-3.5 w-3.5" />
                                    Motpart
                                </div>
                                <p className="text-sm font-semibold">{transaction.name}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-primary/5 border-primary/10">
                        <CardHeader>
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary/60 flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5" />
                                Historik
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 relative">
                                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-primary/20" />
                                <div className="flex gap-3 relative">
                                    <div className="h-3.5 w-3.5 rounded-full bg-primary mt-1 shrink-0 ring-4 ring-background" />
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-bold">Hämtad från bank</p>
                                        <p className="text-[10px] text-muted-foreground">{transaction.date} • Automatiskt</p>
                                    </div>
                                </div>
                                {isBooked && (
                                    <div className="flex gap-3 relative">
                                        <div className="h-3.5 w-3.5 rounded-full bg-primary/40 mt-1 shrink-0 ring-4 ring-background" />
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-bold">Bokförd via Scooby</p>
                                            <p className="text-[10px] text-muted-foreground">{transaction.date} • Scooby AI</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageOverlay>
    )
}
