"use client"

import { Button } from "@/components/ui/button"
import { Users, Plus } from "lucide-react"
import { PageHeader } from "@/components/shared"
import { useTeamLogic } from "./use-team-logic"
import { EmployeeCard } from "./employee-card"
import { AddEmployeeDialog, ReportDialog } from "./dialogs"

export default function TeamTab() {
    const {
        employees,
        isLoading,
        employeeBalances,
        
        // New Employee State
        newEmployeeDialogOpen,
        setNewEmployeeDialogOpen,
        newEmployee,
        setNewEmployee,
        handleAddEmployee,
        isSaving,
        
        // Report State
        reportDialogOpen,
        setReportDialogOpen,
        selectedEmployee,
        setSelectedEmployee,
        reportType,
        setReportType,
        amount, setAmount,
        km, setKm,
        desc, setDesc,
        hours, setHours,
        handleReport
    } = useTeamLogic()

    const selectedEmployeeObj = employees.find(e => e.id === selectedEmployee)

    return (
        <div className="space-y-4 md:space-y-6">
            <PageHeader
                title="Team & Rapportering"
                subtitle="Hantera anställda, utlägg och milersättning."
                actions={
                    <div className="hidden md:block">
                        <Button onClick={() => setNewEmployeeDialogOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Ny anställd
                        </Button>
                    </div>
                }
            />

            {/* Mobile-only action button */}
            <div className="md:hidden w-full">
                <Button className="w-full" size="lg" onClick={() => setNewEmployeeDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
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
                        Klicka på &quot;Ny anställd&quot; för att börja.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {employees.map((emp) => (
                        <EmployeeCard
                            key={emp.id}
                            employee={emp}
                            balance={employeeBalances.balances[emp.id] || 0}
                            mileage={employeeBalances.mileage[emp.id] || 0}
                            onReport={() => {
                                setSelectedEmployee(emp.id)
                                setReportDialogOpen(true)
                            }}
                        />
                    ))}
                </div>
            )}

            <AddEmployeeDialog
                open={newEmployeeDialogOpen}
                onOpenChange={setNewEmployeeDialogOpen}
                newEmployee={newEmployee}
                onChange={(field, value) => setNewEmployee(prev => ({ ...prev, [field]: value }))}
                onSave={handleAddEmployee}
                isSaving={isSaving}
            />

            <ReportDialog
                open={reportDialogOpen}
                onOpenChange={setReportDialogOpen}
                employeeName={selectedEmployeeObj?.name}
                reportType={reportType}
                onReportTypeChange={setReportType}
                amount={amount} setAmount={setAmount}
                km={km} setKm={setKm}
                desc={desc} setDesc={setDesc}
                hours={hours} setHours={setHours}
                onSubmit={handleReport}
            />
        </div>
    )
}
