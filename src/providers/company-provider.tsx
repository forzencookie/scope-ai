"use client"

// ============================================
// Company Provider
// React context for company type state
// ============================================

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react"
import type { ReactNode } from "react"
import type { CompanyType, FeatureKey } from "@/lib/company-types"
import { hasFeature, companyTypes, getCompanyTypeFullName } from "@/lib/company-types"
import type { SubscriptionTier } from "@/lib/payments/subscription"
import { getMyCompany } from "@/services/company/company-service"
import { updateCompanyAction } from "@/app/actions/company"
import { nullToUndefined } from "@/lib/utils"

// ============================================
// Types
// ============================================

interface CompanyInfo {
  id: string
  name: string
  orgNumber: string
  companyType: CompanyType
  registrationDate?: string
  address?: string
  city?: string
  zipCode?: string
  email?: string
  phone?: string
  vatNumber?: string
  contactPerson?: string
  bankgiro?: string
  plusgiro?: string
  hasMomsRegistration: boolean
  hasEmployees: boolean
  fiscalYearEnd: string
  accountingMethod: 'cash' | 'invoice'
  vatFrequency: 'monthly' | 'quarterly' | 'annually'
  isCloselyHeld: boolean
  hasFskatt: boolean
  shareCapital: number
  totalShares: number
  shareClasses: { A: number; B: number }
  memberFee: number
  capitalContribution: number
  logoUrl?: string
  onboardingMode: 'fresh' | 'existing'
  onboardingComplete: boolean
}

interface CompanyContextValue {
  company: CompanyInfo | null
  companyType: CompanyType
  isLoading: boolean
  isSaving: boolean
  setCompanyType: (type: CompanyType) => void
  setCompany: (company: CompanyInfo) => void
  updateCompany: (updates: Partial<CompanyInfo>) => void
  saveChanges: () => Promise<{ success: boolean; error?: string }>
  hasFeature: (feature: FeatureKey) => boolean
  companyTypeName: string
  companyTypeFullName: string
}

// ============================================
// Tier-based Company Type Defaults
// ============================================
// Pro  → EF, Förening (solo, non-profit entities)
// Max  → AB, HB, KB (all company types including profit-driven)
// Enterprise → all types

const DEFAULT_COMPANY_TYPE_BY_TIER: Record<SubscriptionTier, CompanyType> = {
  pro: "ef",
  max: "ab",
  enterprise: "ab",
}

// Company-type-specific defaults applied when type is known
const COMPANY_TYPE_DEFAULTS: Record<CompanyType, Partial<CompanyInfo>> = {
  ef: {
    accountingMethod: "cash",
    isCloselyHeld: false,
    shareCapital: 0,
    totalShares: 0,
    shareClasses: { A: 0, B: 0 },
    hasMomsRegistration: true,
  },
  ab: {
    accountingMethod: "invoice",
    isCloselyHeld: true,
    shareCapital: 25000,
    totalShares: 500,
    shareClasses: { A: 0, B: 500 },
    hasMomsRegistration: true,
  },
  hb: {
    accountingMethod: "invoice",
    isCloselyHeld: false,
    shareCapital: 0,
    totalShares: 0,
    shareClasses: { A: 0, B: 0 },
    hasMomsRegistration: true,
  },
  kb: {
    accountingMethod: "invoice",
    isCloselyHeld: false,
    shareCapital: 0,
    totalShares: 0,
    shareClasses: { A: 0, B: 0 },
    hasMomsRegistration: true,
  },
  forening: {
    accountingMethod: "cash",
    isCloselyHeld: false,
    shareCapital: 0,
    totalShares: 0,
    shareClasses: { A: 0, B: 0 },
    hasMomsRegistration: false,
  },
}

// Legal defaults that are correct regardless of company type
const LEGAL_DEFAULTS: Partial<CompanyInfo> = {
  fiscalYearEnd: "12-31",
  vatFrequency: "quarterly",
  hasFskatt: true,
}

function buildCompanyDefaults(type: CompanyType): CompanyInfo {
  return {
    id: "",
    name: "",
    orgNumber: "",
    companyType: type,
    hasEmployees: false,
    memberFee: 0,
    capitalContribution: 0,
    onboardingMode: "fresh",
    onboardingComplete: false,
    // Spread legal defaults first, then type-specific overrides
    ...LEGAL_DEFAULTS,
    ...COMPANY_TYPE_DEFAULTS[type],
  } as CompanyInfo
}

// ============================================
// Context
// ============================================

const CompanyContext = createContext<CompanyContextValue | undefined>(undefined)

// ============================================
// Provider Component
// ============================================

interface CompanyProviderProps {
  children: ReactNode
  initialTier?: SubscriptionTier
}

