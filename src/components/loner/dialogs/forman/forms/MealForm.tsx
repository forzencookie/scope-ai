"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCurrency } from "@/lib/utils"
import { MealFormData, FormProps } from "../types"
import { MEAL_RATES } from "../constants"

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
            <div className="space-y-2">
                <Label>Anställd</Label>
                <Input
                    placeholder="Namn på anställd..."
                    value={form.employeeName}
                    onChange={e => setForm(f => ({ ...f, employeeName: e.target.value }))}
                />
            </div>
            <div className="space-y-2">
                <Label>Månad</Label>
                <Input
                    type="month"
                    value={form.month}
                    onChange={e => setForm(f => ({ ...f, month: e.target.value }))}
                />
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>Antal dagar</Label>
                    <span className="text-xs text-muted-foreground">
                        {benefit.id === 'lunch' ? '130' : '260'} kr/dag
                    </span>
                </div>
                <Input
                    type="number"
                    placeholder="0"
                    value={form.days}
                    onChange={e => setForm(f => ({ ...f, days: e.target.value }))}
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
            <Button className="w-full" onClick={handleSubmit} disabled={!form.employeeName || !form.month || !form.days}>
                Registrera
            </Button>
        </div>
    )
}
