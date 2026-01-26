"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { formatCurrency } from "@/lib/utils"
import { VehicleFormData, TripFormData, VehicleMode, FormProps } from "../types"
import { 
    EmployeeInput, 
    DateInput, 
    TextInputField, 
    CurrencyInput, 
    SubmitButton, 
    ModeSwitch, 
    FormField 
} from "./shared"

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
            <ModeSwitch
                mode={mode}
                options={[
                    { value: 'trip', label: 'Logga resa' },
                    { value: 'assign', label: 'Tilldela bil' }
                ]}
                onChange={(v) => setMode(v as VehicleMode)}
            />

            {mode === 'trip' ? (
                /* Trip Logging Form */
                <>
                    <EmployeeInput
                        value={tripForm.employeeName}
                        onChange={(v) => setTripForm(f => ({ ...f, employeeName: v }))}
                    />
                    <DateInput
                        label="Datum"
                        value={tripForm.date}
                        onChange={(v) => setTripForm(f => ({ ...f, date: v }))}
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <TextInputField
                            label="Från"
                            placeholder="t.ex. Kontoret"
                            value={tripForm.from}
                            onChange={(v) => setTripForm(f => ({ ...f, from: v }))}
                        />
                        <TextInputField
                            label="Till"
                            placeholder="Destination"
                            value={tripForm.to}
                            onChange={(v) => setTripForm(f => ({ ...f, to: v }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Sträcka</Label>
                            <span className="text-xs text-muted-foreground">25 kr/mil</span>
                        </div>
                        <TextInputField
                            label=""
                            type="number"
                            placeholder="0"
                            value={tripForm.distance}
                            onChange={(v) => setTripForm(f => ({ ...f, distance: v }))}
                            suffix="mil"
                        />
                    </div>
                    <TextInputField
                        label="Syfte"
                        placeholder="Möte, leverans..."
                        value={tripForm.purpose}
                        onChange={(v) => setTripForm(f => ({ ...f, purpose: v }))}
                    />
                    {tripForm.distance && (
                        <div className="bg-muted/30 p-3 rounded-md text-sm">
                            <span className="text-muted-foreground">Milersättning: </span>
                            <span className="font-medium">{formatCurrency(parseFloat(tripForm.distance) * 25)}</span>
                        </div>
                    )}
                    <SubmitButton
                        label="Registrera resa"
                        onClick={handleTripSubmit}
                        disabled={!tripForm.employeeName || !tripForm.from || !tripForm.to || !tripForm.distance || !tripForm.purpose}
                    />
                </>
            ) : (
                /* Car Assignment Form */
                <>
                    <EmployeeInput
                        value={vehicleForm.employeeName}
                        onChange={(v) => setVehicleForm(f => ({ ...f, employeeName: v }))}
                    />
                    <DateInput
                        label="Startdatum"
                        value={vehicleForm.startDate}
                        onChange={(v) => setVehicleForm(f => ({ ...f, startDate: v }))}
                    />
                    <TextInputField
                        label="Registreringsnummer"
                        placeholder="ABC 123"
                        value={vehicleForm.regNumber}
                        onChange={(v) => setVehicleForm(f => ({ ...f, regNumber: v.toUpperCase() }))}
                    />
                    <CurrencyInput
                        label="Nybilspris"
                        value={vehicleForm.newCarPrice}
                        onChange={(v) => setVehicleForm(f => ({ ...f, newCarPrice: v }))}
                    />
                    <FormField label="Biltyp">
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
                    </FormField>
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
                    <SubmitButton
                        label="Registrera bil"
                        onClick={handleVehicleSubmit}
                        disabled={!vehicleForm.employeeName || !vehicleForm.startDate || !vehicleForm.newCarPrice || !vehicleForm.carType}
                    />
                </>
            )}
        </div>
    )
}
