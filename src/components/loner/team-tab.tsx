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

export function TeamTab() {
    const { success } = useToast()
    const [employees, setEmployees] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [reportDialogOpen, setReportDialogOpen] = useState(false)
    const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
    const [reportType, setReportType] = useState<'time' | 'expense' | 'mileage'>('time')

    // Fetch real employees
    useMemo(() => {
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

    // Mock reporting
    const handleReport = () => {
        success("Rapport sparad", "Tid och utlägg har registrerats för lönekörningen.")
        setReportDialogOpen(false)
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto px-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Team & Rapportering</h2>
                    <p className="text-muted-foreground">Hantera anställda och rapportera tid inför lön.</p>
                </div>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Ny anställd
                </Button>
            </div>

            {/* Empty State */}
            {employees.length === 0 ? (
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
                                            <Clock className="h-3 w-3" /> Tidssaldo
                                        </span>
                                        <span className="font-medium">0 tim</span>
                                    </div>
                                    <div className="flex flex-col gap-1 p-2 rounded-md bg-muted/40">
                                        <span className="text-muted-foreground text-xs flex items-center gap-1">
                                            <Car className="h-3 w-3" /> Resor (km)
                                        </span>
                                        <span className="font-medium">0 km</span>
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
                            Registrera tid, frånvaro eller utlägg.
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
                                        <Input type="number" placeholder="8" />
                                    </div>
                                )}
                                {reportType === 'mileage' && (
                                    <div className="grid gap-2">
                                        <Label>Antal km</Label>
                                        <Input type="number" placeholder="0" />
                                    </div>
                                )}
                                {reportType === 'expense' && (
                                    <div className="grid gap-2">
                                        <Label>Belopp (SEK)</Label>
                                        <Input type="number" placeholder="0" />
                                    </div>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label>Beskrivning</Label>
                                <Textarea placeholder={
                                    reportType === 'time' ? "T.ex. VAB, Sjukdom eller Övertid" :
                                        reportType === 'mileage' ? "T.ex. Kundbesök Göteborg" :
                                            "Vad avser utlägget?"
                                } />
                            </div>
                        </div>
                    </Tabs>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReportDialogOpen(false)}>Avbryt</Button>
                        <Button onClick={handleReport}>Spara rapport</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
