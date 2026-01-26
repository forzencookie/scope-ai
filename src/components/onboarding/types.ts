import type { LucideIcon } from "lucide-react"
import type { CompanyType } from "@/lib/company-types"

// ============================================================================
// Onboarding Types
// ============================================================================

export interface OnboardingField {
  label: string
  placeholder: string
  value?: string
}

export interface OnboardingAction {
  label: string
  href: string
  external?: boolean
}

export interface OnboardingIntegration {
  name: string
  logo: string
  popular?: boolean
}

export interface OnboardingOption {
  label: string
  description: string
}

export interface OnboardingRole {
  role: string
  description: string
}

export interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: LucideIcon | React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  
  // Optional properties for different step types
  optional?: boolean
  existingOnly?: boolean // Only show for existing company mode
  companyTypes?: CompanyType[] // Only show for specific company types
  
  // Step-specific content flags
  hasOnboardingMode?: boolean
  hasCompanyTypeSelector?: boolean
  hasShareStructure?: boolean
  hasShareholders?: boolean
  hasPartners?: boolean
  hasSIEImport?: boolean
  
  // Step-specific data
  fields?: OnboardingField[]
  action?: OnboardingAction
  integrations?: OnboardingIntegration[]
  moreBanks?: OnboardingIntegration[]
  options?: OnboardingOption[]
  roles?: OnboardingRole[]
}

export interface OnboardingWizardProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export interface StepRendererProps {
  step: OnboardingStep
  onNext: () => void
  onSkip?: () => void
}
