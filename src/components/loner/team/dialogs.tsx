"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Clock, Car, FileText, Banknote, Gift, Wallet, MapPin } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface AddEmployeeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    newEmployee: { name: string, role: string, email: string, salary: string, kommun?: string }
    onChange: (field: string, value: string) => void
    onSave: () => void
    isSaving: boolean
}

export function AddEmployeeDialog({
    open,
    onOpenChange,
    newEmployee,
    onChange,
    onSave,
    isSaving
}: AddEmployeeDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Lägg till anställd</DialogTitle>
                    <DialogDescription>
                        Fyll i uppgifter för den nya anställda.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Namn</Label>
                            <Input
                                value={newEmployee.name}
                                onChange={e => onChange('name', e.target.value)}
                                placeholder="Förnamn Efternamn"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Roll</Label>
                            <Input
                                value={newEmployee.role}
                                onChange={e => onChange('role', e.target.value)}
                                placeholder="Titel"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>E-post</Label>
                        <Input
                            value={newEmployee.email}
                            onChange={e => onChange('email', e.target.value)}
                            placeholder="namn@foretag.se"
                            type="email"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Månadslön (brutto)</Label>
                            <Input
                                value={newEmployee.salary}
                                onChange={e => onChange('salary', e.target.value)}
                                placeholder="t.ex. 35000"
                                type="number"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Kommun</Label>
                            <Input
                                value={newEmployee.kommun || ''}
                                onChange={e => onChange('kommun', e.target.value)}
                                placeholder="t.ex. Stockholm"
                            />
                            <p className="text-xs text-muted-foreground">Folkbokföringskommun</p>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
                    <Button onClick={onSave} disabled={isSaving}>
                        {isSaving ? "Sparar..." : "Spara anställd"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

interface ReportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    employeeName?: string
    reportType: 'time' | 'expense' | 'mileage'
    onReportTypeChange: (type: 'time' | 'expense' | 'mileage') => void
    
    amount: string; setAmount: (v: string) => void;
    km: string; setKm: (v: string) => void;
    desc: string; setDesc: (v: string) => void;
    hours: string; setHours: (v: string) => void;
    
    onSubmit: () => void
}

export function ReportDialog({
    open, onOpenChange, 
    employeeName,
    reportType, onReportTypeChange,
    amount, setAmount,
    km, setKm,
    desc, setDesc,
    hours, setHours,
    onSubmit
}: ReportDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Rapportering - {employeeName}</DialogTitle>
                </DialogHeader>
                
                <Tabs value={reportType} onValueChange={(v) => onReportTypeChange(v as "time" | "expense" | "mileage")} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="time">
                            <Clock className="h-4 w-4 mr-2" />
                            Tid
                        </TabsTrigger>
                        <TabsTrigger value="expense">
                            <FileText className="h-4 w-4 mr-2" />
                            Utlägg
                        </TabsTrigger>
                        <TabsTrigger value="mileage">
                            <Car className="h-4 w-4 mr-2" />
                            Resor
                        </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="time" className="space-y-4">
                        <div className="space-y-2">
                            <Label>Antal timmar</Label>
                            <Input 
                                type="number" 
                                placeholder="8" 
                                value={hours}
                                onChange={e => setHours(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Beskrivning</Label>
                            <Textarea 
                                placeholder="Vad har du arbetat med?" 
                                value={desc}
                                onChange={e => setDesc(e.target.value)}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="expense" className="space-y-4">
                        <div className="space-y-2">
                            <Label>Belopp (kr)</Label>
                            <Input 
                                type="number" 
                                placeholder="t.ex. 150" 
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Syfte/Beskrivning</Label>
                            <Input 
                                placeholder="t.ex. Lunch med kund" 
                                value={desc}
                                onChange={e => setDesc(e.target.value)}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="mileage" className="space-y-4">
                        <div className="space-y-2">
                            <Label>Avstånd (km)</Label>
                            <Input 
                                type="number" 
                                placeholder="t.ex. 45" 
                                value={km}
                                onChange={e => setKm(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Destination/Syfte</Label>
                            <Input 
                                placeholder="t.ex. Kundbesök Stockholm" 
                                value={desc}
                                onChange={e => setDesc(e.target.value)}
                            />
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
                    <Button onClick={onSubmit}>Spara rapport</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// --- Employee Dossier Dialog ---

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
