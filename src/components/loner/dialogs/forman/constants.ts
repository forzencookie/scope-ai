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
import { FormType } from "./types"

export const ALLOWANCE_BENEFITS = ['friskvard', 'julgava', 'jubileumsgava', 'minnesgava']
export const VEHICLE_BENEFITS = ['tjanstebil']
export const MEAL_BENEFITS = ['kost', 'lunch']
export const HOUSING_BENEFITS = ['bostad']
export const FUEL_BENEFITS = ['drivmedel']
export const PARKING_BENEFITS = ['parkering']

export function getFormType(benefitId: string): FormType {
    if (ALLOWANCE_BENEFITS.includes(benefitId)) return 'allowance'
    if (VEHICLE_BENEFITS.includes(benefitId)) return 'vehicle'
    if (MEAL_BENEFITS.includes(benefitId)) return 'meal'
    if (HOUSING_BENEFITS.includes(benefitId)) return 'housing'
    if (FUEL_BENEFITS.includes(benefitId)) return 'fuel'
    if (PARKING_BENEFITS.includes(benefitId)) return 'parking'
    return 'simple'
}

// Swedish 2024 rates
export const MEAL_RATES = {
    lunch: 130,  // kr/day
    kost: 260,   // kr/day (full board)
}

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
