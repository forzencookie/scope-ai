"use client"

import { Users, Banknote, Wallet, Building2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface PayslipsStatsProps {
    stats: {
        currentPeriod: string
        employeeCount: number
        totalGross: number
        totalTax: number
        totalEmployerContributions: number
    }
}

export function PayslipsStats({ stats }: PayslipsStatsProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Employee Count */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                <Users className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                    <p className="text-xl md:text-2xl font-bold tabular-nums">{stats.employeeCount}</p>
                    <p className="text-xs text-muted-foreground">Antal anställda</p>
                </div>
            </div>

            {/* Total Gross */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                <Banknote className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                    <p className="text-xl md:text-2xl font-bold tabular-nums">{formatCurrency(stats.totalGross)}</p>
                    <p className="text-xs text-muted-foreground">Totalt brutto</p>
                </div>
            </div>

            {/* Total Tax */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                <Wallet className="h-5 w-5 text-red-500 shrink-0" />
                <div>
                    <p className="text-xl md:text-2xl font-bold tabular-nums text-red-600 dark:text-red-400">{formatCurrency(stats.totalTax)}</p>
                    <p className="text-xs text-muted-foreground">Skatt att betala</p>
                </div>
            </div>

            {/* Employer Contributions */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                <Building2 className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                    <p className="text-xl md:text-2xl font-bold tabular-nums">{formatCurrency(stats.totalEmployerContributions)}</p>
                    <p className="text-xs text-muted-foreground">Arbetsgivaravgifter</p>
                </div>
            </div>
        </div>
    )
}
