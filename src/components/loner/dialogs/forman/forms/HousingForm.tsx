"use client"

import { useState } from "react"
import { formatCurrency } from "@/lib/utils"
import { FormProps, HousingFormData } from "../types"
import { EmployeeInput, DateInput, TextInputField, CurrencyInput, SubmitButton } from "./shared"

export function HousingForm({ onAssign }: FormProps) {
    const [form, setForm] = useState<HousingFormData>({
        employeeName: '',
        startDate: new Date().toISOString().split('T')[0],
        address: '',
        area: '',
        marketRent: ''
    })

    const handleSubmit = () => {
        if (!form.employeeName || !form.address || !form.area || !form.marketRent) return
        const marketRent = parseFloat(form.marketRent)

        onAssign(form.employeeName, marketRent, {
            type: 'housing',
            startDate: form.startDate,
            address: form.address,
            area: parseFloat(form.area),
            monthlyFormansvarde: marketRent
        })
        setForm({ employeeName: '', startDate: new Date().toISOString().split('T')[0], address: '', area: '', marketRent: '' })
    }

    return (
        <div className="space-y-4">
            <EmployeeInput
                value={form.employeeName}
                onChange={(v) => setForm(f => ({ ...f, employeeName: v }))}
            />
            <DateInput
                label="Startdatum"
                value={form.startDate}
                onChange={(v) => setForm(f => ({ ...f, startDate: v }))}
            />
            <TextInputField
                label="Adress"
                value={form.address}
                onChange={(v) => setForm(f => ({ ...f, address: v }))}
                placeholder="Gatuadress..."
            />
            <TextInputField
                label="Yta"
                type="number"
                value={form.area}
                onChange={(v) => setForm(f => ({ ...f, area: v }))}
                placeholder="0"
                suffix="kvm"
            />
            <CurrencyInput
                label="Marknadshyra (månad)"
                value={form.marketRent}
                onChange={(v) => setForm(f => ({ ...f, marketRent: v }))}
            />
            {form.marketRent && (
                <div className="bg-muted/30 p-3 rounded-md text-sm">
                    <span className="text-muted-foreground">Förmånsvärde: </span>
                    <span className="font-medium">{formatCurrency(parseFloat(form.marketRent))}/mån</span>
                </div>
            )}
            <SubmitButton
                label="Registrera"
                onClick={handleSubmit}
                disabled={!form.employeeName || !form.address || !form.area || !form.marketRent}
            />
        </div>
    )
}
