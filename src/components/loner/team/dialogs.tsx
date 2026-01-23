"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Clock, Car, FileText } from "lucide-react"

interface AddEmployeeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    newEmployee: { name: string, role: string, email: string, salary: string }
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
                    <div className="space-y-2">
                        <Label>Månadslön (brutto)</Label>
                        <Input
                            value={newEmployee.salary}
                            onChange={e => onChange('salary', e.target.value)}
                            placeholder="t.ex. 35000"
                            type="number"
                        />
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
                
                <Tabs value={reportType} onValueChange={(v) => onReportTypeChange(v as any)} className="w-full">
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
