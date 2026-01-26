"use client"

import { useState } from "react"
import { formatCurrency } from "@/lib/utils"
import { MealFormData, FormProps } from "../types"
import { MEAL_RATES } from "../constants"
import { EmployeeInput, PeriodInput, TextInputField, SubmitButton } from "./shared"
import { Label } from "@/components/ui/label"

export function MealForm({ benefit, onAssign }: FormProps) {
    const [form, setForm] = useState<MealFormData>({
        employeeName: '', month: '', days: ''
    })

    const handleSubmit = () => {
        if (!form.employeeName || !form.month || !form.days) return
        const days = parseInt(form.days)
        const rate = benefit.id === 'lunch' ? MEAL_RATES.lunch : MEAL_RATES.kost
        const formansvarde = days * rate

        onAssign(form.employeeName, formansvarde, {
            month: form.month,
            days,
            dailyRate: rate
        })
        setForm({ employeeName: '', month: '', days: '' })
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
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>Antal dagar</Label>
                    <span className="text-xs text-muted-foreground">
                        {benefit.id === 'lunch' ? '130' : '260'} kr/dag
                    </span>
                </div>
                <TextInputField
                    label=""
                    type="number"
                    placeholder="0"
                    value={form.days}
                    onChange={(v) => setForm(f => ({ ...f, days: v }))}
                />
            </div>
            {form.days && (
                <div className="bg-muted/30 p-3 rounded-md text-sm">
                    <span className="text-muted-foreground">Förmånsvärde: </span>
                    <span className="font-medium">
                        {formatCurrency(parseInt(form.days) * (benefit.id === 'lunch' ? 130 : 260))}
                    </span>
                </div>
            )}
            <SubmitButton
                label="Registrera"
                onClick={handleSubmit}
                disabled={!form.employeeName || !form.month || !form.days}
            />
        </div>
    )
}
