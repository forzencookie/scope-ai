// @ts-nocheck
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { StatusBadge } from "@/components/ui/status-badge"
import { FormanCatalogItem, EmployeeBenefit } from "@/lib/ai/tool-types"
import { getFormType, getBenefitIcon } from "./forman/constants" // Assuming relative path
import { EmployeeList } from "./forman/EmployeeList"
import { AllowanceForm } from "./forman/forms/AllowanceForm"
import { VehicleForm } from "./forman/forms/VehicleForm"
import { MealForm } from "./forman/forms/MealForm"
import { SimpleForm } from "./forman/forms/SimpleForm"
import { HousingForm } from "./forman/forms/HousingForm"
import { FuelForm } from "./forman/forms/FuelForm"
import { ParkingForm } from "./forman/forms/ParkingForm"
import { Button } from "@/components/ui/button"

interface BenefitDetailsDialogProps {
    benefit: FormanCatalogItem | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onAssign?: (employeeName: string, amount: number, metadata?: Record<string, unknown>) => void
    assignedEmployees?: EmployeeBenefit[]
}

export function BenefitDetailsDialog({
    benefit,
    open,
    onOpenChange,
    onAssign,
    assignedEmployees = []
}: BenefitDetailsDialogProps) {
    if (!benefit) return null

    const Icon = getBenefitIcon(benefit.id)
    const formType = getFormType(benefit.id)

    const handleAssign = (employeeName: string, amount: number, metadata?: Record<string, unknown>) => {
        onAssign?.(employeeName, amount, metadata)
    }

    const renderForm = () => {
        const props = { benefit, onAssign: handleAssign }

        switch (formType) {
            case 'allowance': return <AllowanceForm {...props} />
            case 'vehicle': return <VehicleForm {...props} />
            case 'meal': return <MealForm {...props} />
            case 'housing': return <HousingForm {...props} />
            case 'fuel': return <FuelForm {...props} />
            case 'parking': return <ParkingForm {...props} />
            default: return <SimpleForm {...props} />
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <DialogTitle className="text-xl">{benefit.title}</DialogTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <StatusBadge status={benefit.taxFree ? 'success' : 'warning'}>
                                    {benefit.taxFree ? 'Skattefri' : 'Skattepliktig'}
                                </StatusBadge>
                                <span>{benefit.category}</span>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    {/* Left Column: Info & Form */}
                    <div className="space-y-6">
                        <div className="text-sm text-muted-foreground">
                            {benefit.description}
                        </div>

                        <div className="bg-card border rounded-lg p-4 shadow-sm">
                            <h3 className="font-semibold mb-3">Registrera ny</h3>
                            {renderForm()}
                        </div>
                    </div>

                    {/* Right Column: Assigned Employees */}
                    <div className="space-y-4">
                        <EmployeeList
                            benefit={benefit}
                            assignedEmployees={assignedEmployees}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Stäng</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
