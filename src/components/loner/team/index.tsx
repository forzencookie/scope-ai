"use client"

import { Users } from "lucide-react"
import { PageHeader } from "@/components/shared"
import { useTeamLogic } from "./use-team-logic"
import { EmployeeCard } from "./employee-card"
import { EmployeeDossierDialog } from "./dialogs"

export default function TeamTab() {
    const {
        employees,
        isLoading,
        employeeBalances,

        // Dossier
        dossierOpen, setDossierOpen,
        dossierEmployeeId,
        handleOpenDossier,
        payslipsCache,
        dossierExpenses,
        dossierBenefits,
    } = useTeamLogic()

    const dossierEmployee = employees.find(e => e.id === dossierEmployeeId) || null

    return (
        <div className="space-y-4 md:space-y-6">
            <PageHeader
                title="Team & Rapportering"
                subtitle="Hantera anställda, utlägg och milersättning."
            />

            {/* Empty State */}
            {employees.length === 0 && !isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                        <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Inga anställda ännu</h3>
                    <p className="text-muted-foreground text-center text-sm max-w-sm">
                        Be Scooby lägga till anställda i chatten för att hantera löner, tid och utlägg.
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
                            onViewDossier={() => handleOpenDossier(emp.id)}
                        />
                    ))}
                </div>
            )}

            <EmployeeDossierDialog
                open={dossierOpen}
                onOpenChange={setDossierOpen}
                employee={dossierEmployee}
                salaryHistory={payslipsCache}
                expenses={dossierExpenses}
                benefits={dossierBenefits}
                balance={dossierEmployee ? (employeeBalances.balances[dossierEmployee.id] || 0) : 0}
                mileage={dossierEmployee ? (employeeBalances.mileage[dossierEmployee.id] || 0) : 0}
            />
        </div>
    )
}
