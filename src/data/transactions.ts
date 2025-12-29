// ============================================
// Transactions Types & Constants
// PRODUCTION: No mock data - types only
// ============================================

// Re-export types from the canonical source
export type { Transaction, AISuggestion, TransactionWithAI } from "@/types"
export { TRANSACTION_STATUSES } from "@/types"
export type { TransactionStatus } from "@/types"

// ============================================
// Account Categories for Filtering
// ============================================

export const accountCategories = [
  "Företagskonto",
  "Företagskort",
  "Huvudkonto",
  "Sparkonto",
] as const

export const transactionCategories = [
  "Programvara",
  "Material",
  "Resor",
  "Intäkter",
  "Representation",
  "Lokalhyra",
  "IT & Programvara",
  "Kontorsmaterial",
] as const

// ============================================
// Icon Mapping (for reference)
// ============================================

export const transactionIconMap = {
  Building2: "Building2",
  Coffee: "Coffee",
  Smartphone: "Smartphone",
  Plane: "Plane",
  Briefcase: "Briefcase",
  Tag: "Tag",
  User: "User",
} as const
