"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCurrency } from "@/lib/utils"
import { FormProps, FuelFormData } from "../types"

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
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <Label>Antal liter</Label>
                    <Input
                        type="number"
                        placeholder="0"
                        value={form.liters}
                        onChange={e => setForm(f => ({ ...f, liters: e.target.value }))}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Pris/liter</Label>
                    <div className="relative">
                        <Input
                            type="number"
                            placeholder="0"
                            value={form.pricePerLiter}
                            onChange={e => setForm(f => ({ ...f, pricePerLiter: e.target.value }))}
                            className="pr-10"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr</span>
                    </div>
                </div>
            </div>
            {form.liters && form.pricePerLiter && (
                <div className="bg-muted/30 p-3 rounded-md text-sm">
                    <span className="text-muted-foreground">Förmånsvärde (120%): </span>
                    <span className="font-medium">{formatCurrency(parseFloat(form.liters) * parseFloat(form.pricePerLiter) * 1.2)}</span>
                </div>
            )}
            <Button className="w-full" onClick={handleSubmit} disabled={!form.employeeName || !form.month || !form.liters || !form.pricePerLiter}>
                Registrera
            </Button>
        </div>
    )
}
