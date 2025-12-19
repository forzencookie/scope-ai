"use client"

import {
    Calendar,
    Send,
    Wallet,
    Users,
    Banknote,
    Calculator,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { useToast } from "@/components/ui/toast"

interface AGIReport {
    period: string
    dueDate: string
    employees: number
    totalSalary: number
    tax: number
    contributions: number
    status: string
}

interface AGIDetailsDialogProps {
    report: AGIReport | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSend: (period: string) => void
}

export function AGIDetailsDialog({
    report,
    open,
    onOpenChange,
    onSend
}: AGIDetailsDialogProps) {
    const toast = useToast()

    if (!report) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md" expandable>
                <DialogHeader>
                    <DialogTitle>AGI-rapport</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex items-center gap-4 bg-muted/40 p-4 rounded-lg">

                        <div>
                            <p className="font-medium">{report.period}</p>
                            <p className="text-sm text-muted-foreground">Deadline: {report.dueDate}</p>
                        </div>
                        <div className="ml-auto">
                            <AppStatusBadge
                                status={report.status === "pending" ? "Väntar" : "Inskickad"}
                            />
                        </div>
                    </div>

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
                        <div className="flex justify-between items-center py-2 border-b">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Wallet className="h-4 w-4" />
                                <span>Skatteavdrag</span>
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

                    <div className="bg-muted/30 p-3 rounded-md">
                        <div className="flex justify-between items-center font-semibold">
                            <span>Totalt att betala</span>
                            <span className="text-lg">{formatCurrency(report.tax + report.contributions)}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Stäng
                    </Button>
                    {report.status === "pending" && (
                        <Button onClick={() => {
                            onOpenChange(false)
                            onSend(report.period)
                            toast.success("Rapport skickad", `AGI för ${report.period} skickades till Skatteverket`)
                        }}>
                            <Send className="h-4 w-4 mr-2" />
                            Skicka till Skatteverket
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
