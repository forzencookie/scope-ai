"use client"

// ============================================
// Company Provider
// React context for company type state
// ============================================

import * as React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
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
  // Settings
  hasMomsRegistration: boolean
  hasEmployees: boolean
  fiscalYearEnd: string // MM-DD format, e.g., "12-31"
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
  id: "demo-company",
  name: "Mitt Företag",
  orgNumber: "559123-4567",
  companyType: "ab",
  hasMomsRegistration: true,
  hasEmployees: true,
  fiscalYearEnd: "12-31",
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

  // Load company from localStorage on mount
  useEffect(() => {
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
  }, [initialCompanyType])

  // Save company to localStorage when it changes
  useEffect(() => {
    if (company && !isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(company))
    }
  }, [company, isLoading])

  // Get current company type (fallback to 'ab')
  const companyType = company?.companyType ?? "ab"

  // Set just the company type
  const setCompanyType = useCallback((type: CompanyType) => {
    setCompanyState(prev => {
      if (!prev) {
        return { ...defaultCompany, companyType: type }
      }
      return { ...prev, companyType: type }
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

  const value: CompanyContextValue = {
    company,
    companyType,
    isLoading,
    setCompanyType,
    setCompany,
    updateCompany,
    hasFeature: checkFeature,
    companyTypeName,
    companyTypeFullName,
  }

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
