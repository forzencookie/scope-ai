"use client"

// ============================================
// Company Provider
// React context for company type state
// ============================================

import * as React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"
import type { CompanyType, FeatureKey } from "@/lib/company-types"
import { hasFeature, companyTypes, getCompanyTypeFullName } from "@/lib/company-types"

// ============================================
// Types
// ============================================

interface CompanyInfo {
  // Basic info
  id: string
  name: string
  orgNumber: string
  companyType: CompanyType
  // Additional metadata
  registrationDate?: string
  address?: string
  city?: string
  zipCode?: string
  email?: string
  phone?: string
  vatNumber?: string
  contactPerson?: string
  // Payment details
  bankgiro?: string
  plusgiro?: string
  // Settings
  hasMomsRegistration: boolean
  hasEmployees: boolean
  fiscalYearEnd: string // MM-DD format, e.g., "12-31"
  accountingMethod: 'cash' | 'invoice'
  // Tax Settings (Onboarding-driven)
  vatFrequency: 'monthly' | 'quarterly' | 'annually'
  isCloselyHeld: boolean // Fåmansföretag - determines K10 applicability
  // Share Structure (AB only)
  shareCapital: number       // e.g., 25000 or 50000
  totalShares: number        // e.g., 500 or 1000
  shareClasses: { A: number; B: number }  // A-aktier, B-aktier
  // Member/Partner Settings (Förening/HB/KB)
  memberFee: number          // Annual member fee
  capitalContribution: number // Insats/capital contribution
  // Branding
  logoUrl?: string
  // Onboarding State
  onboardingMode: 'fresh' | 'existing'
  onboardingComplete: boolean
}

interface CompanyContextValue {
  // Current company
  company: CompanyInfo | null
  companyType: CompanyType
  isLoading: boolean

  // Actions
  setCompanyType: (type: CompanyType) => void
  setCompany: (company: CompanyInfo) => void
  updateCompany: (updates: Partial<CompanyInfo>) => void

  // Feature checks
  hasFeature: (feature: FeatureKey) => boolean

  // Helpers
  companyTypeName: string
  companyTypeFullName: string
}

// ============================================
// Default Values
// ============================================

const defaultCompany: CompanyInfo = {
  id: "",
  name: "",
  orgNumber: "",
  vatNumber: "",
  address: "",
  city: "",
  zipCode: "",
  email: "",
  phone: "",
  contactPerson: "",
  companyType: "ab",
  hasMomsRegistration: true,
  hasEmployees: false,
  fiscalYearEnd: "12-31",
  accountingMethod: "invoice",
  vatFrequency: "quarterly",
  isCloselyHeld: true,
  // Share Structure (AB defaults)
  shareCapital: 25000,
  totalShares: 500,
  shareClasses: { A: 0, B: 500 },
  // Member/Partner (Förening/HB/KB defaults)
  memberFee: 0,
  capitalContribution: 0,
  // Onboarding
  onboardingMode: "fresh",
  onboardingComplete: false,
}

// ============================================
// Context
// ============================================

const CompanyContext = createContext<CompanyContextValue | undefined>(undefined)

// Storage key for persisting company data
const STORAGE_KEY = "scope-ai-company"

// ============================================
// Provider Component
// ============================================

interface CompanyProviderProps {
  children: React.ReactNode
  initialCompanyType?: CompanyType
}

