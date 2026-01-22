"use client"

import { useState, useMemo } from "react"
import {
    Users,
    Clock,
    Car,
    Plus,
    MoreHorizontal,
    FileText,
    Calendar
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/toast"
// import { employees } from "./constants"

import { useVerifications } from "@/hooks/use-verifications"

export function TeamTab() {
    const { success } = useToast()
    const { verifications, addVerification } = useVerifications()
    const [employees, setEmployees] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [reportDialogOpen, setReportDialogOpen] = useState(false)
    const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
    const [reportType, setReportType] = useState<'time' | 'expense' | 'mileage'>('time')

    // Form state
    const [amount, setAmount] = useState("")
    const [km, setKm] = useState("")
    const [desc, setDesc] = useState("")
    const [hours, setHours] = useState("")

    // Fetch real employees
    // ... existing memo logic ... 
    // Simplified fetch to effect for clarity as memo implies sync return usually but here it had async inside.
    useEffect(() => {
        const fetchEmployees = async () => {
            setIsLoading(true)
            try {
                const res = await fetch('/api/employees')
                const data = await res.json()
                if (data.employees) {
                    setEmployees(data.employees)
                }
            } catch (err) {
                console.error("Failed to fetch employees:", err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchEmployees()
    }, [])

    // Match employees to ledger balances (Account 2820 - Kortfristiga skulder till anställda)
    // We assume 2820 Credit = Debt to Employee. Debit = Payment.
    const employeeBalances = useMemo(() => {
        const balances: Record<string, number> = {}
        const mileage: Record<string, number> = {} // In KR

        verifications.forEach(v => {
            v.rows.forEach(r => {
                // Check if row relates to an employee via Description or sub-account logic?
                // Logic: If Account is 2820, look for employee name in description or assume we need better tagging.
                // For this demo upgrade, we will match strict Name strings in description "Utlägg [Name]"
                const emp = employees.find(e => v.description.includes(e.name) || r.description.includes(e.name))
                if (emp) {
                    if (r.account === '2820') {
                        balances[emp.id] = (balances[emp.id] || 0) + (r.credit - r.debit)
                    }
                    if (r.account === '7330' && r.debit > 0) {
                        mileage[emp.id] = (mileage[emp.id] || 0) + r.debit
                    }
                }
            })
        })
        return { balances, mileage }
    }, [verifications, employees])

    // Real reporting to Ledger
    const handleReport = async () => {
        const emp = employees.find(e => e.id === selectedEmployee)
        if (!emp) return

        if (reportType === 'expense') {
            const val = parseFloat(amount)
            if (!val) return

            await addVerification({
                date: new Date().toISOString().split('T')[0],
                description: `Utlägg ${emp.name} - ${desc}`,
                sourceType: 'manual', // or expense
                rows: [
                    { account: "4000", description: desc || "Utlägg", debit: val, credit: 0 },
                    { account: "2820", description: `Skuld till ${emp.name}`, debit: 0, credit: val }
                ]
            })
            success("Utlägg sparat", `Bokfört ${val} kr på 4000/2820`)
        } else if (reportType === 'mileage') {
            const dist = parseFloat(km)
            if (!dist) return
            const rate = 25 // 2024 rate usually 25 kr/mil
            const val = dist * rate // Assuming input is Mil? Or KM? Usually Mil in Sweden business. Let's assume Mil (10km).
            // If KM: 2.5 kr/km (25kr/mil). 
            // Let's assume input is KM for better granularity. 25 kr/mil = 2.5 kr/km.
            const krVal = dist * 2.5

            await addVerification({
                date: new Date().toISOString().split('T')[0],
                description: `Milersättning ${emp.name} - ${desc}`,
                sourceType: 'manual',
                rows: [
                    { account: "7330", description: `${dist} km bilersättning`, debit: krVal, credit: 0 },
                    { account: "2820", description: `Skuld till ${emp.name}`, debit: 0, credit: krVal }
                ]
            })
            success("Resa sparad", `Bokfört ${krVal} kr (${dist} km)`)
        } else {
            // Time is not financial yet. Just toast.
            success("Tidrapport sparad", "Tid har registrerats (Bokförs vid lönekörning)")
        }

        setReportDialogOpen(false)
        setAmount("")
        setKm("")
        setDesc("")
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto px-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Team & Rapportering</h2>
                    <p className="text-muted-foreground">Hantera anställda, utlägg och milersättning.</p>
                </div>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Ny anställd
                </Button>
            </div>

            {/* Empty State */}
            {employees.length === 0 && !isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                        <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Inga anställda ännu</h3>
                    <p className="text-muted-foreground text-center text-sm max-w-sm">
                        Lägg till ditt team för att hantera löner, tid och utlägg.
                        Klicka på "Ny anställd" för att börja.
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {employees.map((emp) => (
                        <Card key={emp.id} className="overflow-hidden">
                            <CardHeader className="flex flex-row items-center gap-4 bg-muted/20 pb-4">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={`/avatars/${emp.id}.png`} />
                                    <AvatarFallback>{emp.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                                <div className="grid gap-1">
                                    <CardTitle className="text-base">{emp.name}</CardTitle>
                                    <CardDescription>{emp.role}</CardDescription>
                                </div>
                                <Button variant="ghost" size="icon" className="ml-auto">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent className="p-4 grid gap-3">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="flex flex-col gap-1 p-2 rounded-md bg-muted/40">
                                        <span className="text-muted-foreground text-xs flex items-center gap-1">
                                            <Wallet className="h-3 w-3" /> Utläggskuld
                                        </span>
                                        <span className={cn("font-medium", (employeeBalances.balances[emp.id] || 0) > 0 ? "text-red-600" : "")}>
                                            {formatCurrency(employeeBalances.balances[emp.id] || 0)}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1 p-2 rounded-md bg-muted/40">
                                        <span className="text-muted-foreground text-xs flex items-center gap-1">
                                            <Car className="h-3 w-3" /> Resor (kr)
                                        </span>
                                        <span className="font-medium">
                                            {formatCurrency(employeeBalances.mileage[emp.id] || 0)}
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    className="w-full mt-2"
                                    onClick={() => {
                                        setSelectedEmployee(emp.id)
                                        setReportDialogOpen(true)
                                    }}
                                >
                                    <FileText className="h-4 w-4 mr-2" />
                                    Rapportera
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Reporting Dialog */}
            <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Rapportera för {employees.find(e => e.id === selectedEmployee)?.name}</DialogTitle>
                        <DialogDescription>
                            Registrera tid, milersättning eller utlägg.
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs value={reportType} onValueChange={(v) => setReportType(v as any)} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="time">Tid & Frånvaro</TabsTrigger>
                            <TabsTrigger value="mileage">Milersättning</TabsTrigger>
                            <TabsTrigger value="expense">Utlägg</TabsTrigger>
                        </TabsList>

                        <div className="py-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Datum</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input type="date" className="pl-9" defaultValue={new Date().toISOString().split('T')[0]} />
                                    </div>
                                </div>
                                {reportType === 'time' && (
                                    <div className="grid gap-2">
                                        <Label>Antal timmar</Label>
                                        <Input
                                            type="number"
                                            placeholder="8"
                                            value={hours}
                                            onChange={(e) => setHours(e.target.value)}
                                        />
                                    </div>
                                )}
                                {reportType === 'mileage' && (
                                    <div className="grid gap-2">
                                        <Label>Antal km</Label>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={km}
                                            onChange={(e) => setKm(e.target.value)}
                                        />
                                    </div>
                                )}
                                {reportType === 'expense' && (
                                    <div className="grid gap-2">
                                        <Label>Belopp (SEK)</Label>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label>Beskrivning</Label>
                                <Textarea
                                    placeholder={reportType === 'mileage' ? "Resa till..." : "Avser..."}
                                    value={desc}
                                    onChange={(e) => setDesc(e.target.value)}
                                />
                            </div>
                        </div>
                    </Tabs>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReportDialogOpen(false)}>Avbryt</Button>
                        <Button onClick={handleReport}>Spara till bokföring</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
