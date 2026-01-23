"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormProps, SimpleFormData } from "../types"

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
            <div className="space-y-2">
                <Label>Anställd</Label>
                <Input
                    placeholder="Namn på anställd..."
                    value={form.employeeName}
                    onChange={e => setForm(f => ({ ...f, employeeName: e.target.value }))}
                />
            </div>
            <div className="space-y-2">
                <Label>Period</Label>
                <Input
                    type="month"
                    value={form.month}
                    onChange={e => setForm(f => ({ ...f, month: e.target.value }))}
                />
            </div>
            <div className="space-y-2">
                <Label>{benefit.taxFree ? 'Värde' : 'Förmånsvärde'}</Label>
                <div className="relative">
                    <Input
                        type="number"
                        placeholder="0"
                        value={form.value}
                        onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                        className="pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr</span>
                </div>
            </div>
            <Button className="w-full" onClick={handleSubmit} disabled={!form.employeeName || !form.value}>
                Registrera
            </Button>
        </div>
    )
}
