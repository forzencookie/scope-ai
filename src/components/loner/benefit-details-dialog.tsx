"use client"

import { useState } from "react"
import {
    Banknote,
    Calculator,
    Gift,
    Car,
    GraduationCap,
    Utensils,
    Dumbbell,
    User,
    Calendar,
    Fuel,
    type LucideIcon
} from "lucide-react"
import { formatCurrency, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { StatusBadge } from "@/components/ui/status-badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { FormanCatalogItem, EmployeeBenefit } from "@/lib/ai-tool-types"

// =============================================================================
// Form Types & Detection
// =============================================================================

type FormType = 'allowance' | 'vehicle' | 'meal' | 'housing' | 'fuel' | 'parking' | 'simple'

const ALLOWANCE_BENEFITS = ['friskvard', 'julgava', 'jubileumsgava', 'minnesgava']
const VEHICLE_BENEFITS = ['tjanstebil']
const MEAL_BENEFITS = ['kost', 'lunch']
const HOUSING_BENEFITS = ['bostad']
const FUEL_BENEFITS = ['drivmedel']
const PARKING_BENEFITS = ['parkering']

function getFormType(benefitId: string): FormType {
    if (ALLOWANCE_BENEFITS.includes(benefitId)) return 'allowance'
    if (VEHICLE_BENEFITS.includes(benefitId)) return 'vehicle'
    if (MEAL_BENEFITS.includes(benefitId)) return 'meal'
    if (HOUSING_BENEFITS.includes(benefitId)) return 'housing'
    if (FUEL_BENEFITS.includes(benefitId)) return 'fuel'
    if (PARKING_BENEFITS.includes(benefitId)) return 'parking'
    return 'simple'
}

// Swedish 2024 rates
const MEAL_RATES = {
    lunch: 130,  // kr/day
    kost: 260,   // kr/day (full board)
}

// =============================================================================
// Shared icon helper
// =============================================================================

export const getBenefitIcon = (id: string): LucideIcon => {
    switch (id) {
        case 'friskvard': return Dumbbell
        case 'tjanstebil': return Car
        case 'drivmedel': return Fuel
        case 'utbildning': return GraduationCap
        case 'kost':
        case 'lunch': return Utensils
        default: return Gift
    }
}

// =============================================================================
// Form State Types
// =============================================================================

interface AllowanceFormData {
    employeeName: string
    amount: string
    date: string
}

interface VehicleFormData {
    employeeName: string
    startDate: string
    regNumber: string
    newCarPrice: string
    carType: 'el' | 'hybrid' | 'bensin' | 'diesel' | ''
}

interface TripFormData {
    employeeName: string
    date: string
    from: string
    to: string
    distance: string
    purpose: string
}

type VehicleMode = 'assign' | 'trip'

interface MealFormData {
    employeeName: string
    month: string
    days: string
}

interface SimpleFormData {
    employeeName: string
    month: string
    value: string
}

interface HousingFormData {
    employeeName: string
    startDate: string
    address: string
    area: string  // kvm
    marketRent: string
}

interface FuelFormData {
    employeeName: string
    month: string
    liters: string
    pricePerLiter: string
}

interface ParkingFormData {
    employeeName: string
    month: string
    location: string
    marketValue: string
}

// =============================================================================
// Main Component
// =============================================================================

interface BenefitDetailsDialogProps {
    benefit: FormanCatalogItem | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onAssign?: (employeeName: string, amount: number, metadata?: Record<string, unknown>) => void
    assignedEmployees?: EmployeeBenefit[]
}

export function BenefitDetailsDialog({
    benefit,
    open,
    onOpenChange,
    onAssign,
    assignedEmployees = []
}: BenefitDetailsDialogProps) {
    const [expanded, setExpanded] = useState(false)

    // Form states for each type
    const [allowanceForm, setAllowanceForm] = useState<AllowanceFormData>({
        employeeName: '', amount: '', date: new Date().toISOString().split('T')[0]
    })
    const [vehicleForm, setVehicleForm] = useState<VehicleFormData>({
        employeeName: '', startDate: new Date().toISOString().split('T')[0], regNumber: '', newCarPrice: '', carType: ''
    })
    const [tripForm, setTripForm] = useState<TripFormData>({
        employeeName: '', date: new Date().toISOString().split('T')[0], from: '', to: '', distance: '', purpose: ''
    })
    const [vehicleMode, setVehicleMode] = useState<VehicleMode>('trip')
    const [mealForm, setMealForm] = useState<MealFormData>({
        employeeName: '', month: '', days: ''
    })
    const [simpleForm, setSimpleForm] = useState<SimpleFormData>({
        employeeName: '', month: '', value: ''
    })
    const [housingForm, setHousingForm] = useState<HousingFormData>({
        employeeName: '', startDate: new Date().toISOString().split('T')[0], address: '', area: '', marketRent: ''
    })
    const [fuelForm, setFuelForm] = useState<FuelFormData>({
        employeeName: '', month: '', liters: '', pricePerLiter: ''
    })
    const [parkingForm, setParkingForm] = useState<ParkingFormData>({
        employeeName: '', month: '', location: '', marketValue: ''
    })

    if (!benefit) return null

    const Icon = getBenefitIcon(benefit.id)
    const formType = getFormType(benefit.id)

    const employeesWithBenefit = assignedEmployees.filter(
        e => e.benefitType === benefit.id
    )

    // Calculate remaining allowance for allowance-based benefits
    const getRemainingAllowance = (employeeName: string) => {
        if (!benefit.maxAmount) return null
        const used = assignedEmployees
            .filter(e => e.benefitType === benefit.id && e.employeeName === employeeName)
            .reduce((sum, e) => sum + e.amount, 0)
        return benefit.maxAmount - used
    }

    // ==========================================================================
    // Form Submissions
    // ==========================================================================

    const handleAllowanceSubmit = () => {
        if (!allowanceForm.employeeName || !allowanceForm.amount) return
        onAssign?.(allowanceForm.employeeName, parseFloat(allowanceForm.amount), {
            date: allowanceForm.date
        })
        setAllowanceForm({ employeeName: '', amount: '', date: new Date().toISOString().split('T')[0] })
    }

    const handleVehicleSubmit = () => {
        if (!vehicleForm.employeeName || !vehicleForm.startDate || !vehicleForm.newCarPrice || !vehicleForm.carType) return
        // Simplified förmånsvärde calculation (real one is more complex)
        const newCarPrice = parseFloat(vehicleForm.newCarPrice)
        const baseAmount = newCarPrice * 0.09 / 12 // Simplified monthly rate
        const formansvarde = vehicleForm.carType === 'el' ? baseAmount * 0.6 : baseAmount

        onAssign?.(vehicleForm.employeeName, formansvarde, {
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

        onAssign?.(tripForm.employeeName, milersattning, {
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

    const handleMealSubmit = () => {
        if (!mealForm.employeeName || !mealForm.month || !mealForm.days) return
        const days = parseInt(mealForm.days)
        const rate = benefit.id === 'lunch' ? MEAL_RATES.lunch : MEAL_RATES.kost
        const formansvarde = days * rate

        onAssign?.(mealForm.employeeName, formansvarde, {
            month: mealForm.month,
            days,
            dailyRate: rate
        })
        setMealForm({ employeeName: '', month: '', days: '' })
    }

    const handleSimpleSubmit = () => {
        if (!simpleForm.employeeName || !simpleForm.value) return
        onAssign?.(simpleForm.employeeName, parseFloat(simpleForm.value), {
            month: simpleForm.month
        })
        setSimpleForm({ employeeName: '', month: '', value: '' })
    }

    const handleHousingSubmit = () => {
        if (!housingForm.employeeName || !housingForm.address || !housingForm.area || !housingForm.marketRent) return
        const marketRent = parseFloat(housingForm.marketRent)

        onAssign?.(housingForm.employeeName, marketRent, {
            type: 'housing',
            startDate: housingForm.startDate,
            address: housingForm.address,
            area: parseFloat(housingForm.area),
            monthlyFormansvarde: marketRent
        })
        setHousingForm({ employeeName: '', startDate: new Date().toISOString().split('T')[0], address: '', area: '', marketRent: '' })
    }

    const handleFuelSubmit = () => {
        if (!fuelForm.employeeName || !fuelForm.month || !fuelForm.liters || !fuelForm.pricePerLiter) return
        const liters = parseFloat(fuelForm.liters)
        const pricePerLiter = parseFloat(fuelForm.pricePerLiter)
        const formansvarde = liters * pricePerLiter * 1.2 // 120% of market price

        onAssign?.(fuelForm.employeeName, formansvarde, {
            type: 'fuel',
            month: fuelForm.month,
            liters,
            pricePerLiter,
            formansvarde
        })
        setFuelForm({ employeeName: '', month: '', liters: '', pricePerLiter: '' })
    }

    const handleParkingSubmit = () => {
        if (!parkingForm.employeeName || !parkingForm.month || !parkingForm.marketValue) return
        const marketValue = parseFloat(parkingForm.marketValue)

        onAssign?.(parkingForm.employeeName, marketValue, {
            type: 'parking',
            month: parkingForm.month,
            location: parkingForm.location,
            monthlyFormansvarde: marketValue
        })
        setParkingForm({ employeeName: '', month: '', location: '', marketValue: '' })
    }

    // ==========================================================================
    // Form Renderers
    // ==========================================================================

    const AllowanceForm = () => (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Anställd</Label>
                <Input
                    placeholder="Namn på anställd..."
                    value={allowanceForm.employeeName}
                    onChange={e => setAllowanceForm(f => ({ ...f, employeeName: e.target.value }))}
                />
            </div>
            <div className="space-y-2">
                <Label>Datum</Label>
                <Input
                    type="date"
                    value={allowanceForm.date}
                    onChange={e => setAllowanceForm(f => ({ ...f, date: e.target.value }))}
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
                        value={allowanceForm.amount}
                        onChange={e => setAllowanceForm(f => ({ ...f, amount: e.target.value }))}
                        className="pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr</span>
                </div>
            </div>
            <Button className="w-full" onClick={handleAllowanceSubmit} disabled={!allowanceForm.employeeName || !allowanceForm.amount}>
                Registrera
            </Button>
        </div>
    )

    const VehicleForm = () => (
        <div className="space-y-4">
            {/* Mode Tabs */}
            <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
                <button
                    type="button"
                    onClick={() => setVehicleMode('trip')}
                    className={cn(
                        "flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                        vehicleMode === 'trip' ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Logga resa
                </button>
                <button
                    type="button"
                    onClick={() => setVehicleMode('assign')}
                    className={cn(
                        "flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                        vehicleMode === 'assign' ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Tilldela bil
                </button>
            </div>

            {vehicleMode === 'trip' ? (
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

    const MealForm = () => (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Anställd</Label>
                <Input
                    placeholder="Namn på anställd..."
                    value={mealForm.employeeName}
                    onChange={e => setMealForm(f => ({ ...f, employeeName: e.target.value }))}
                />
            </div>
            <div className="space-y-2">
                <Label>Månad</Label>
                <Input
                    type="month"
                    value={mealForm.month}
                    onChange={e => setMealForm(f => ({ ...f, month: e.target.value }))}
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
                    value={mealForm.days}
                    onChange={e => setMealForm(f => ({ ...f, days: e.target.value }))}
                />
            </div>
            {mealForm.days && (
                <div className="bg-muted/30 p-3 rounded-md text-sm">
                    <span className="text-muted-foreground">Förmånsvärde: </span>
                    <span className="font-medium">
                        {formatCurrency(parseInt(mealForm.days) * (benefit.id === 'lunch' ? 130 : 260))}
                    </span>
                </div>
            )}
            <Button className="w-full" onClick={handleMealSubmit} disabled={!mealForm.employeeName || !mealForm.month || !mealForm.days}>
                Registrera
            </Button>
        </div>
    )

    const SimpleForm = () => (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Anställd</Label>
                <Input
                    placeholder="Namn på anställd..."
                    value={simpleForm.employeeName}
                    onChange={e => setSimpleForm(f => ({ ...f, employeeName: e.target.value }))}
                />
            </div>
            <div className="space-y-2">
                <Label>Period</Label>
                <Input
                    type="month"
                    value={simpleForm.month}
                    onChange={e => setSimpleForm(f => ({ ...f, month: e.target.value }))}
                />
            </div>
            <div className="space-y-2">
                <Label>{benefit.taxFree ? 'Värde' : 'Förmånsvärde'}</Label>
                <div className="relative">
                    <Input
                        type="number"
                        placeholder="0"
                        value={simpleForm.value}
                        onChange={e => setSimpleForm(f => ({ ...f, value: e.target.value }))}
                        className="pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr</span>
                </div>
            </div>
            <Button className="w-full" onClick={handleSimpleSubmit} disabled={!simpleForm.employeeName || !simpleForm.value}>
                Registrera
            </Button>
        </div>
    )

    const HousingForm = () => (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Anställd</Label>
                <Input
                    placeholder="Namn på anställd..."
                    value={housingForm.employeeName}
                    onChange={e => setHousingForm(f => ({ ...f, employeeName: e.target.value }))}
                />
            </div>
            <div className="space-y-2">
                <Label>Startdatum</Label>
                <Input
                    type="date"
                    value={housingForm.startDate}
                    onChange={e => setHousingForm(f => ({ ...f, startDate: e.target.value }))}
                />
            </div>
            <div className="space-y-2">
                <Label>Adress</Label>
                <Input
                    placeholder="Gatuadress..."
                    value={housingForm.address}
                    onChange={e => setHousingForm(f => ({ ...f, address: e.target.value }))}
                />
            </div>
            <div className="space-y-2">
                <Label>Yta</Label>
                <div className="relative">
                    <Input
                        type="number"
                        placeholder="0"
                        value={housingForm.area}
                        onChange={e => setHousingForm(f => ({ ...f, area: e.target.value }))}
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
                        value={housingForm.marketRent}
                        onChange={e => setHousingForm(f => ({ ...f, marketRent: e.target.value }))}
                        className="pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr</span>
                </div>
            </div>
            {housingForm.marketRent && (
                <div className="bg-muted/30 p-3 rounded-md text-sm">
                    <span className="text-muted-foreground">Förmånsvärde: </span>
                    <span className="font-medium">{formatCurrency(parseFloat(housingForm.marketRent))}/mån</span>
                </div>
            )}
            <Button className="w-full" onClick={handleHousingSubmit} disabled={!housingForm.employeeName || !housingForm.address || !housingForm.area || !housingForm.marketRent}>
                Registrera
            </Button>
        </div>
    )

    const FuelForm = () => (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Anställd</Label>
                <Input
                    placeholder="Namn på anställd..."
                    value={fuelForm.employeeName}
                    onChange={e => setFuelForm(f => ({ ...f, employeeName: e.target.value }))}
                />
            </div>
            <div className="space-y-2">
                <Label>Månad</Label>
                <Input
                    type="month"
                    value={fuelForm.month}
                    onChange={e => setFuelForm(f => ({ ...f, month: e.target.value }))}
                />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <Label>Antal liter</Label>
                    <Input
                        type="number"
                        placeholder="0"
                        value={fuelForm.liters}
                        onChange={e => setFuelForm(f => ({ ...f, liters: e.target.value }))}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Pris/liter</Label>
                    <div className="relative">
                        <Input
                            type="number"
                            placeholder="0"
                            value={fuelForm.pricePerLiter}
                            onChange={e => setFuelForm(f => ({ ...f, pricePerLiter: e.target.value }))}
                            className="pr-10"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr</span>
                    </div>
                </div>
            </div>
            {fuelForm.liters && fuelForm.pricePerLiter && (
                <div className="bg-muted/30 p-3 rounded-md text-sm">
                    <span className="text-muted-foreground">Förmånsvärde (120%): </span>
                    <span className="font-medium">{formatCurrency(parseFloat(fuelForm.liters) * parseFloat(fuelForm.pricePerLiter) * 1.2)}</span>
                </div>
            )}
            <Button className="w-full" onClick={handleFuelSubmit} disabled={!fuelForm.employeeName || !fuelForm.month || !fuelForm.liters || !fuelForm.pricePerLiter}>
                Registrera
            </Button>
        </div>
    )

    const ParkingForm = () => (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Anställd</Label>
                <Input
                    placeholder="Namn på anställd..."
                    value={parkingForm.employeeName}
                    onChange={e => setParkingForm(f => ({ ...f, employeeName: e.target.value }))}
                />
            </div>
            <div className="space-y-2">
                <Label>Månad</Label>
                <Input
                    type="month"
                    value={parkingForm.month}
                    onChange={e => setParkingForm(f => ({ ...f, month: e.target.value }))}
                />
            </div>
            <div className="space-y-2">
                <Label>Plats</Label>
                <Input
                    placeholder="t.ex. P-hus City..."
                    value={parkingForm.location}
                    onChange={e => setParkingForm(f => ({ ...f, location: e.target.value }))}
                />
            </div>
            <div className="space-y-2">
                <Label>Marknadsvärde (månad)</Label>
                <div className="relative">
                    <Input
                        type="number"
                        placeholder="0"
                        value={parkingForm.marketValue}
                        onChange={e => setParkingForm(f => ({ ...f, marketValue: e.target.value }))}
                        className="pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr</span>
                </div>
            </div>
            {parkingForm.marketValue && (
                <div className="bg-muted/30 p-3 rounded-md text-sm">
                    <span className="text-muted-foreground">Förmånsvärde: </span>
                    <span className="font-medium">{formatCurrency(parseFloat(parkingForm.marketValue))}/mån</span>
                </div>
            )}
            <Button className="w-full" onClick={handleParkingSubmit} disabled={!parkingForm.employeeName || !parkingForm.month || !parkingForm.marketValue}>
                Registrera
            </Button>
        </div>
    )

    const renderForm = () => {
        switch (formType) {
            case 'allowance': return <AllowanceForm />
            case 'vehicle': return <VehicleForm />
            case 'meal': return <MealForm />
            case 'housing': return <HousingForm />
            case 'fuel': return <FuelForm />
            case 'parking': return <ParkingForm />
            default: return <SimpleForm />
        }
    }

    // ==========================================================================
    // Employee List
    // ==========================================================================

    const EmployeeList = () => (
        <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Anställda med förmånen ({employeesWithBenefit.length})
            </h3>
            {employeesWithBenefit.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                        <User className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <p className="font-medium text-foreground mb-1">
                        Inga anställda har denna förmån
                    </p>
                    <p className="text-sm text-muted-foreground max-w-[240px]">
                        Använd formuläret för att registrera förmånen.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {employeesWithBenefit.map((emp, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="h-4 w-4 text-primary" />
                                </div>
                                <span className="font-medium text-sm">{emp.employeeName}</span>
                            </div>
                            <span className="text-sm font-medium">{formatCurrency(emp.amount)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )

    // ==========================================================================
    // Render
    // ==========================================================================

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={cn("max-h-[90vh]", expanded ? "max-w-[95vw]" : "max-w-lg")}
                expandable
                onExpandedChange={setExpanded}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        {benefit.name}
                    </DialogTitle>
                </DialogHeader>

                <div className={cn("flex gap-6", expanded ? "flex-row" : "flex-col")}>
                    {/* Left Side / Top */}
                    <div className={cn(
                        "space-y-6 py-4 overflow-y-auto px-1 -mx-1",
                        expanded ? "w-1/2 max-h-[calc(90vh-180px)] pr-4" : "w-full max-h-[calc(90vh-180px)]"
                    )}>
                        {/* Benefit Header */}
                        <div className="flex items-center gap-4 bg-muted/40 p-4 rounded-lg">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-muted-foreground line-clamp-2">{benefit.description}</p>
                            </div>
                            <StatusBadge status={benefit.taxFree ? "Skattefri" : "Skattepliktig"} variant={benefit.taxFree ? "success" : "warning"} />
                        </div>

                        {/* Info Rows */}
                        <div className="space-y-1">
                            <div className="flex justify-between items-center py-2 border-b">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Banknote className="h-4 w-4" />
                                    <span className="text-sm">Maxbelopp per år</span>
                                </div>
                                <span className="font-medium text-sm">
                                    {benefit.maxAmount ? formatCurrency(benefit.maxAmount) : 'Obegränsat'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calculator className="h-4 w-4" />
                                    <span className="text-sm">Bokföringskonto</span>
                                </div>
                                <span className="font-medium font-mono text-sm">{benefit.basAccount || '—'}</span>
                            </div>
                        </div>

                        {/* Tax Info */}
                        <div className="bg-muted/30 p-3 rounded-md text-sm text-muted-foreground">
                            {benefit.taxFree
                                ? "Skattefri för anställd och avdragsgill för företaget."
                                : benefit.formansvardeCalculation || "Skattepliktig. Arbetsgivaravgifter tillkommer."
                            }
                        </div>

                        {/* Collapsed: Form + List */}
                        {!expanded && onAssign && (
                            <>
                                <div className="border-t" />
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                    Registrera
                                </h3>
                                {renderForm()}
                                <div className="border-t" />
                                <EmployeeList />
                            </>
                        )}

                        {/* Expanded: Stats + List */}
                        {expanded && (
                            <div className="space-y-6 pt-2">
                                <div className="border-t" />
                                <div className="space-y-2 pb-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Antal anställda</span>
                                        <span className="font-medium">{employeesWithBenefit.length} st</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Total utdelning</span>
                                        <span className="font-medium">
                                            {formatCurrency(employeesWithBenefit.reduce((sum, e) => sum + e.amount, 0))}
                                        </span>
                                    </div>
                                </div>
                                <EmployeeList />
                            </div>
                        )}
                    </div>

                    {/* Right Side (Expanded) - Form */}
                    {expanded && onAssign && (
                        <div className="w-1/2 border-l pl-6">
                            <div className="sticky top-0 space-y-4">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                                    Registrera
                                </h3>
                                {renderForm()}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="outline">Stäng</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
