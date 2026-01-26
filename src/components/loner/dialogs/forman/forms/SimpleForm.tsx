"use client"

import { useState } from "react"
import { FormProps, SimpleFormData } from "../types"
import { EmployeeInput, PeriodInput, CurrencyInput, SubmitButton } from "./shared"

export function SimpleForm({ benefit, onAssign }: FormProps) {
    const [form, setForm] = useState<SimpleFormData>({
        employeeName: '', month: '', value: ''
    })

    const handleSubmit = () => {
        if (!form.employeeName || !form.value) return
        onAssign(form.employeeName, parseFloat(form.value), {
            month: form.month
        })
        setForm({ employeeName: '', month: '', value: '' })
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
            <CurrencyInput
                label={benefit.taxFree ? 'Värde' : 'Förmånsvärde'}
                value={form.value}
                onChange={(v) => setForm(f => ({ ...f, value: v }))}
            />
            <SubmitButton
                label="Registrera"
                onClick={handleSubmit}
                disabled={!form.employeeName || !form.value}
            />
        </div>
    )
}
