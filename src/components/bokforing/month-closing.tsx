"use client"

import { useState } from "react"
import { useMonthClosing } from "@/hooks/use-month-closing"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/shared"
import { cn } from "@/lib/utils"
import { Lock, Unlock, FileCheck } from "lucide-react"

export function MonthClosing() {
    const { getPeriod, lockPeriod, unlockPeriod, toggleCheck, getVerificationStats } = useMonthClosing()
    const currentYear = new Date().getFullYear()
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1) // Default to current month (1-indexed)

    const months = Array.from({ length: 12 }, (_, i) => i + 1)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"]

    const period = getPeriod(currentYear, selectedMonth)
    const stats = getVerificationStats(currentYear, selectedMonth)
    const isLocked = period.status === 'locked'

    return (
        <div className="space-y-6 min-w-0">
            <PageHeader
                title="Månadsavslut"
                subtitle="Stäm av, kontrollera och lås perioder."
            />

            {/* Timeline */}
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2 pb-4">
                {months.map(m => {
                    const p = getPeriod(currentYear, m)
                    const isSelected = m === selectedMonth
                    return (
                        <button
                            key={m}
                            onClick={() => setSelectedMonth(m)}
                            className={cn(
                                "flex flex-col items-center gap-2 p-2 md:p-3 rounded-lg border transition-all",
                                isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "bg-card hover:bg-muted/50",
                                p.status === 'locked' ? "opacity-75" : ""
                            )}
                        >
                            <span className="text-sm font-medium">{monthNames[m - 1]}</span>
                            <div className={cn(
                                "h-3 w-3 rounded-full",
                                p.status === 'locked' ? "bg-green-500" :
                                    p.status === 'review' ? "bg-yellow-500" : "bg-slate-300"
                            )} />
                        </button>
                    )
                })}
            </div>

            {/* Detail View */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className={cn("min-w-0", isLocked && "bg-muted/30")}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-2">
                                    {isLocked ? <Lock className="h-5 w-5 text-green-600" /> : <Unlock className="h-5 w-5 text-muted-foreground" />}
                                    {monthNames[selectedMonth - 1]} {currentYear}
                                </CardTitle>
                                <CardDescription>
                                    {isLocked
                                        ? `Låst ${period.locked_at?.split('T')[0]}`
                                        : "Perioden är öppen för bokföring"
                                    }
                                </CardDescription>
                            </div>
                            <Badge variant={isLocked ? "default" : "secondary"} className="text-sm px-3 py-1">
                                {isLocked ? "LÅST" : "ÖPPEN"}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-background rounded-md border">
                                <p className="text-xs text-muted-foreground">Verifikationer</p>
                                <p className="text-xl font-bold">{stats.verificationCount}</p>
                            </div>
                            <div className="p-3 bg-background rounded-md border">
                                <p className="text-xs text-muted-foreground">Avvikelser</p>
                                <p className={`text-xl font-bold ${stats.discrepancyCount === 0 ? 'text-green-600' : 'text-red-600'}`}>{stats.discrepancyCount}</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-4 border-t flex justify-end">
                            {isLocked ? (
                                <Button variant="outline" onClick={() => unlockPeriod(currentYear, selectedMonth)}>
                                    <Unlock className="h-4 w-4 mr-2" />
                                    Lås upp period
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => lockPeriod(currentYear, selectedMonth)}
                                // disabled={!period.checks.bankReconciled} // Strict mode?
                                >
                                    <Lock className="h-4 w-4 mr-2" />
                                    Lås period
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Checklist */}
                <Card className="min-w-0">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileCheck className="h-5 w-5" />
                            Avstämningskoll
                        </CardTitle>
                        <CardDescription>Åtgärder innan stängning</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                            <Checkbox
                                id="check-bank"
                                checked={period.checks.bankReconciled}
                                onCheckedChange={() => toggleCheck(currentYear, selectedMonth, 'bankReconciled')}
                                disabled={isLocked}
                            />
                            <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="check-bank" className="font-medium cursor-pointer">
                                    Avstämning Bankkonto (1930)
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Kontrollera att bokfört saldo stämmer med kontoutdraget.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                            <Checkbox
                                id="check-vat"
                                checked={period.checks.vatReported}
                                onCheckedChange={() => toggleCheck(currentYear, selectedMonth, 'vatReported')}
                                disabled={isLocked}
                            />
                            <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="check-vat" className="font-medium cursor-pointer">
                                    Momsredovisning
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Momsrapport skapad och kontrollerad (Konto 2650).
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                            <Checkbox
                                id="check-decl"
                                checked={period.checks.declarationsDone}
                                onCheckedChange={() => toggleCheck(currentYear, selectedMonth, 'declarationsDone')}
                                disabled={isLocked}
                            />
                            <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="check-decl" className="font-medium cursor-pointer">
                                    Arbetsgivardeklaration
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Löner och avgifter bokförda och rapporterade.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                            <Checkbox
                                id="check-cat"
                                checked={period.checks.allCategorized}
                                onCheckedChange={() => toggleCheck(currentYear, selectedMonth, 'allCategorized')}
                                disabled={isLocked}
                            />
                            <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="check-cat" className="font-medium cursor-pointer">
                                    Inget okategoriserat
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Inga transaktioner på OBS-kontot.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
