"use client"

import { Check, ArrowRight, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { useState } from "react"
import { useToast } from "@/components/ui/toast"

interface VerificationRow {
    account: string
    description?: string
    debit?: number
    credit?: number
}

interface VerificationDetailProps {
    data: {
        date?: string
        description: string
        rows: VerificationRow[]
    }
}

export function VerificationDetail({ data }: VerificationDetailProps) {
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
    const { addToast: toast } = useToast()

    const totalDebit = data.rows.reduce((sum, row) => sum + (row.debit || 0), 0)
    const totalCredit = data.rows.reduce((sum, row) => sum + (row.credit || 0), 0)
    const diff = Math.abs(totalDebit - totalCredit)
    const isBalanced = diff < 0.01

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
            <div className="w-full max-w-md space-y-3 py-2">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                        <Check className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-sm font-medium">Bokfört och klart!</p>
                        <p className="text-xs text-muted-foreground">Verifikationen har lagts till.</p>
                    </div>
                </div>
                <Button
                    size="sm"
                    variant="ghost"
                    className="text-emerald-600 hover:text-emerald-700 text-xs"
                    onClick={() => window.location.href = '/dashboard/bokforing?tab=verifikationer'}
                >
                    Se verifikationer
                    <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
            </div>
        )
    }

    return (
        <div className="w-full max-w-md space-y-1 py-1">
            {/* Header — inline, no box */}
            <div className="flex items-baseline gap-2 mb-2">
                <span className="text-sm font-semibold">Ny verifikation</span>
                <span className="text-xs text-muted-foreground">
                    {data.date || new Date().toISOString().split('T')[0]} · {data.description}
                </span>
            </div>

            {/* Table header */}
            <div className="flex px-1 py-1.5 text-xs font-medium text-muted-foreground border-b border-dashed border-border/60">
                <div style={{ flex: 0.5 }}>Konto</div>
                <div style={{ flex: 1.5 }}>Beskrivning</div>
                <div style={{ flex: 0.7 }} className="text-right">Debet</div>
                <div style={{ flex: 0.7 }} className="text-right">Kredit</div>
            </div>

            {/* Rows */}
            {data.rows.map((row, i) => (
                <div key={i} className="flex px-1 py-1.5 text-sm">
                    <div style={{ flex: 0.5 }} className="font-mono text-xs tabular-nums">{row.account}</div>
                    <div style={{ flex: 1.5 }} className="text-xs text-muted-foreground truncate">{row.description || data.description}</div>
                    <div style={{ flex: 0.7 }} className="text-right font-mono text-xs tabular-nums">
                        {row.debit ? formatCurrency(row.debit) : ''}
                    </div>
                    <div style={{ flex: 0.7 }} className="text-right font-mono text-xs tabular-nums">
                        {row.credit ? formatCurrency(row.credit) : ''}
                    </div>
                </div>
            ))}

            {/* Totals */}
            <div className="flex px-1 py-2 text-xs font-semibold border-t border-border mt-1">
                <div style={{ flex: 0.5 }}>Totalt</div>
                <div style={{ flex: 1.5 }} />
                <div style={{ flex: 0.7 }} className="text-right tabular-nums">{formatCurrency(totalDebit)}</div>
                <div style={{ flex: 0.7 }} className="text-right tabular-nums">{formatCurrency(totalCredit)}</div>
            </div>

            {!isBalanced && (
                <div className="flex items-center gap-2 text-xs text-destructive py-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Obalans: {formatCurrency(diff)}</span>
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" disabled={status === 'saving'}>
                    Avbryt
                </Button>
                <Button
                    size="sm"
                    onClick={handleConfirm}
                    disabled={status === 'saving' || !isBalanced}
                >
                    {status === 'saving' ? 'Bokför...' : 'Bokför'}
                </Button>
            </div>
        </div>
    )
}
