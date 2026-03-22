"use client"

import {
    Wallet,
    Users,
    Banknote,
    Calculator,
    Download,
    User,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { useToast } from "@/components/ui/toast"
import { useCompany } from "@/providers/company-provider"
import { generateAgiXML } from "@/lib/generators/agi-generator"
import type { AGIReport } from "@/components/rapporter/agi/use-employer-declaration"

interface AGIDetailsDialogProps {
    report: AGIReport | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function AGIDetailsDialog({
    report,
    open,
    onOpenChange,
}: AGIDetailsDialogProps) {
    const toast = useToast()
    const { company } = useCompany()

    if (!report) return null

    const handleDownload = () => {
        const xml = generateAgiXML({
            period: report.period,
            orgNumber: company?.orgNumber || "556000-0000",
            companyName: company?.name,
            totalSalary: report.totalSalary,
            totalBenefits: report.totalBenefits,
            tax: report.tax,
            contributions: report.contributions,
            employees: report.employees,
            individualData: report.individualData,
        })

        const blob = new Blob([xml], { type: "text/xml" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `agi-${report.period.replace(/\s+/g, '-').toLowerCase()}.xml`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast.success("AGI fil nerladdad", `AGI för ${report.period} sparades`)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg" expandable>
                <DialogHeader>
                    <DialogTitle>AGI-rapport</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {/* Period header */}
                    <div className="flex items-center gap-4 bg-muted/40 p-4 rounded-lg">
                        <div>
                            <p className="font-medium">{report.period}</p>
                            <p className="text-sm text-muted-foreground">Deadline: {report.dueDate}</p>
                        </div>
                        <div className="ml-auto">
                            <AppStatusBadge
                                status={report.status === "Inskickad" ? "Inskickad" : "Kommande"}
                            />
                        </div>
                    </div>

                    {/* Huvuduppgift — employer totals */}
                    <div>
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Huvuduppgift</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Users className="h-4 w-4" />
                                    <span>Antal anställda</span>
                                </div>
                                <span className="font-medium">{report.employees} st</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Banknote className="h-4 w-4" />
                                    <span>Total bruttolön</span>
                                </div>
                                <span className="font-medium">{formatCurrency(report.totalSalary)}</span>
                            </div>
                            {report.totalBenefits > 0 && (
                                <div className="flex justify-between items-center py-2 border-b">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Banknote className="h-4 w-4" />
                                        <span>Skattepliktiga förmåner</span>
                                    </div>
                                    <span className="font-medium">{formatCurrency(report.totalBenefits)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center py-2 border-b">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Wallet className="h-4 w-4" />
                                    <span>Skatteavdrag (FK497)</span>
                                </div>
                                <span className="font-medium">{formatCurrency(report.tax)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calculator className="h-4 w-4" />
                                    <span>Arbetsgivaravgifter</span>
                                </div>
                                <span className="font-medium">{formatCurrency(report.contributions)}</span>
                            </div>
                        </div>

                        <div className="bg-muted/30 p-3 rounded-md mt-3">
                            <div className="flex justify-between items-center font-semibold">
                                <span>Totalt att betala</span>
                                <span className="text-lg">{formatCurrency(report.tax + report.contributions)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Individuppgift — per-employee breakdown */}
                    {report.individualData && report.individualData.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Individuppgifter</h4>
                            <div className="space-y-2">
                                {report.individualData.map((emp, idx) => (
                                    <div key={idx} className="border rounded-lg p-3 space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium text-sm">{emp.name || "Okänd"}</span>
                                            <span className="text-xs text-muted-foreground ml-auto">
                                                {emp.personalNumber ? `${emp.personalNumber.slice(0, 8)}-****` : "—"}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                            <div className="text-muted-foreground">Bruttolön (FK011)</div>
                                            <div className="text-right font-medium">{formatCurrency(emp.grossSalary)}</div>
                                            <div className="text-muted-foreground">Skatteavdrag (FK001)</div>
                                            <div className="text-right font-medium">{formatCurrency(emp.taxDeduction)}</div>
                                            {emp.benefitValue > 0 && (
                                                <>
                                                    <div className="text-muted-foreground">Förmåner (FK012)</div>
                                                    <div className="text-right font-medium">{formatCurrency(emp.benefitValue)}</div>
                                                </>
                                            )}
                                            <div className="text-muted-foreground">Arbetsgivaravgift</div>
                                            <div className="text-right font-medium">{formatCurrency(emp.employerContribution)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Stäng
                    </Button>
                    <Button onClick={handleDownload}>
                        <Download className="h-4 w-4 mr-2" />
                        Ladda ner XML
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
