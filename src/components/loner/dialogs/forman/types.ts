export type FormType = 'allowance' | 'vehicle' | 'meal' | 'housing' | 'fuel' | 'parking' | 'simple' | ''

export interface AllowanceFormData {
    employeeName: string
    amount: string
    date: string
}

export interface VehicleFormData {
    employeeName: string
    startDate: string
    regNumber: string
    newCarPrice: string
    carType: 'el' | 'hybrid' | 'bensin' | 'diesel' | ''
}

export interface TripFormData {
    employeeName: string
    date: string
    from: string
    to: string
    distance: string
    purpose: string
}

export type VehicleMode = 'assign' | 'trip'

export interface MealFormData {
    employeeName: string
    month: string
    days: string
}

export interface SimpleFormData {
    employeeName: string
    month: string
    value: string
}

export interface HousingFormData {
    employeeName: string
    startDate: string
    address: string
    area: string  // kvm
    marketRent: string
}

export interface FuelFormData {
    employeeName: string
    month: string
    liters: string
    pricePerLiter: string
}

export interface ParkingFormData {
    employeeName: string
    month: string
    location: string
    marketValue: string
}

import { FormanCatalogItem } from "@/lib/ai/tool-types"

// Common props for all forms
export interface FormProps {
    benefit: FormanCatalogItem
    onAssign: (employeeName: string, amount: number, metadata?: Record<string, unknown>) => void
}
