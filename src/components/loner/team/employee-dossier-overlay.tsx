"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Car, Banknote, Gift, Wallet, MapPin, History, FileText, User } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { PageOverlay } from "@/components/shared"

// --- Employee Dossier Overlay (read-only) ---

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

interface EmployeeDossierOverlayProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    employee: { id: string; name: string; role: string; kommun?: string; tax_rate?: number } | null
    salaryHistory: SalaryRecord[]
    expenses: ExpenseRecord[]
    benefits: string[]
    balance: number
    mileage: number
}

/**
 * EmployeeDossierOverlay - Immersive detail view for an employee.
 * Replaces the old EmployeeDossierDialog.
 */
export function EmployeeDossierOverlay({
    open,
    onOpenChange,
    employee,
    salaryHistory,
    expenses,
    benefits,
    balance,
    mileage
}: EmployeeDossierOverlayProps) {
    if (!employee) return null

    const totalGrossPaid = salaryHistory.reduce((sum, s) => sum + s.grossSalary, 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
    const scoobyPrompt = `Jag vill ändra detaljer för min anställda ${employee.name}.`

    return (
        <PageOverlay
            isOpen={open}
            onClose={() => onOpenChange(false)}
            title={employee.name}
            subtitle={employee.role}
            scoobyPrompt={scoobyPrompt}
            status={
                employee.kommun ? (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full border">
                        <MapPin className="h-3 w-3" />
                        {employee.kommun}
                    </div>
                ) : null
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Summary Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card className="bg-emerald-500/[0.03] border-emerald-500/10">
                            <CardContent className="p-4 flex flex-col gap-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/70">Total bruttolön</span>
                                <span className="text-xl font-bold">{formatCurrency(totalGrossPaid)}</span>
                            </CardContent>
                        </Card>
                        <Card className="bg-rose-500/[0.03] border-rose-500/10">
                            <CardContent className="p-4 flex flex-col gap-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600/70">Utläggsskuld</span>
                                <span className="text-xl font-bold">{formatCurrency(balance)}</span>
                            </CardContent>
                        </Card>
                        <Card className="bg-blue-500/[0.03] border-blue-500/10">
                            <CardContent className="p-4 flex flex-col gap-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600/70">Milersättning</span>
                                <span className="text-xl font-bold">{formatCurrency(mileage)}</span>
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs defaultValue="salary" className="w-full">
                        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
                            <TabsTrigger value="salary" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2 text-sm font-medium">Lönehistorik</TabsTrigger>
                            <TabsTrigger value="expenses" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2 text-sm font-medium">Utlägg & Resor</TabsTrigger>
                            <TabsTrigger value="benefits" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2 text-sm font-medium">Förmåner</TabsTrigger>
                        </TabsList>

                        <TabsContent value="salary" className="mt-6">
                            <Card>
                                <CardContent className="p-0">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-muted/50 border-b">
                                                <th className="px-4 py-2 text-left font-medium text-xs uppercase tracking-wider text-muted-foreground">Period</th>
                                                <th className="px-4 py-2 text-right font-medium text-xs uppercase tracking-wider text-muted-foreground">Brutto</th>
                                                <th className="px-4 py-2 text-right font-medium text-xs uppercase tracking-wider text-muted-foreground">Skatt</th>
                                                <th className="px-4 py-2 text-right font-medium text-xs uppercase tracking-wider text-muted-foreground">Netto</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {salaryHistory.map((record, i) => (
                                                <tr key={i} className="hover:bg-muted/20">
                                                    <td className="px-4 py-3 font-medium">{record.period}</td>
                                                    <td className="px-4 py-3 text-right">{formatCurrency(record.grossSalary)}</td>
                                                    <td className="px-4 py-3 text-right text-rose-600">-{formatCurrency(record.tax)}</td>
                                                    <td className="px-4 py-3 text-right font-bold">{formatCurrency(record.netSalary)}</td>
                                                </tr>
                                            ))}
                                            {salaryHistory.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground italic">Ingen lönehistorik registrerad.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="expenses" className="mt-6">
                            <Card>
                                <CardContent className="p-0">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-muted/50 border-b">
                                                <th className="px-4 py-2 text-left font-medium text-xs uppercase tracking-wider text-muted-foreground">Datum</th>
                                                <th className="px-4 py-2 text-left font-medium text-xs uppercase tracking-wider text-muted-foreground">Beskrivning</th>
                                                <th className="px-4 py-2 text-left font-medium text-xs uppercase tracking-wider text-muted-foreground">Typ</th>
                                                <th className="px-4 py-2 text-right font-medium text-xs uppercase tracking-wider text-muted-foreground">Belopp</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {expenses.map((exp, i) => (
                                                <tr key={i} className="hover:bg-muted/20">
                                                    <td className="px-4 py-3 text-muted-foreground">{exp.date}</td>
                                                    <td className="px-4 py-3 font-medium">{exp.description}</td>
                                                    <td className="px-4 py-3 uppercase text-[10px] font-bold tracking-widest text-muted-foreground/70">
                                                        {exp.type === 'mileage' ? 'Resa' : 'Utlägg'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold">{formatCurrency(exp.amount)}</td>
                                                </tr>
                                            ))}
                                            {expenses.length > 0 && (
                                                <tr className="bg-muted/30 font-bold border-t">
                                                    <td colSpan={3} className="px-4 py-3">Totalt</td>
                                                    <td className="px-4 py-3 text-right">{formatCurrency(totalExpenses)}</td>
                                                </tr>
                                            )}
                                            {expenses.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground italic">Inga utlägg registrerade.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="benefits" className="mt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {benefits.map((b, i) => (
                                    <Card key={i} className="border-dashed bg-muted/10">
                                        <CardContent className="p-4 flex items-center gap-3">
                                            <div className="p-2 rounded-full bg-primary/10">
                                                <Gift className="h-4 w-4 text-primary" />
                                            </div>
                                            <span className="text-sm font-medium">{b}</span>
                                        </CardContent>
                                    </Card>
                                ))}
                                {benefits.length === 0 && (
                                    <div className="col-span-2 py-12 text-center border-2 border-dashed rounded-xl">
                                        <p className="text-sm text-muted-foreground italic">Inga aktiva förmåner registrerade.</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Anställningsinfo</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <User className="h-3.5 w-3.5" />
                                    Roll
                                </div>
                                <p className="text-sm font-semibold">{employee.role}</p>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <History className="h-3.5 w-3.5" />
                                    Skattesats
                                </div>
                                <p className="text-sm font-semibold">{employee.tax_rate ? `${Math.round(employee.tax_rate * 100)}%` : 'Ej angiven'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-primary/5 border-primary/10">
                        <CardHeader>
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary/60">Snabba åtgärder</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                För att ändra lön, lägga till utlägg eller registrera tid, prata med Scooby i chatten.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageOverlay>
    )
}