export function CompanyProvider({
  children,
  initialTier = "pro",
}: CompanyProviderProps) {
  const [company, setCompanyState] = useState<CompanyInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Ref for latest company state — prevents stale closure in saveChanges
  const companyRef = useRef(company)
  companyRef.current = company

  const defaultType = DEFAULT_COMPANY_TYPE_BY_TIER[initialTier]

  // Load company from database
  useEffect(() => {
    let cancelled = false

    async function loadCompany() {
      try {
        const dbCompanyInfo = await getMyCompany()
        if (cancelled) return

        if (dbCompanyInfo) {
          const resolvedType = dbCompanyInfo.companyType || defaultType
          const typeDefaults = COMPANY_TYPE_DEFAULTS[resolvedType]

          const loaded: CompanyInfo = {
            id: dbCompanyInfo.id,
            name: dbCompanyInfo.name,
            orgNumber: dbCompanyInfo.orgNumber || '',
            companyType: resolvedType,
            vatNumber: dbCompanyInfo.vatNumber || '',
            address: dbCompanyInfo.address || '',
            city: dbCompanyInfo.city || '',
            zipCode: dbCompanyInfo.zipCode || '',
            email: dbCompanyInfo.email || '',
            phone: dbCompanyInfo.phone || '',
            contactPerson: dbCompanyInfo.contactPerson || '',
            registrationDate: nullToUndefined(dbCompanyInfo.registrationDate),
            hasMomsRegistration: dbCompanyInfo.hasMomsRegistration ?? typeDefaults.hasMomsRegistration ?? true,
            hasEmployees: dbCompanyInfo.hasEmployees ?? false,
            fiscalYearEnd: dbCompanyInfo.fiscalYearEnd || '12-31',
            accountingMethod: dbCompanyInfo.accountingMethod || typeDefaults.accountingMethod || 'invoice',
            vatFrequency: dbCompanyInfo.vatFrequency || 'quarterly',
            isCloselyHeld: dbCompanyInfo.isCloselyHeld ?? typeDefaults.isCloselyHeld ?? false,
            hasFskatt: dbCompanyInfo.hasFskatt ?? true,
            shareCapital: dbCompanyInfo.shareCapital ?? typeDefaults.shareCapital ?? 0,
            totalShares: dbCompanyInfo.totalShares ?? typeDefaults.totalShares ?? 0,
            shareClasses: typeDefaults.shareClasses ?? { A: 0, B: 0 },
            memberFee: 0,
            capitalContribution: 0,
            onboardingMode: 'existing',
            onboardingComplete: true,
          }
          setCompanyState(loaded)
          setIsLoading(false)
          return
        }
      } catch (error) {
        if (cancelled) return
        console.warn('[CompanyProvider] Failed to fetch from database:', error)
      }

      // Fallback: no company in DB — use tier-based defaults
      if (!cancelled) {
        setCompanyState(buildCompanyDefaults(defaultType))
        setIsLoading(false)
      }
    }

    loadCompany()
    return () => { cancelled = true }
  }, [defaultType])

  const companyType = company?.companyType ?? defaultType

  // Save reads from ref to always get latest state — no stale closure
  const saveChanges = useCallback(async () => {
    const current = companyRef.current
    if (!current || !current.id) return { success: false, error: "Ingen företag valt" }

    setIsSaving(true)
    try {
      const result = await updateCompanyAction(current.id, {
        name: current.name,
        orgNumber: current.orgNumber,
        companyType: current.companyType,
        vatNumber: current.vatNumber,
        address: current.address,
        city: current.city,
        zipCode: current.zipCode,
        email: current.email,
        phone: current.phone,
        contactPerson: current.contactPerson,
        registrationDate: current.registrationDate,
        fiscalYearEnd: current.fiscalYearEnd,
        accountingMethod: current.accountingMethod,
        vatFrequency: current.vatFrequency,
        isCloselyHeld: current.isCloselyHeld,
        hasEmployees: current.hasEmployees,
        hasMomsRegistration: current.hasMomsRegistration,
        hasFskatt: current.hasFskatt,
        shareCapital: current.shareCapital,
        totalShares: current.totalShares,
      })
      return result
    } catch (error) {
      console.error('[CompanyProvider] Failed to save:', error)
      return { success: false, error: error instanceof Error ? error.message : "Ett fel uppstod" }
    } finally {
      setIsSaving(false)
    }
  }, [])

  // Set company type with type-specific defaults
  const setCompanyType = useCallback((type: CompanyType) => {
    const typeDefaults = COMPANY_TYPE_DEFAULTS[type]
    setCompanyState(prev => {
      if (!prev) {
        return buildCompanyDefaults(type)
      }
      return { ...prev, companyType: type, ...typeDefaults }
    })
  }, [])

  const setCompany = useCallback((newCompany: CompanyInfo) => {
    setCompanyState(newCompany)
  }, [])

  const updateCompany = useCallback((updates: Partial<CompanyInfo>) => {
    setCompanyState(prev => {
      if (!prev) {
        return { ...buildCompanyDefaults(defaultType), ...updates }
      }
      return { ...prev, ...updates }
    })
  }, [defaultType])

  const checkFeature = useCallback((feature: FeatureKey): boolean => {
    const current = companyRef.current
    if (feature === "momsdeklaration" && current && !current.hasMomsRegistration) {
      return false
    }
    if ((feature === "lonebesked" || feature === "agi" || feature === "formaner") && current && !current.hasEmployees) {
      if (companyType !== "ab") return false
    }
    return hasFeature(companyType, feature)
  }, [companyType])

  const companyTypeName = companyTypes[companyType].name
  const companyTypeFullName = getCompanyTypeFullName(companyType)

  const value = useMemo<CompanyContextValue>(() => ({
    company,
    companyType,
    isLoading,
    isSaving,
    setCompanyType,
    setCompany,
    updateCompany,
    saveChanges,
    hasFeature: checkFeature,
    companyTypeName,
    companyTypeFullName,
  }), [company, companyType, isLoading, isSaving, setCompanyType, setCompany, updateCompany, saveChanges, checkFeature, companyTypeName, companyTypeFullName])

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  )
}

// ============================================
// Hooks
// ============================================

export function useCompany(): CompanyContextValue {
  const context = useContext(CompanyContext)
  if (context === undefined) {
    throw new Error("useCompany must be used within a CompanyProvider")
  }
  return context
}

export function useFeature(feature: FeatureKey): boolean {
  const { hasFeature } = useCompany()
  return hasFeature(feature)
}

export function useCompanyType() {
  const { companyType, companyTypeName, companyTypeFullName } = useCompany()
  return {
    type: companyType,
    name: companyTypeName,
    fullName: companyTypeFullName,
    info: companyTypes[companyType],
  }
}
