// ============================================
// Transactions Mock Data
// Single source of truth for transaction mock data
// ============================================
//
// IMPORTANT: This is the canonical location for transaction mock data.
// Do not create duplicate data sources elsewhere.
//
// For types: import from "@/types"
// For mock data: import from "@/data/transactions"
// For services: import from "@/services/transactions" or "@/services/transactions-supabase"
// ============================================

// Re-export types from the canonical source
export type { Transaction, AISuggestion, TransactionWithAI } from "@/types"
export { TRANSACTION_STATUSES } from "@/types"
export type { TransactionStatus } from "@/types"
import type { Transaction, AISuggestion, TransactionWithAI } from "@/types"
import { TRANSACTION_STATUS_LABELS } from "@/lib/localization"

// ============================================
// Base Transactions
// ============================================

export const mockTransactions: Transaction[] = [
  {
    id: "txn-1",
    name: "Figma Prenumeration",
    date: "2 maj 2024",
    timestamp: new Date("2024-05-02"),
    amount: "-490 kr",
    amountValue: -490.00,
    status: TRANSACTION_STATUS_LABELS.TO_RECORD,
    category: "Programvara",
    iconName: "Smartphone",
    iconColor: "text-blue-500",
    account: "Företagskonto",
  },
  {
    id: "txn-2",
    name: "Kontorsmaterial - Staples",
    date: "10 maj 2024",
    timestamp: new Date("2024-05-10"),
    amount: "-1 245 kr",
    amountValue: -1245.00,
    status: TRANSACTION_STATUS_LABELS.TO_RECORD,
    category: "Material",
    iconName: "Tag",
    iconColor: "text-orange-500",
    account: "Företagskonto",
  },
  {
    id: "txn-3",
    name: "SAS Flygresa",
    date: "15 maj 2024",
    timestamp: new Date("2024-05-15"),
    amount: "-4 500 kr",
    amountValue: -4500.00,
    status: TRANSACTION_STATUS_LABELS.MISSING_DOCUMENTATION,
    category: "Resor",
    iconName: "Plane",
    iconColor: "text-purple-500",
    account: "Företagskonto",
  },
  {
    id: "txn-4",
    name: "Kundbetalning - Acme AB",
    date: "7 maj 2024",
    timestamp: new Date("2024-05-07"),
    amount: "+45 000 kr",
    amountValue: 45000.00,
    status: TRANSACTION_STATUS_LABELS.RECORDED,
    category: "Intäkter",
    iconName: "Briefcase",
    iconColor: "text-green-500",
    account: "Huvudkonto",
  },
  {
    id: "txn-5",
    name: "Espresso House Möte",
    date: "12 maj 2024",
    timestamp: new Date("2024-05-12"),
    amount: "-142 kr",
    amountValue: -142.00,
    status: TRANSACTION_STATUS_LABELS.RECORDED,
    category: "Representation",
    iconName: "Coffee",
    iconColor: "text-amber-600",
    account: "Företagskort",
  },
  {
    id: "txn-6",
    name: "Kontorshyra Månad",
    date: "24 maj 2024",
    timestamp: new Date("2024-05-24"),
    amount: "-5 500 kr",
    amountValue: -5500.00,
    status: TRANSACTION_STATUS_LABELS.RECORDED,
    category: "Lokalhyra",
    iconName: "Building2",
    iconColor: "text-indigo-500",
    account: "Huvudkonto",
  },
  {
    id: "txn-7",
    name: "Konsultarvode",
    date: "27 maj 2024",
    timestamp: new Date("2024-05-27"),
    amount: "+21 000 kr",
    amountValue: 21000.00,
    status: TRANSACTION_STATUS_LABELS.RECORDED,
    category: "Intäkter",
    iconName: "Briefcase",
    iconColor: "text-green-500",
    account: "Huvudkonto",
  },
]

// ============================================
// AI Suggestions
// ============================================

export const mockAISuggestions: Record<string, AISuggestion> = {
  "txn-1": { 
    category: "IT & Programvara", 
    account: "5420", 
    confidence: 94,
    reasoning: "Månatlig prenumeration på designprogramvara",
  },
  "txn-2": { 
    category: "Kontorsmaterial", 
    account: "5410", 
    confidence: 88,
    reasoning: "Inköp av kontorsmaterial från känd leverantör",
  },
  "txn-3": { 
    category: "Resor", 
    account: "5800", 
    confidence: 96,
    reasoning: "Flygbokning för tjänsteresa",
  },
  "txn-4": { 
    category: "Intäkter", 
    account: "3040", 
    confidence: 99,
    reasoning: "Kundbetalning matchande faktura #1234",
  },
  "txn-5": { 
    category: "Representation", 
    account: "6072", 
    confidence: 72,
    reasoning: "Möteskostnad - kan kräva dokumentation",
  },
  "txn-6": { 
    category: "Lokalhyra", 
    account: "5010", 
    confidence: 91,
    reasoning: "Månatlig hyra för kontorslokal",
  },
  "txn-7": { 
    category: "Intäkter", 
    account: "3040", 
    confidence: 89,
    reasoning: "Konsultintäkt",
  },
}

// ============================================
// Transactions with AI Suggestions Combined
// ============================================

export const mockTransactionsWithAI: TransactionWithAI[] = mockTransactions.map(txn => ({
  ...txn,
  aiSuggestion: mockAISuggestions[txn.id],
  isAIApproved: false,
}))

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

// ============================================
// Backward Compatibility Aliases
// ============================================

/**
 * @deprecated Use mockTransactions instead. This alias exists for backward compatibility.
 */
export const allTransactions = mockTransactions