export function CompanyProvider({
  children,
  initialCompanyType = "ab"
}: CompanyProviderProps) {
  const [company, setCompanyState] = useState<CompanyInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // Load company from database first, then localStorage fallback
  useEffect(() => {
    async function loadCompany() {
      try {
        // Try to fetch from database
        const response = await fetch('/api/company')
        if (response.ok) {
          const data = await response.json()
          if (data.company) {
            // Map database format to local format
            const dbCompany: CompanyInfo = {
              id: data.company.id,
              name: data.company.name,
              orgNumber: data.company.orgNumber || '',
              companyType: data.company.companyType || 'ab',
              vatNumber: data.company.vatNumber || '',
              address: data.company.address || '',
              city: data.company.city || '',
              zipCode: data.company.zipCode || '',
              email: data.company.email || '',
              phone: data.company.phone || '',
              contactPerson: data.company.contactPerson || '',
              registrationDate: data.company.registrationDate,
              hasMomsRegistration: data.company.hasMomsRegistration ?? true,
              hasEmployees: data.company.hasEmployees ?? false,
              fiscalYearEnd: data.company.fiscalYearEnd || '12-31',
              accountingMethod: data.company.accountingMethod || 'invoice',
              vatFrequency: data.company.vatFrequency || 'quarterly',
              isCloselyHeld: data.company.isCloselyHeld ?? true,
              shareCapital: data.company.shareCapital ?? 25000,
              totalShares: data.company.totalShares ?? 500,
              shareClasses: { A: 0, B: data.company.totalShares ?? 500 },
              memberFee: 0,
              capitalContribution: 0,
              onboardingMode: 'existing',
              onboardingComplete: true,
            }
            setCompanyState(dbCompany)
            // Also update localStorage for offline access
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dbCompany))
            setIsLoading(false)
            return
          }
        }
      } catch (error) {
        console.warn('[CompanyProvider] Failed to fetch from database, using localStorage:', error)
      }

      // Fallback to localStorage
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as CompanyInfo
          setCompanyState(parsed)
        } else {
          // Use default with initial company type
          setCompanyState({
            ...defaultCompany,
            companyType: initialCompanyType,
          })
        }
      } catch (error) {
        console.error("Failed to load company data:", error)
        setCompanyState({
          ...defaultCompany,
          companyType: initialCompanyType,
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadCompany()
  }, [initialCompanyType])

  // Save company to localStorage immediately and database with debounce
  useEffect(() => {
    if (company && !isLoading) {
      // Always save to localStorage immediately
      localStorage.setItem(STORAGE_KEY, JSON.stringify(company))
      
      // Debounce database save to avoid too many API calls
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      
      saveTimeoutRef.current = setTimeout(async () => {
        setIsSaving(true)
        try {
          await fetch('/api/company', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: company.name,
              orgNumber: company.orgNumber,
              companyType: company.companyType,
              vatNumber: company.vatNumber,
              address: company.address,
              city: company.city,
              zipCode: company.zipCode,
              email: company.email,
              phone: company.phone,
              contactPerson: company.contactPerson,
              registrationDate: company.registrationDate,
              fiscalYearEnd: company.fiscalYearEnd,
              accountingMethod: company.accountingMethod,
              vatFrequency: company.vatFrequency,
              isCloselyHeld: company.isCloselyHeld,
              hasEmployees: company.hasEmployees,
              hasMomsRegistration: company.hasMomsRegistration,
              shareCapital: company.shareCapital,
              totalShares: company.totalShares,
            }),
          })
        } catch (error) {
          console.error('[CompanyProvider] Failed to save to database:', error)
        } finally {
          setIsSaving(false)
        }
      }, 1000) // 1 second debounce
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [company, isLoading])

  // Get current company type (fallback to 'ab')
  const companyType = company?.companyType ?? "ab"

  // Set just the company type with smart defaults
  const setCompanyType = useCallback((type: CompanyType) => {
    setCompanyState(prev => {
      // Smart default: EF usually uses Cash method, AB usually uses Invoice method
      // But smaller ABs can use Cash. For safety/standard, default AB to Invoice, EF to Cash.
      const defaultMethod = type === 'ef' ? 'cash' : 'invoice'

      if (!prev) {
        return {
          ...defaultCompany,
          companyType: type,
          accountingMethod: defaultMethod
        }
      }
      return {
        ...prev,
        companyType: type,
        accountingMethod: defaultMethod
      }
    })
  }, [])

  // Set entire company object
  const setCompany = useCallback((newCompany: CompanyInfo) => {
    setCompanyState(newCompany)
  }, [])

  // Update partial company data
  const updateCompany = useCallback((updates: Partial<CompanyInfo>) => {
    setCompanyState(prev => {
      if (!prev) {
        return { ...defaultCompany, ...updates }
      }
      return { ...prev, ...updates }
    })
  }, [])

  // Check if current company type has a feature
  const checkFeature = useCallback((feature: FeatureKey): boolean => {
    // Special cases for conditional features
    if (feature === "momsdeklaration" && company && !company.hasMomsRegistration) {
      return false
    }
    if ((feature === "lonebesked" || feature === "agi") && company && !company.hasEmployees) {
      // Still show for AB (owner can be employee)
      if (companyType !== "ab") {
        return false
      }
    }
    return hasFeature(companyType, feature)
  }, [company, companyType])

  // Computed values
  const companyTypeName = companyTypes[companyType].name
  const companyTypeFullName = getCompanyTypeFullName(companyType)

  const value = useMemo<CompanyContextValue>(() => ({
    company,
    companyType,
    isLoading,
    setCompanyType,
    setCompany,
    updateCompany,
    hasFeature: checkFeature,
    companyTypeName,
    companyTypeFullName,
  }), [company, companyType, isLoading, setCompanyType, setCompany, updateCompany, checkFeature, companyTypeName, companyTypeFullName])

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  )
}

// ============================================
// Hook
// ============================================

export function useCompany(): CompanyContextValue {
  const context = useContext(CompanyContext)
  if (context === undefined) {
    throw new Error("useCompany must be used within a CompanyProvider")
  }
  return context
}

// ============================================
// Optional: Hook for just checking features
// ============================================

export function useFeature(feature: FeatureKey): boolean {
  const { hasFeature } = useCompany()
  return hasFeature(feature)
}

// ============================================
// Optional: Hook for getting company type info
// ============================================

export function useCompanyType() {
  const { companyType, companyTypeName, companyTypeFullName } = useCompany()
  return {
    type: companyType,
    name: companyTypeName,
    fullName: companyTypeFullName,
    info: companyTypes[companyType],
  }
}
