"use client"

import { useState } from "react"
import { Plus, Car, MapPin, MoreHorizontal, FileText, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCurrency } from "@/lib/utils"
import { employees } from "./constants"

interface MileageEntry {
    id: string
    date: string
    employeeId: string
    employeeName: string
    vehicleReg: string
    origin: string
    destination: string
    distanceKm: number
    purpose: string
    reimbursement: number
}

// Current tax free allowance 2024: 25 kr/mil (2.5 kr/km) for own car
const REIMBURSEMENT_RATE_PER_KM = 2.5

// Mock data
const initialEntries: MileageEntry[] = [
    {
        id: "1",
        date: "2024-12-10",
        employeeId: "anna",
        employeeName: "Anna Andersson",
        vehicleReg: "ABC 123",
        origin: "Kontoret",
        destination: "Kundbesök Ericsson",
        distanceKm: 12,
        purpose: "Projektmöte",
        reimbursement: 30
    },
    {
        id: "2",
        date: "2024-12-12",
        employeeId: "anna",
        employeeName: "Anna Andersson",
        vehicleReg: "ABC 123",
        origin: "Kundbesök Ericsson",
        destination: "Kontoret",
        distanceKm: 12,
        purpose: "Hemresa möte",
        reimbursement: 30
    }
]

export function MileageLog() {
    const [entries, setEntries] = useState<MileageEntry[]>(initialEntries)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [newEntry, setNewEntry] = useState<Partial<MileageEntry>>({
        date: new Date().toISOString().split('T')[0],
        employeeId: employees[0]?.id
    })

    const handleAddEntry = () => {
        if (!newEntry.distanceKm || !newEntry.destination || !newEntry.employeeId) return

        const employee = employees.find(e => e.id === newEntry.employeeId)

        const entry: MileageEntry = {
            id: Math.random().toString(36).substr(2, 9),
            date: newEntry.date || new Date().toISOString().split('T')[0],
            employeeId: newEntry.employeeId,
            employeeName: employee?.name || "Okänd",
            vehicleReg: newEntry.vehicleReg || "Egen bil",
            origin: newEntry.origin || "Kontoret",
            destination: newEntry.destination,
            distanceKm: Number(newEntry.distanceKm),
            purpose: newEntry.purpose || "Tjänsteärende",
            reimbursement: Number(newEntry.distanceKm) * REIMBURSEMENT_RATE_PER_KM
        }

        setEntries([entry, ...entries])
        setIsDialogOpen(false)
        setNewEntry({
            date: new Date().toISOString().split('T')[0],
            employeeId: employees[0]?.id
        })
    }

    const totalDistance = entries.reduce((sum, e) => sum + e.distanceKm, 0)
    const totalReimbursement = entries.reduce((sum, e) => sum + e.reimbursement, 0)

    return (
        <div className="space-y-6 px-6 pb-6 max-w-6xl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Körjournal & Resor</h2>
                    <p className="text-muted-foreground">
                        Logga tjänsteresor för skattefri milersättning (25 kr/mil).
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Exportera
                    </Button>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Ny resa
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Registrera företagsresa</DialogTitle>
                                <DialogDescription>
                                    Ange detaljer för resan för att beräkna ersättning.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="employee" className="text-right">
                                        Anställd
                                    </Label>
                                    <Select
                                        value={newEntry.employeeId}
                                        onValueChange={(val) => setNewEntry({ ...newEntry, employeeId: val })}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Välj anställd" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {employees.map(e => (
                                                <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="date" className="text-right">
                                        Datum
                                    </Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        value={newEntry.date}
                                        onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="from" className="text-right">
                                        Från
                                    </Label>
                                    <Input
                                        id="from"
                                        placeholder="t.ex. Kontoret"
                                        value={newEntry.origin || ""}
                                        onChange={(e) => setNewEntry({ ...newEntry, origin: e.target.value })}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="to" className="text-right">
                                        Till
                                    </Label>
                                    <Input
                                        id="to"
                                        placeholder="Destination"
                                        value={newEntry.destination || ""}
                                        onChange={(e) => setNewEntry({ ...newEntry, destination: e.target.value })}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="dist" className="text-right">
                                        Sträcka (km)
                                    </Label>
                                    <Input
                                        id="dist"
                                        type="number"
                                        value={newEntry.distanceKm || ""}
                                        onChange={(e) => setNewEntry({ ...newEntry, distanceKm: Number(e.target.value) })}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="purpose" className="text-right">
                                        Syfte
                                    </Label>
                                    <Input
                                        id="purpose"
                                        placeholder="Möte, leverans..."
                                        value={newEntry.purpose || ""}
                                        onChange={(e) => setNewEntry({ ...newEntry, purpose: e.target.value })}
                                        className="col-span-3"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Avbryt</Button>
                                <Button onClick={handleAddEntry}>Spara resa</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="tracking-tight text-sm font-medium">Totalt Milersättning</div>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">{formatCurrency(totalReimbursement)}</div>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="tracking-tight text-sm font-medium">Total Sträcka</div>
                        <Car className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">{totalDistance} km</div>
                    <p className="text-xs text-muted-foreground">Ca {Math.round(totalDistance / 10)} mil</p>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Datum</TableHead>
                            <TableHead>Förare</TableHead>
                            <TableHead>Rutt</TableHead>
                            <TableHead>Syfte</TableHead>
                            <TableHead className="text-right">Sträcka</TableHead>
                            <TableHead className="text-right">Ersättning</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {entries.map((entry) => (
                            <TableRow key={entry.id}>
                                <TableCell className="font-medium">{entry.date}</TableCell>
                                <TableCell>{entry.employeeName}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col text-sm">
                                        <span className="flex items-center gap-1 text-muted-foreground text-xs"><MapPin className="h-3 w-3" /> {entry.origin}</span>
                                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {entry.destination}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{entry.purpose}</TableCell>
                                <TableCell className="text-right">{entry.distanceKm} km</TableCell>
                                <TableCell className="text-right">{formatCurrency(entry.reimbursement)}</TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Öppna meny</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Åtgärder</DropdownMenuLabel>
                                            <DropdownMenuItem>Redigera</DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-red-600">Ta bort</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
