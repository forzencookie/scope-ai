"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Search, UserPlus, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { type PayslipEmployee, type ManualPersonData } from "./use-create-payslip-logic"

interface StepEmployeeSelectProps {
    employees: PayslipEmployee[]
    filteredEmployees: PayslipEmployee[]
    selectedEmployee: string | null
    setSelectedEmployee: (id: string) => void
    useManualEntry: boolean
    setUseManualEntry: (value: boolean) => void
    manualPerson: ManualPersonData
    setManualPerson: (data: ManualPersonData) => void
    saveAsEmployee: boolean
    setSaveAsEmployee: (value: boolean) => void
    searchQuery: string
    setSearchQuery: (query: string) => void
    canProceed: boolean
    onNext: () => void
    onCancel: () => void
    isLoading: boolean
    defaultTaxPercent?: string
}

export function StepEmployeeSelect({
    employees,
    filteredEmployees,
    selectedEmployee,
    setSelectedEmployee,
    useManualEntry,
    setUseManualEntry,
    manualPerson,
    setManualPerson,
    saveAsEmployee,
    setSaveAsEmployee,
    searchQuery,
    setSearchQuery,
    canProceed,
    onNext,
    onCancel,
    isLoading,
    defaultTaxPercent = "32"
}: StepEmployeeSelectProps) {
    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Laddar anställda...</div>
    }

    const hasEmployees = employees.length > 0

    // Auto-select "Ny person" tab if no employees exist
    const defaultTab = hasEmployees ? "existing" : "new"

    const handleTabChange = (value: string) => {
        if (value === "new") {
            setUseManualEntry(true)
            setSelectedEmployee("")
        } else {
            setUseManualEntry(false)
            setManualPerson({ name: "", role: "", salary: 0, personalNumber: "", employmentType: "tillsvidare", taxRate: defaultTaxPercent, kommun: "", pensionRate: "4.5", fackavgift: "0", akassa: "0" })
        }
    }

    return (
        <div className="space-y-4">
            <Tabs defaultValue={defaultTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="existing" className="gap-2">
                        <Users className="h-4 w-4" />
                        Befintlig anställd
                    </TabsTrigger>
                    <TabsTrigger value="new" className="gap-2">
                        <UserPlus className="h-4 w-4" />
                        Ny person
                    </TabsTrigger>
                </TabsList>

                {/* Existing Employee Tab */}
                <TabsContent value="existing" className="space-y-3 mt-4">
                    {hasEmployees ? (
                        <>
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Sök anställd..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>

                            {/* Employee List */}
                            <ScrollArea className="h-[220px] pr-2">
                                <div className="space-y-2">
                                    {filteredEmployees.length > 0 ? (
                                        filteredEmployees.map((emp) => (
                                            <button
                                                key={emp.id}
                                                onClick={() => setSelectedEmployee(emp.id)}
                                                className={cn(
                                                    "w-full p-3 rounded-lg border-2 text-left transition-colors",
                                                    selectedEmployee === emp.id
                                                        ? "border-primary bg-primary/5"
                                                        : "border-border hover:border-primary/50"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                        <User className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium truncate">{emp.name}</p>
                                                        <p className="text-sm text-muted-foreground truncate">{emp.role}</p>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className="text-sm text-muted-foreground">Lön</p>
                                                        <p className="font-medium whitespace-nowrap">{emp.lastSalary.toLocaleString("sv-SE")} kr</p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <p>Inga resultat för "{searchQuery}"</p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </>
                    ) : (
                        <div className="text-center py-8 space-y-3">
                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                                <Users className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="font-medium">Inga anställda ännu</p>
                                <p className="text-sm text-muted-foreground">
                                    Lägg till en person i fliken "Ny person"
                                </p>
                            </div>
                        </div>
                    )}
                </TabsContent>

                {/* New Person Tab */}
                <TabsContent value="new" className="space-y-4 mt-4">
                    <ScrollArea className="h-[320px] pr-2">
                    <div className="space-y-4 px-1">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="name">Namn *</Label>
                                <Input
                                    id="name"
                                    placeholder="Anna Andersson"
                                    value={manualPerson.name}
                                    onChange={(e) => setManualPerson({ ...manualPerson, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="personnr">Personnummer</Label>
                                <Input
                                    id="personnr"
                                    placeholder="ÅÅÅÅMMDD-XXXX"
                                    value={manualPerson.personalNumber}
                                    onChange={(e) => setManualPerson({ ...manualPerson, personalNumber: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="role">Roll</Label>
                                <Input
                                    id="role"
                                    placeholder="T.ex. Utvecklare"
                                    value={manualPerson.role}
                                    onChange={(e) => setManualPerson({ ...manualPerson, role: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="empType">Anställningsform</Label>
                                <select
                                    id="empType"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={manualPerson.employmentType}
                                    onChange={(e) => setManualPerson({ ...manualPerson, employmentType: e.target.value })}
                                >
                                    <option value="tillsvidare">Tillsvidare</option>
                                    <option value="visstid">Visstid</option>
                                    <option value="provanstallning">Provanställning</option>
                                    <option value="timanstallning">Timanställning</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="salary">Månadslön (brutto) *</Label>
                                <div className="relative">
                                    <Input
                                        id="salary"
                                        type="number"
                                        placeholder="35000"
                                        value={manualPerson.salary || ""}
                                        onChange={(e) => setManualPerson({ ...manualPerson, salary: parseInt(e.target.value) || 0 })}
                                        className="pr-10"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="kommun">Kommun</Label>
                                <Input
                                    id="kommun"
                                    type="text"
                                    placeholder="t.ex. Stockholm"
                                    value={manualPerson.kommun}
                                    onChange={(e) => setManualPerson({ ...manualPerson, kommun: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">Folkbokföringskommun. Avgör kommunalskatt.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="taxRate">Skattesats (%)</Label>
                                <div className="relative">
                                    <Input
                                        id="taxRate"
                                        type="number"
                                        placeholder={defaultTaxPercent}
                                        value={manualPerson.taxRate}
                                        onChange={(e) => setManualPerson({ ...manualPerson, taxRate: e.target.value })}
                                        className="pr-8"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Från skattsedeln. Fråga Scooby om du inte vet.</p>
                            </div>
                        </div>

                        {/* Pension */}
                        <div className="space-y-2">
                            <Label htmlFor="pensionRate">Tjänstepension (%)</Label>
                            <div className="relative">
                                <Input
                                    id="pensionRate"
                                    type="number"
                                    placeholder="4.5"
                                    value={manualPerson.pensionRate}
                                    onChange={(e) => setManualPerson({ ...manualPerson, pensionRate: e.target.value })}
                                    className="pr-8"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Standard ITP1: 4,5%. Lämna tomt för standard.</p>
                        </div>

                        {/* Optional deductions */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="fackavgift">Fackavgift (kr/mån)</Label>
                                <div className="relative">
                                    <Input
                                        id="fackavgift"
                                        type="number"
                                        placeholder="0"
                                        value={manualPerson.fackavgift === "0" ? "" : manualPerson.fackavgift}
                                        onChange={(e) => setManualPerson({ ...manualPerson, fackavgift: e.target.value || "0" })}
                                        className="pr-10"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="akassa">A-kassa (kr/mån)</Label>
                                <div className="relative">
                                    <Input
                                        id="akassa"
                                        type="number"
                                        placeholder="0"
                                        value={manualPerson.akassa === "0" ? "" : manualPerson.akassa}
                                        onChange={(e) => setManualPerson({ ...manualPerson, akassa: e.target.value || "0" })}
                                        className="pr-10"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-2 p-3 rounded-lg bg-muted/50">
                            <Checkbox
                                id="saveAsEmployee"
                                checked={saveAsEmployee}
                                onCheckedChange={(checked) => setSaveAsEmployee(checked === true)}
                            />
                            <Label
                                htmlFor="saveAsEmployee"
                                className="text-sm font-normal cursor-pointer"
                            >
                                Spara som anställd för framtida lönekörningar
                            </Label>
                        </div>
                    </div>
                    </ScrollArea>
                </TabsContent>
            </Tabs>

            {/* Footer Buttons */}
            <div className="flex gap-3 pt-4 border-t">
                <Button variant="outline" className="flex-1" onClick={onCancel}>
                    Avbryt
                </Button>
                <Button
                    className="flex-1"
                    disabled={!canProceed}
                    onClick={onNext}
                >
                    Nästa
                </Button>
            </div>
        </div>
    )
}
