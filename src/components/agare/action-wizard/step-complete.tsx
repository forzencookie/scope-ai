"use client"

import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

interface StepCompleteProps {
    onClose: () => void
}

export function StepComplete({ onClose }: StepCompleteProps) {
    return (
        <div className="text-center py-8 space-y-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center border-4 border-emerald-50 dark:border-emerald-900 animate-in zoom-in duration-500">
                <Check className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="space-y-2">
                <p className="text-xl font-bold">Åtgärden har registrerats!</p>
                <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
                    Vi har genererat ett utkast till styrelseprotokoll. Du hittar det nu i dokumentlistan för granskning och signering.
                </p>
            </div>
            <div className="pt-4">
                <Button
                    onClick={onClose}
                    className="min-w-[120px] bg-foreground text-background hover:bg-foreground/90"
                >
                    Stäng
                </Button>
            </div>
        </div>
    )
}
