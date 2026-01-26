"use client"

import { useState } from "react"
import { formatCurrency } from "@/lib/utils"
import { FormProps, FuelFormData } from "../types"
import { EmployeeInput, PeriodInput, TextInputField, CurrencyInput, SubmitButton } from "./shared"

export function FuelForm({ onAssign }: FormProps) {
    const [form, setForm] = useState<FuelFormData>({
        employeeName: '', month: '', liters: '', pricePerLiter: ''
    })

    const handleSubmit = () => {
        if (!form.employeeName || !form.month || !form.liters || !form.pricePerLiter) return
        const liters = parseFloat(form.liters)
        const pricePerLiter = parseFloat(form.pricePerLiter)
        const formansvarde = liters * pricePerLiter * 1.2 // 120% of market price

        onAssign(form.employeeName, formansvarde, {
            type: 'fuel',
            month: form.month,
            liters,
            pricePerLiter,
            formansvarde
        })
        setForm({ employeeName: '', month: '', liters: '', pricePerLiter: '' })
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
            <div className="grid grid-cols-2 gap-3">
                <TextInputField
                    label="Antal liter"
                    type="number"
                    placeholder="0"
                    value={form.liters}
                    onChange={(v) => setForm(f => ({ ...f, liters: v }))}
                />
                <CurrencyInput
                    label="Pris/liter"
                    value={form.pricePerLiter}
                    onChange={(v) => setForm(f => ({ ...f, pricePerLiter: v }))}
                />
            </div>
            {form.liters && form.pricePerLiter && (
                <div className="bg-muted/30 p-3 rounded-md text-sm">
                    <span className="text-muted-foreground">Förmånsvärde (120%): </span>
                    <span className="font-medium">{formatCurrency(parseFloat(form.liters) * parseFloat(form.pricePerLiter) * 1.2)}</span>
                </div>
            )}
            <SubmitButton
                label="Registrera"
                onClick={handleSubmit}
                disabled={!form.employeeName || !form.month || !form.liters || !form.pricePerLiter}
            />
        </div>
    )
}
