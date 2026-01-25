"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { User } from "lucide-react"
import { cn } from "@/lib/utils"

interface StepEmployeeSelectProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    employees: any[]
    selectedEmployee: string | null
    setSelectedEmployee: (id: string) => void
    onNext: () => void
    onCancel: () => void
    isLoading: boolean
}

export function StepEmployeeSelect({
    employees,
    selectedEmployee,
    setSelectedEmployee,
    onNext,
    onCancel,
    isLoading
}: StepEmployeeSelectProps) {
    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Laddar anställda...</div>
    }

    return (
        <div className="space-y-4">
            <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                    {employees.map((emp) => (
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
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{emp.name}</p>
                                    <p className="text-sm text-muted-foreground truncate">{emp.role}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Lön</p>
                                    <p className="font-medium whitespace-nowrap">{emp.lastSalary.toLocaleString("sv-SE")} kr</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </ScrollArea>
            <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={onCancel}>
                    Avbryt
                </Button>
                <Button
                    className="flex-1"
                    disabled={!selectedEmployee}
                    onClick={onNext}
                >
                    Nästa
                </Button>
            </div>
        </div>
    )
}
