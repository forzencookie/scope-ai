"use client"

import {
    Send,
    Download,
    User,
    Banknote,
    Wallet,
    Building2,
    FileText,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { useToast } from "@/components/ui/toast"
import { downloadElementAsPDF } from "@/lib/exports/pdf-generator"
import { useAllTaxRates } from "@/hooks/use-tax-parameters"

interface Payslip {
    id: string | number
    employee: string
    period: string
    grossSalary: number
    netSalary: number
    tax: number
    status: string
}

interface PayslipDetailsDialogProps {
    payslip: Payslip | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSend?: (id: string | number) => void
}

export function PayslipDetailsDialog({
    payslip,
    open,
    onOpenChange,
    onSend
}: PayslipDetailsDialogProps) {
    const toast = useToast()
    const { rates: taxRates } = useAllTaxRates(new Date().getFullYear())

    if (!payslip) return null

    const employerContributions = Math.round(payslip.grossSalary * (taxRates?.employerContributionRate ?? 0))
    const pensionCost = Math.round(payslip.grossSalary * 0.045)
    const totalEmployerCost = payslip.grossSalary + employerContributions + pensionCost

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Lönespecifikation</DialogTitle>
                </DialogHeader>

                <div id="payslip-preview" className="space-y-4 py-4 bg-white dark:bg-background">
                    {/* Employee & Period Header */}
                    <div className="flex items-center gap-4 bg-muted/40 p-4 rounded-lg">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium">{payslip.employee}</p>
                            <p className="text-sm text-muted-foreground">{payslip.period}</p>
                        </div>
                        <AppStatusBadge
                            status={payslip.status === "pending" ? "Väntar" : "Skickad"}
                        />
                    </div>

                    {/* Salary Breakdown */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Banknote className="h-4 w-4" />
                                <span>Bruttolön</span>
                            </div>
                            <span className="font-medium">{formatCurrency(payslip.grossSalary)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Wallet className="h-4 w-4" />
                                <span>Skatteavdrag</span>
                            </div>
                            <span className="font-medium text-red-600 dark:text-red-500">
                                -{formatCurrency(payslip.tax)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Building2 className="h-4 w-4" />
                                <span>Arbetsgivaravgifter ({taxRates ? (taxRates.employerContributionRate * 100).toFixed(2).replace('.', ',') : '—'}%)</span>
                            </div>
                            <span className="font-medium text-muted-foreground">
                                {formatCurrency(employerContributions)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b text-muted-foreground text-sm">
                            <span>Tjänstepension (4,5%)</span>
                            <span>{formatCurrency(pensionCost)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b text-muted-foreground text-sm">
                            <span>Semesterersättning ({taxRates ? (taxRates.vacationPayRate * 100).toFixed(0) : '—'}%)</span>
                            <span>{formatCurrency(Math.round(payslip.grossSalary * (taxRates?.vacationPayRate ?? 0)))}</span>
                        </div>
                    </div>

                    {/* Net Salary Summary */}
                    <div className="bg-primary/5 p-4 rounded-lg border-2 border-primary/20">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-muted-foreground">Nettolön (utbetalas)</p>
                                <p className="text-2xl font-bold">{formatCurrency(payslip.netSalary)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">Total kostnad</p>
                                <p className="text-lg font-semibold text-muted-foreground">{formatCurrency(totalEmployerCost)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Tax Rate Info */}
                    <div className="bg-muted/30 p-3 rounded-md text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>Skattesats: {payslip.grossSalary > 0 ? Math.round((payslip.tax / payslip.grossSalary) * 100) : 0}% (preliminärskatt)</span>
                        </div>
                        <p className="text-xs pl-6">Skatten baseras på den anställdes kommunala skattesats och skattetabell.</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={async () => {
                        toast.info("Laddar ner", "Förbereder PDF...")
                        try {
                            await downloadElementAsPDF({ fileName: `lonespec-${payslip.employee.replace(/\s+/g, '-')}-${payslip.period}`, elementId: 'payslip-preview' })
                            toast.success("Klart", "Lönespecifikation har laddats ner.")
                        } catch {
                            toast.error("Fel", "Kunde inte skapa PDF.")
                        }
                    }}>
                        <Download className="h-4 w-4 mr-2" />
                        Ladda ner PDF
                    </Button>
                    {payslip.status === "pending" && onSend && (
                        <Button size="sm" onClick={() => {
                            onSend(payslip.id)
                            onOpenChange(false)
                            toast.success("Lönespecifikation skickad", `Skickades till ${payslip.employee}`)
                        }}>
                            <Send className="h-4 w-4 mr-2" />
                            Skicka till anställd
                        </Button>
                    )}
                    {payslip.status !== "pending" && (
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Stäng
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
