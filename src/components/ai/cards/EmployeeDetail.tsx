"use client"

import { Check, ArrowRight, User, Briefcase, Coins, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { useState } from "react"
import { useToast } from "@/components/ui/toast"

interface EmployeeDetailProps {
    data: {
        name: string
        role: string
        email: string
        salary: number | string
    }
}

export function EmployeeDetail({ data }: EmployeeDetailProps) {
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
    const { addToast: toast } = useToast()

    const handleConfirm = async () => {
        setStatus('saving')
        try {
            const res = await fetch('/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    salary: Number(data.salary)
                })
            })

            if (res.ok) {
                setStatus('saved')
                toast({
                    title: "Anställd registrerad",
                    description: `${data.name} har lagts till i teamet.`
                })
            } else {
                throw new Error("Failed to save")
            }
        } catch (error) {
            console.error(error)
            setStatus('error')
            toast({
                title: "Kunde inte spara",
                description: "Ett fel uppstod vid registrering.",
                variant: "destructive"
            })
        }
    }

    if (status === 'saved') {
        return (
            <div className="w-full max-w-sm space-y-3 py-2">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                        <Check className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-sm font-medium">Registrering klar</p>
                        <p className="text-xs text-muted-foreground">{data.name} är nu tillagd.</p>
                    </div>
                </div>
                <Button
                    size="sm"
                    variant="ghost"
                    className="text-emerald-600 hover:text-emerald-700 text-xs"
                    onClick={() => window.location.href = '/dashboard/loner?tab=team'}
                >
                    Gå till Team
                    <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
            </div>
        )
    }

    return (
        <div className="w-full max-w-sm space-y-1 py-1">
            {/* Header */}
            <div className="flex items-baseline gap-2 mb-3">
                <span className="text-sm font-semibold">Ny anställd</span>
                <span className="text-xs text-muted-foreground">Registrera i systemet</span>
            </div>

            {/* Details as clean rows */}
            <div className="space-y-2.5 text-sm">
                <div className="flex items-center gap-3">
                    <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div>
                        <p className="font-medium">{data.name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">{data.role}</span>
                </div>
                <div className="flex items-center gap-3">
                    <Coins className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">{formatCurrency(Number(data.salary))} / mån</span>
                </div>
                <div className="flex items-center gap-3">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">{data.email}</span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-3">
                <Button
                    size="sm"
                    onClick={handleConfirm}
                    disabled={status === 'saving'}
                >
                    {status === 'saving' ? 'Sparar...' : 'Registrera'}
                </Button>
                <Button variant="ghost" size="sm" disabled={status === 'saving'}>
                    Avbryt
                </Button>
            </div>
        </div>
    )
}
