"use client"

import { useState } from "react"
import { formatCurrency } from "@/lib/utils"
import { FormProps, ParkingFormData } from "../types"
import { EmployeeInput, PeriodInput, TextInputField, CurrencyInput, SubmitButton } from "./shared"

export function ParkingForm({ onAssign }: FormProps) {
    const [form, setForm] = useState<ParkingFormData>({
        employeeName: '', month: '', location: '', marketValue: ''
    })

    const handleSubmit = () => {
        if (!form.employeeName || !form.month || !form.marketValue) return
        const marketValue = parseFloat(form.marketValue)

        onAssign(form.employeeName, marketValue, {
            type: 'parking',
            month: form.month,
            location: form.location,
            monthlyFormansvarde: marketValue
        })
        setForm({ employeeName: '', month: '', location: '', marketValue: '' })
    }

    return (
        <div className="space-y-4">
            <EmployeeInput
                value={form.employeeName}
                onChange={(v) => setForm(f => ({ ...f, employeeName: v }))}
            />
            <PeriodInput
                value={form.month}
                onChange={(v) => setForm(f => ({ ...f, month: v }))}
            />
            <TextInputField
                label="Plats"
                value={form.location}
                onChange={(v) => setForm(f => ({ ...f, location: v }))}
                placeholder="t.ex. P-hus City..."
            />
            <CurrencyInput
                label="Marknadsvärde (månad)"
                value={form.marketValue}
                onChange={(v) => setForm(f => ({ ...f, marketValue: v }))}
            />
            {form.marketValue && (
                <div className="bg-muted/30 p-3 rounded-md text-sm">
                    <span className="text-muted-foreground">Förmånsvärde: </span>
                    <span className="font-medium">{formatCurrency(parseFloat(form.marketValue))}/mån</span>
                </div>
            )}
            <SubmitButton
                label="Registrera"
                onClick={handleSubmit}
                disabled={!form.employeeName || !form.month || !form.marketValue}
            />
        </div>
    )
}
