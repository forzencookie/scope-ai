"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency, cn } from "@/lib/utils"
import { VehicleFormData, TripFormData, VehicleMode, FormProps } from "../types"

export function VehicleForm({ onAssign }: FormProps) {
    const [mode, setMode] = useState<VehicleMode>('trip')

    // Assignment Form State
    const [vehicleForm, setVehicleForm] = useState<VehicleFormData>({
        employeeName: '',
        startDate: new Date().toISOString().split('T')[0],
        regNumber: '',
        newCarPrice: '',
        carType: ''
    })

    // Trip Log Form State
    const [tripForm, setTripForm] = useState<TripFormData>({
        employeeName: '',
        date: new Date().toISOString().split('T')[0],
        from: '',
        to: '',
        distance: '',
        purpose: ''
    })

    const handleVehicleSubmit = () => {
        if (!vehicleForm.employeeName || !vehicleForm.startDate || !vehicleForm.newCarPrice || !vehicleForm.carType) return

        const newCarPrice = parseFloat(vehicleForm.newCarPrice)
        const baseAmount = newCarPrice * 0.09 / 12 // Simplified monthly rate
        const formansvarde = vehicleForm.carType === 'el' ? baseAmount * 0.6 : baseAmount

        onAssign(vehicleForm.employeeName, formansvarde, {
            startDate: vehicleForm.startDate,
            regNumber: vehicleForm.regNumber,
            newCarPrice,
            carType: vehicleForm.carType,
            monthlyFormansvarde: formansvarde
        })
        setVehicleForm({ employeeName: '', startDate: new Date().toISOString().split('T')[0], regNumber: '', newCarPrice: '', carType: '' })
    }

    const handleTripSubmit = () => {
        if (!tripForm.employeeName || !tripForm.date || !tripForm.from || !tripForm.to || !tripForm.distance || !tripForm.purpose) return
        const distance = parseFloat(tripForm.distance)
        const milersattning = distance * 25 // 25 kr/mil (2024 rate)

        onAssign(tripForm.employeeName, milersattning, {
            type: 'trip',
            date: tripForm.date,
            from: tripForm.from,
            to: tripForm.to,
            distance,
            purpose: tripForm.purpose,
            milersattning
        })
        setTripForm({ employeeName: '', date: new Date().toISOString().split('T')[0], from: '', to: '', distance: '', purpose: '' })
    }

    return (
        <div className="space-y-4">
            {/* Mode Tabs */}
            <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
                <button
                    type="button"
                    onClick={() => setMode('trip')}
                    className={cn(
                        "flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                        mode === 'trip' ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Logga resa
                </button>
                <button
                    type="button"
                    onClick={() => setMode('assign')}
                    className={cn(
                        "flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                        mode === 'assign' ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Tilldela bil
                </button>
            </div>

            {mode === 'trip' ? (
                /* Trip Logging Form */
                <>
                    <div className="space-y-2">
                        <Label>Anställd</Label>
                        <Input
                            placeholder="Namn på anställd..."
                            value={tripForm.employeeName}
                            onChange={e => setTripForm(f => ({ ...f, employeeName: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Datum</Label>
                        <Input
                            type="date"
                            value={tripForm.date}
                            onChange={e => setTripForm(f => ({ ...f, date: e.target.value }))}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label>Från</Label>
                            <Input
                                placeholder="t.ex. Kontoret"
                                value={tripForm.from}
                                onChange={e => setTripForm(f => ({ ...f, from: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Till</Label>
                            <Input
                                placeholder="Destination"
                                value={tripForm.to}
                                onChange={e => setTripForm(f => ({ ...f, to: e.target.value }))}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Sträcka</Label>
                            <span className="text-xs text-muted-foreground">25 kr/mil</span>
                        </div>
                        <div className="relative">
                            <Input
                                type="number"
                                placeholder="0"
                                value={tripForm.distance}
                                onChange={e => setTripForm(f => ({ ...f, distance: e.target.value }))}
                                className="pr-10"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">mil</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Syfte</Label>
                        <Input
                            placeholder="Möte, leverans..."
                            value={tripForm.purpose}
                            onChange={e => setTripForm(f => ({ ...f, purpose: e.target.value }))}
                        />
                    </div>
                    {tripForm.distance && (
                        <div className="bg-muted/30 p-3 rounded-md text-sm">
                            <span className="text-muted-foreground">Milersättning: </span>
                            <span className="font-medium">{formatCurrency(parseFloat(tripForm.distance) * 25)}</span>
                        </div>
                    )}
                    <Button className="w-full" onClick={handleTripSubmit} disabled={!tripForm.employeeName || !tripForm.from || !tripForm.to || !tripForm.distance || !tripForm.purpose}>
                        Registrera resa
                    </Button>
                </>
            ) : (
                /* Car Assignment Form */
                <>
                    <div className="space-y-2">
                        <Label>Anställd</Label>
                        <Input
                            placeholder="Namn på anställd..."
                            value={vehicleForm.employeeName}
                            onChange={e => setVehicleForm(f => ({ ...f, employeeName: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Startdatum</Label>
                        <Input
                            type="date"
                            value={vehicleForm.startDate}
                            onChange={e => setVehicleForm(f => ({ ...f, startDate: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Registreringsnummer</Label>
                        <Input
                            placeholder="ABC 123"
                            value={vehicleForm.regNumber}
                            onChange={e => setVehicleForm(f => ({ ...f, regNumber: e.target.value.toUpperCase() }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Nybilspris</Label>
                        <div className="relative">
                            <Input
                                type="number"
                                placeholder="0"
                                value={vehicleForm.newCarPrice}
                                onChange={e => setVehicleForm(f => ({ ...f, newCarPrice: e.target.value }))}
                                className="pr-10"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Biltyp</Label>
                        <Select value={vehicleForm.carType} onValueChange={v => setVehicleForm(f => ({ ...f, carType: v as VehicleFormData['carType'] }))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Välj biltyp..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="el">Elbil</SelectItem>
                                <SelectItem value="hybrid">Laddhybrid</SelectItem>
                                <SelectItem value="bensin">Bensin</SelectItem>
                                <SelectItem value="diesel">Diesel</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {vehicleForm.newCarPrice && (
                        <div className="bg-muted/30 p-3 rounded-md text-sm">
                            <span className="text-muted-foreground">Beräknat förmånsvärde: </span>
                            <span className="font-medium">
                                {formatCurrency(
                                    (parseFloat(vehicleForm.newCarPrice) * 0.09 / 12) *
                                    (vehicleForm.carType === 'el' ? 0.6 : 1)
                                )}/mån
                            </span>
                        </div>
                    )}
                    <Button className="w-full" onClick={handleVehicleSubmit} disabled={!vehicleForm.employeeName || !vehicleForm.startDate || !vehicleForm.newCarPrice || !vehicleForm.carType}>
                        Registrera bil
                    </Button>
                </>
            )}
        </div>
    )
}
