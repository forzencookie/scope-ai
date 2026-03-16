"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Car, Banknote, Gift, Wallet, MapPin } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

// --- Employee Dossier Dialog (read-only) ---

export interface SalaryRecord {
    period: string
    grossSalary: number
    netSalary: number
    tax: number
    status: string
}

export interface ExpenseRecord {
    date: string
    description: string
    amount: number
    type: 'expense' | 'mileage'
}

interface EmployeeDossierDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    employee: { id: string; name: string; role: string; kommun?: string; tax_rate?: number } | null
    salaryHistory: SalaryRecord[]
    expenses: ExpenseRecord[]
    benefits: string[]
    balance: number
    mileage: number
}

export function EmployeeDossierDialog({
    open,
    onOpenChange,
    employee,
    salaryHistory,
    expenses,
    benefits,
    balance,
    mileage
}: EmployeeDossierDialogProps) {
    if (!employee) return null

    const totalGrossPaid = salaryHistory.reduce((sum, s) => sum + s.grossSalary, 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle>{employee.name}</DialogTitle>
                    <DialogDescription>
                        {employee.role}
                        {employee.kommun && (
                            <span className="ml-2 inline-flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {employee.kommun}
                                {employee.tax_rate != null && ` · ${Math.round(employee.tax_rate * 100)}% skatt`}
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/30 border border-border/50">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Banknote className="h-3 w-3" /> Total brutto
                        </span>
                        <span className="font-semibold text-sm">{formatCurrency(totalGrossPaid)}</span>
                    </div>
                    <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/30 border border-border/50">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Wallet className="h-3 w-3" /> Utläggskuld
                        </span>
                        <span className="font-semibold text-sm">{formatCurrency(balance)}</span>
                    </div>
                    <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/30 border border-border/50">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Car className="h-3 w-3" /> Resor
                        </span>
                        <span className="font-semibold text-sm">{formatCurrency(mileage)}</span>
                    </div>
                </div>

                <Tabs defaultValue="salary" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="salary">Lönehistorik</TabsTrigger>
                        <TabsTrigger value="expenses">Utlägg</TabsTrigger>
                        <TabsTrigger value="benefits">Förmåner</TabsTrigger>
                    </TabsList>

                    <TabsContent value="salary" className="max-h-[300px] overflow-y-auto">
                        {salaryHistory.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">Ingen lönehistorik ännu.</p>
                        ) : (
                            <div className="space-y-1">
                                {salaryHistory.map((record, i) => (
                                    <div key={i} className="flex items-center justify-between py-2 px-1 border-b last:border-0 text-sm">
                                        <span className="text-muted-foreground">{record.period}</span>
                                        <div className="flex gap-4">
                                            <span>{formatCurrency(record.grossSalary)}</span>
                                            <span className="text-red-600">-{formatCurrency(record.tax)}</span>
                                            <span className="font-medium">{formatCurrency(record.netSalary)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="expenses" className="max-h-[300px] overflow-y-auto">
                        {expenses.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">Inga utlägg registrerade.</p>
                        ) : (
                            <div className="space-y-1">
                                {expenses.map((exp, i) => (
                                    <div key={i} className="flex items-center justify-between py-2 px-1 border-b last:border-0 text-sm">
                                        <div>
                                            <p>{exp.description}</p>
                                            <p className="text-xs text-muted-foreground">{exp.date} · {exp.type === 'mileage' ? 'Resa' : 'Utlägg'}</p>
                                        </div>
                                        <span className="font-medium">{formatCurrency(exp.amount)}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between pt-2 font-medium text-sm">
                                    <span>Totalt</span>
                                    <span>{formatCurrency(totalExpenses)}</span>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="benefits" className="max-h-[300px] overflow-y-auto">
                        {benefits.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">Inga aktiva förmåner.</p>
                        ) : (
                            <div className="space-y-2">
                                {benefits.map((b, i) => (
                                    <div key={i} className="flex items-center gap-2 py-2 px-1 border-b last:border-0 text-sm">
                                        <Gift className="h-4 w-4 text-muted-foreground" />
                                        <span>{b}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Stäng</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
