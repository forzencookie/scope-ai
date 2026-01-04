"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, ShieldCheck, ArrowRight, Building2, Lock } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface TinkPaymentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    amount: number
    recipientName: string
    onSuccess: () => void
}

type Step = 'select-bank' | 'authenticating' | 'account-selection' | 'signing' | 'processing' | 'success'

export function TinkPaymentDialog({
    open,
    onOpenChange,
    amount,
    recipientName,
    onSuccess
}: TinkPaymentDialogProps) {
    const [step, setStep] = useState<Step>('select-bank')

    // Reset state when dialog opens
    useEffect(() => {
        if (open) setStep('select-bank')
    }, [open])

    const handleBankSelect = () => {
        setStep('authenticating')
        setTimeout(() => setStep('account-selection'), 1500)
    }

    const handleAccountSelect = () => {
        setStep('signing')
    }

    const handleSign = () => {
        setStep('processing')
        setTimeout(() => setStep('success'), 2000)
    }

    const handleClose = () => {
        if (step === 'success') {
            onSuccess()
        }
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden gap-0">

                {/* Tink Header - Simulating the iframe feeling */}
                <div className="bg-[#f2f4f7] px-6 py-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">T</div>
                        <span className="font-semibold text-sm text-slate-700">Tink</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Lock className="h-3 w-3" />
                        Säker anslutning
                    </div>
                </div>

                <div className="p-6">
                    {step === 'select-bank' && (
                        <div className="space-y-4">
                            <div className="text-center space-y-2 mb-6">
                                <h3 className="font-semibold text-lg">Välj din bank</h3>
                                <p className="text-sm text-muted-foreground">Du skickas vidare för att signera betalningen på {formatCurrency(amount)}.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {['SEB', 'Swedbank', 'Handelsbanken', 'Nordea'].map(bank => (
                                    <button
                                        key={bank}
                                        onClick={handleBankSelect}
                                        className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-slate-50 hover:border-blue-500 hover:text-blue-600 transition-all gap-2"
                                    >
                                        <Building2 className="h-6 w-6 opacity-70" />
                                        <span className="text-sm font-medium">{bank}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 'authenticating' && (
                        <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            <div>
                                <h3 className="font-medium">Öppnar BankID...</h3>
                                <p className="text-sm text-muted-foreground">Var god vänta medan vi ansluter till din bank.</p>
                            </div>
                        </div>
                    )}

                    {step === 'account-selection' && (
                        <div className="space-y-4">
                            <div className="text-center mb-4">
                                <h3 className="font-semibold">Välj konto att betala från</h3>
                            </div>

                            <button
                                onClick={handleAccountSelect}
                                className="w-full flex items-center justify-between p-4 border rounded-lg hover:border-blue-500 bg-slate-50 group"
                            >
                                <div className="text-left">
                                    <div className="font-medium group-hover:text-blue-700">Företagskonto</div>
                                    <div className="text-xs text-muted-foreground">1234-5678</div>
                                </div>
                                <div className="font-medium">
                                    54 230,00 kr
                                </div>
                            </button>

                            <button
                                className="w-full flex items-center justify-between p-4 border rounded-lg opacity-50 cursor-not-allowed"
                            >
                                <div className="text-left">
                                    <div className="font-medium">Sparkonto</div>
                                    <div className="text-xs text-muted-foreground">9876-5432</div>
                                </div>
                                <div className="font-medium">
                                    100,00 kr
                                </div>
                            </button>
                        </div>
                    )}

                    {step === 'signing' && (
                        <div className="space-y-6 text-center py-4">
                            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <ShieldCheck className="h-8 w-8 text-blue-600" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg">Bekräfta betalning</h3>
                                <div className="bg-slate-50 p-4 rounded-lg text-left text-sm space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Mottagare</span>
                                        <span className="font-medium">{recipientName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Belopp</span>
                                        <span className="font-medium">{formatCurrency(amount)}</span>
                                    </div>
                                </div>
                            </div>

                            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleSign}>
                                Signera med BankID
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            <div>
                                <h3 className="font-medium">Genomför betalning...</h3>
                                <p className="text-sm text-muted-foreground">Din bank behandlar transaktionen.</p>
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="py-6 text-center space-y-6">
                            <div className="mx-auto w-16 h-16 bg-green-100/50 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="h-8 w-8 text-green-600" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-semibold text-xl">Betalning klar!</h3>
                                <p className="text-sm text-muted-foreground">
                                    {formatCurrency(amount)} har skickats till {recipientName}.
                                </p>
                            </div>

                            <Button onClick={handleClose} className="w-full" variant="outline">
                                Stäng fönster
                            </Button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-slate-50 p-3 text-center text-[10px] text-muted-foreground border-t">
                    Powered by Tink • Regleras av Finansinspektionen
                </div>

            </DialogContent>
        </Dialog>
    )
}
