// @ts-nocheck

import { Check, ArrowRight, FileText, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { useState } from "react"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

interface VerificationRow {
    account: string
    description?: string
    debit?: number
    credit?: number
}

interface VerificationPreviewProps {
    data: {
        date?: string
        description: string
        rows: VerificationRow[]
    }
}

export function VerificationPreview({ data }: VerificationPreviewProps) {
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

    const totalDebit = data.rows.reduce((sum, row) => sum + (row.debit || 0), 0)
    const totalCredit = data.rows.reduce((sum, row) => sum + (row.credit || 0), 0)
    const diff = Math.abs(totalDebit - totalCredit)
    const isBalanced = diff < 0.01 // Floating point tolerance

    const handleConfirm = async () => {
        if (!isBalanced) {
            toast({
                title: "Obalans",
                description: "Debet och Kredit måste vara lika.",
                variant: "destructive"
            })
            return
        }

        setStatus('saving')
        try {
            const res = await fetch('/api/verifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (res.ok) {
                setStatus('saved')
                toast({
                    title: "Verifikation bokförd",
                    description: "Verifikationen har sparats."
                })
            } else {
                throw new Error("Failed to save")
            }
        } catch (error) {
            console.error(error)
            setStatus('error')
            toast({
                title: "Kunde inte bokföra",
                description: "Ett fel uppstod vid sparande.",
                variant: "destructive"
            })
        }
    }

    if (status === 'saved') {
        return (
            <Card className="w-full max-w-md overflow-hidden border-green-100 dark:border-green-900 bg-background/95 backdrop-blur-sm shadow-sm ring-1 ring-green-100/20">
                <div className="p-6 flex flex-col items-center text-center space-y-3">
                    <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                        <Check className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-semibold">Bokfört och klart!</h3>
                        <p className="text-sm text-muted-foreground">Verifikationen har lagts till.</p>
                    </div>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => window.location.href = '/dashboard/bokforing?tab=verifikationer'}
                    >
                        Se verifikationer
                        <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-md overflow-hidden border-border bg-background/95 backdrop-blur-sm shadow-sm">
            {/* Header */}
            <div className="p-4 border-b border-border bg-muted/40">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-semibold text-sm leading-none">
                            Ny Verifikation
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            {data.date || new Date().toISOString().split('T')[0]} • {data.description}
                        </p>
                    </div>
                </div>
            </div>

            {/* Rows Table */}
            <div className="p-0">
                <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b bg-muted/20 text-xs font-medium text-muted-foreground">
                    <div className="col-span-2">Konto</div>
                    <div className="col-span-6">Beskrivning</div>
                    <div className="col-span-2 text-right">Debet</div>
                    <div className="col-span-2 text-right">Kredit</div>
                </div>
                <div className="max-h-60 overflow-y-auto">
                    {data.rows.map((row, i) => (
                        <div key={i} className="grid grid-cols-12 gap-2 px-4 py-2 border-b last:border-0 text-sm">
                            <div className="col-span-2 font-mono text-xs pt-0.5">{row.account}</div>
                            <div className="col-span-6 truncate text-muted-foreground text-xs pt-0.5">{row.description || data.description}</div>
                            <div className="col-span-2 text-right font-mono text-xs text-foreground/80">
                                {row.debit ? formatCurrency(row.debit).replace(' kr', '') : ''}
                            </div>
                            <div className="col-span-2 text-right font-mono text-xs text-foreground/80">
                                {row.credit ? formatCurrency(row.credit).replace(' kr', '') : ''}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer / Sums */}
            <div className="p-3 bg-muted/10 border-t border-border">
                <div className="flex justify-between items-center px-2 text-xs font-medium mb-3">
                    <span>Totalt</span>
                    <div className="flex gap-4">
                        <span className="w-20 text-right">{formatCurrency(totalDebit)}</span>
                        <span className="w-20 text-right">{formatCurrency(totalCredit)}</span>
                    </div>
                </div>

                {!isBalanced ? (
                    <div className="flex items-center gap-2 p-2 mb-3 bg-destructive/10 text-destructive rounded-md text-xs">
                        <AlertCircle className="h-4 w-4" />
                        <span>Obalans: {formatCurrency(diff)}</span>
                    </div>
                ) : null}

                <div className="flex justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={status === 'saving'}
                    >
                        Avbryt
                    </Button>
                    <Button
                        size="sm"
                        className={isBalanced ? "bg-primary hover:bg-primary/90" : "opacity-50"}
                        onClick={handleConfirm}
                        disabled={status === 'saving' || !isBalanced}
                    >
                        {status === 'saving' ? 'Bokför...' : 'Bokför'}
                    </Button>
                </div>
            </div>
        </Card>
    )
}
