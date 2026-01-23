"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCurrency } from "@/lib/utils"
import { FormProps, ParkingFormData } from "../types"

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
                <Label>Plats</Label>
                <Input
                    placeholder="t.ex. P-hus City..."
                    value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                />
            </div>
            <div className="space-y-2">
                <Label>Marknadsvärde (månad)</Label>
                <div className="relative">
                    <Input
                        type="number"
                        placeholder="0"
                        value={form.marketValue}
                        onChange={e => setForm(f => ({ ...f, marketValue: e.target.value }))}
                        className="pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr</span>
                </div>
            </div>
            {form.marketValue && (
                <div className="bg-muted/30 p-3 rounded-md text-sm">
                    <span className="text-muted-foreground">Förmånsvärde: </span>
                    <span className="font-medium">{formatCurrency(parseFloat(form.marketValue))}/mån</span>
                </div>
            )}
            <Button className="w-full" onClick={handleSubmit} disabled={!form.employeeName || !form.month || !form.marketValue}>
                Registrera
            </Button>
        </div>
    )
}
