"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { formatCurrency } from "@/lib/utils"
import { AllowanceFormData, FormProps } from "../types"
import { EmployeeInput, DateInput, CurrencyInput, SubmitButton } from "./shared"

export function AllowanceForm({ benefit, onAssign }: FormProps) {
    const [form, setForm] = useState<AllowanceFormData>({
        employeeName: '',
        amount: '',
        date: new Date().toISOString().split('T')[0]
    })

    const handleSubmit = () => {
        if (!form.employeeName || !form.amount) return
        onAssign(form.employeeName, parseFloat(form.amount), {
            date: form.date
        })
        setForm({ employeeName: '', amount: '', date: new Date().toISOString().split('T')[0] })
    }

    return (
        <div className="space-y-4">
            <EmployeeInput
                value={form.employeeName}
                onChange={(v) => setForm(f => ({ ...f, employeeName: v }))}
            />
            <DateInput
                label="Datum"
                value={form.date}
                onChange={(v) => setForm(f => ({ ...f, date: v }))}
            />
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>Belopp</Label>
                    {benefit.maxAmount && (
                        <span className="text-xs text-muted-foreground">
                            Max {formatCurrency(benefit.maxAmount)}/år
                        </span>
                    )}
                </div>
                <CurrencyInput
                    label=""
                    value={form.amount}
                    onChange={(v) => setForm(f => ({ ...f, amount: v }))}
                />
            </div>
            <SubmitButton
                label="Registrera"
                onClick={handleSubmit}
                disabled={!form.employeeName || !form.amount}
            />
        </div>
    )
}
