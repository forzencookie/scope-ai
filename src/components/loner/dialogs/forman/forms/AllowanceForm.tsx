"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCurrency } from "@/lib/utils"
import { AllowanceFormData, FormProps } from "../types"

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
            <div className="space-y-2">
                <Label>Anställd</Label>
                <Input
                    placeholder="Namn på anställd..."
                    value={form.employeeName}
                    onChange={e => setForm(f => ({ ...f, employeeName: e.target.value }))}
                />
            </div>
            <div className="space-y-2">
                <Label>Datum</Label>
                <Input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                />
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>Belopp</Label>
                    {benefit.maxAmount && (
                        <span className="text-xs text-muted-foreground">
                            Max {formatCurrency(benefit.maxAmount)}/år
                        </span>
                    )}
                </div>
                <div className="relative">
                    <Input
                        type="number"
                        placeholder="0"
                        value={form.amount}
                        onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                        className="pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr</span>
                </div>
            </div>
            <Button className="w-full" onClick={handleSubmit} disabled={!form.employeeName || !form.amount}>
                Registrera
            </Button>
        </div>
    )
}
