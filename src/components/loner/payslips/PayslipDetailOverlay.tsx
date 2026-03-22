"use client"

import { AppStatusBadge } from "@/components/ui/status-badge"
import {
    User,
    Calendar,
    Banknote,
    Wallet,
    Calculator,
} from "lucide-react"
import { PageOverlay } from "@/components/shared"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { useAllTaxRates } from "@/hooks/use-tax-parameters"
import type { Payslip } from "./use-payslips-logic"
import { isAppStatus } from "@/lib/status-types"

interface PayslipDetailOverlayProps {
    isOpen: boolean
    onClose: () => void
    payslip: Payslip | null
}

/**
 * PayslipDetailOverlay — Immersive detail view for a payslip (lönebesked).
 */
export function PayslipDetailOverlay({
    isOpen,
    onClose,
    payslip,
}: PayslipDetailOverlayProps) {
    const { rates: taxRates } = useAllTaxRates(new Date().getFullYear())

    if (!payslip) return null

    const employerContributionRate = taxRates?.employerContributionRate ?? 0
    const employerContribution = Math.round(payslip.grossSalary * employerContributionRate)
    const totalCost = payslip.grossSalary + employerContribution

    const scoobyPrompt = `Jag vill veta mer om lönebeskedet för ${payslip.employee} period ${payslip.period}.`

    return (
        <PageOverlay
            isOpen={isOpen}
            onClose={onClose}
            title={`Lönebesked — ${payslip.employee}`}
            subtitle={`Period: ${payslip.period}`}
            scoobyPrompt={scoobyPrompt}
            status={
                isAppStatus(payslip.status)
                    ? <AppStatusBadge status={payslip.status} size="sm" />
                    : undefined
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Banknote className="h-4 w-4 text-muted-foreground" />
                                Lönespecifikation
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-lg border overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-muted/50 border-b">
                                            <th className="px-4 py-2 text-left font-medium">Post</th>
                                            <th className="px-4 py-2 text-right font-medium">Belopp</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        <tr className="hover:bg-muted/20">
                                            <td className="px-4 py-3">Bruttolön</td>
                                            <td className="px-4 py-3 text-right tabular-nums font-medium">
                                                {formatCurrency(payslip.grossSalary)}
                                            </td>
                                        </tr>
                                        <tr className="hover:bg-muted/20">
                                            <td className="px-4 py-3 text-muted-foreground">Skatteavdrag</td>
                                            <td className="px-4 py-3 text-right tabular-nums text-red-600">
                                                −{formatCurrency(payslip.tax)}
                                            </td>
                                        </tr>
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-muted/30 font-bold border-t">
                                            <td className="px-4 py-2">Nettolön (utbetalas)</td>
                                            <td className="px-4 py-2 text-right tabular-nums text-green-600">
                                                {formatCurrency(payslip.netSalary)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Employer costs */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Calculator className="h-4 w-4 text-muted-foreground" />
                                Arbetsgivarens kostnader
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-muted-foreground">Bruttolön</span>
                                <span className="font-medium tabular-nums">{formatCurrency(payslip.grossSalary)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-muted-foreground">Arbetsgivaravgifter ({(employerContributionRate * 100).toFixed(2)}%)</span>
                                <span className="font-medium tabular-nums">{formatCurrency(employerContribution)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 font-bold text-lg">
                                <span>Total lönekostnad</span>
                                <span className="tabular-nums">{formatCurrency(totalCost)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                                Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <User className="h-3.5 w-3.5" />
                                    Anställd
                                </div>
                                <p className="text-sm font-semibold">{payslip.employee}</p>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Period
                                </div>
                                <p className="text-sm font-semibold">{payslip.period}</p>
                            </div>
                            {payslip.paymentDate && (
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="h-3.5 w-3.5" />
                                        Utbetalningsdatum
                                    </div>
                                    <p className="text-sm font-semibold">{payslip.paymentDate}</p>
                                </div>
                            )}
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Wallet className="h-3.5 w-3.5" />
                                    Nettolön
                                </div>
                                <p className="text-lg font-bold tabular-nums text-green-600">
                                    {formatCurrency(payslip.netSalary)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageOverlay>
    )
}
