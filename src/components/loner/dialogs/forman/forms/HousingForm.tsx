"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCurrency } from "@/lib/utils"
import { FormProps, HousingFormData } from "../types"

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
            <div className="space-y-2">
                <Label>Anställd</Label>
                <Input
                    placeholder="Namn på anställd..."
                    value={form.employeeName}
                    onChange={e => setForm(f => ({ ...f, employeeName: e.target.value }))}
                />
            </div>
            <div className="space-y-2">
                <Label>Startdatum</Label>
                <Input
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                />
            </div>
            <div className="space-y-2">
                <Label>Adress</Label>
                <Input
                    placeholder="Gatuadress..."
                    value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                />
            </div>
            <div className="space-y-2">
                <Label>Yta</Label>
                <div className="relative">
                    <Input
                        type="number"
                        placeholder="0"
                        value={form.area}
                        onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                        className="pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kvm</span>
                </div>
            </div>
            <div className="space-y-2">
                <Label>Marknadshyra (månad)</Label>
                <div className="relative">
                    <Input
                        type="number"
                        placeholder="0"
                        value={form.marketRent}
                        onChange={e => setForm(f => ({ ...f, marketRent: e.target.value }))}
                        className="pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr</span>
                </div>
            </div>
            {form.marketRent && (
                <div className="bg-muted/30 p-3 rounded-md text-sm">
                    <span className="text-muted-foreground">Förmånsvärde: </span>
                    <span className="font-medium">{formatCurrency(parseFloat(form.marketRent))}/mån</span>
                </div>
            )}
            <Button className="w-full" onClick={handleSubmit} disabled={!form.employeeName || !form.address || !form.area || !form.marketRent}>
                Registrera
            </Button>
        </div>
    )
}
