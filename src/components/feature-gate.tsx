"use client"

// ============================================
// Feature Gate Component
// Conditionally render content based on company type features
// ============================================

import * as React from "react"
import { useCompany } from "@/providers/company-provider"
import type { FeatureKey, CompanyType } from "@/lib/company-types"

// ============================================
// FeatureGate - Show/hide based on feature access
// ============================================

interface FeatureGateProps {
  /** The feature key to check */
  feature: FeatureKey
  /** Content to show if feature is available */
  children: React.ReactNode
  /** Optional fallback if feature is not available */
  fallback?: React.ReactNode
}

/**
 * Conditionally render children based on whether the current
 * company type has access to a specific feature.
 * 
 * @example
 * ```tsx
 * <FeatureGate feature="aktiebok">
 *   <AktiebokComponent />
 * </FeatureGate>
 * 
 * <FeatureGate feature="utdelning" fallback={<p>Inte tillgängligt</p>}>
 *   <UtdelningComponent />
 * </FeatureGate>
 * ```
 */
export function FeatureGate({ feature, children, fallback = null }: FeatureGateProps) {
  const { hasFeature, isLoading } = useCompany()

  // Don't render anything while loading to prevent flash
  if (isLoading) {
    return null
  }

  if (hasFeature(feature)) {
    return <>{children}</>
  }

  return <>{fallback}</>
}

// ============================================
// CompanyTypeGate - Show/hide based on company type
// ============================================

interface CompanyTypeGateProps {
  /** Company type(s) that can see this content */
  types: CompanyType | CompanyType[]
  /** Content to show if company type matches */
  children: React.ReactNode
  /** Optional fallback if company type doesn't match */
  fallback?: React.ReactNode
}

/**
 * Conditionally render children based on company type.
 * 
 * @example
 * ```tsx
 * <CompanyTypeGate types="ab">
 *   <p>Only for Aktiebolag</p>
 * </CompanyTypeGate>
 * 
 * <CompanyTypeGate types={["hb", "kb"]}>
 *   <p>For Handelsbolag and Kommanditbolag</p>
 * </CompanyTypeGate>
 * ```
 */
export function CompanyTypeGate({ types, children, fallback = null }: CompanyTypeGateProps) {
  const { companyType, isLoading } = useCompany()

  if (isLoading) {
    return null
  }

  const allowedTypes = Array.isArray(types) ? types : [types]
  
  if (allowedTypes.includes(companyType)) {
    return <>{children}</>
  }

  return <>{fallback}</>
}

// ============================================
// FeatureSwitch - Render different content per company type
// ============================================

interface FeatureSwitchProps {
  /** Content for Aktiebolag */
  ab?: React.ReactNode
  /** Content for Enskild Firma */
  ef?: React.ReactNode
  /** Content for Handelsbolag */
  hb?: React.ReactNode
  /** Content for Kommanditbolag */
  kb?: React.ReactNode
  /** Content for Ideell Förening */
  forening?: React.ReactNode
  /** Default content if no match */
  default?: React.ReactNode
}

/**
 * Render different content based on company type.
 * Useful for adaptive components that change significantly per type.
 * 
 * @example
 * ```tsx
 * <FeatureSwitch
 *   ab={<Årsredovisning variant="K2" />}
 *   ef={<FörenklatÅrsbokslut />}
 *   hb={<FörenklatÅrsbokslut />}
 *   kb={<FörenklatÅrsbokslut />}
 *   forening={<FörenklatÅrsbokslut />}
 * />
 * ```
 */
export function FeatureSwitch({ ab, ef, hb, kb, forening, default: defaultContent }: FeatureSwitchProps) {
  const { companyType, isLoading } = useCompany()

  if (isLoading) {
    return null
  }

  switch (companyType) {
    case "ab":
      return <>{ab ?? defaultContent}</>
    case "ef":
      return <>{ef ?? defaultContent}</>
    case "hb":
      return <>{hb ?? defaultContent}</>
    case "kb":
      return <>{kb ?? defaultContent}</>
    case "forening":
      return <>{forening ?? defaultContent}</>
    default:
      return <>{defaultContent}</>
  }
}

// ============================================
// useFeatureList - Get filtered list of features
// ============================================

/**
 * Hook to filter a list of items based on feature access.
 * Useful for navigation items, tabs, etc.
 * 
 * @example
 * ```tsx
 * const tabs = [
 *   { id: "utdelning", label: "Utdelning", feature: "utdelning" },
 *   { id: "egenavgifter", label: "Egenavgifter", feature: "egenavgifter" },
 * ]
 * 
 * const visibleTabs = useFeatureList(tabs, item => item.feature)
 * ```
 */
export function useFeatureList<T>(
  items: T[],
  getFeature: (item: T) => FeatureKey | undefined
): T[] {
  const { hasFeature } = useCompany()
  
  return items.filter(item => {
    const feature = getFeature(item)
    // If no feature specified, always show
    if (!feature) return true
    return hasFeature(feature)
  })
}

// ============================================
// withFeature - HOC for feature-gating components
// ============================================

/**
 * Higher-order component to gate a component by feature.
 * 
 * @example
 * ```tsx
 * const ProtectedAktiebok = withFeature(AktiebokComponent, "aktiebok")
 * ```
 */
export function withFeature<P extends object>(
  Component: React.ComponentType<P>,
  feature: FeatureKey,
  Fallback?: React.ComponentType<P>
): React.FC<P> {
  return function FeatureGatedComponent(props: P) {
    const { hasFeature, isLoading } = useCompany()

    if (isLoading) {
      return null
    }

    if (hasFeature(feature)) {
      return <Component {...props} />
    }

    if (Fallback) {
      return <Fallback {...props} />
    }

    return null
  }
}
