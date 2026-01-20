// ============================================
// Core Types - Centralized Type Definitions
// Single source of truth for all application types
// ============================================

import { LucideIcon } from "lucide-react"
import { parseAmount, parseDateSafe } from "@/lib/utils"

// ============================================
// Database Types (Supabase)
// Re-export for convenience - run `npm run db:types` to update
// ============================================

export type { Database, Json } from "./database"
export type { Tables, TablesInsert, TablesUpdate } from "./database"

// Convenient table row types
import type { Tables } from "./database"
export type DbUser = Tables<"users">
export type DbTransaction = Tables<"transactions">
export type DbReceipt = Tables<"receipts">
export type DbCategory = Tables<"categories">
export type DbTaxReport = Tables<"tax_reports">
export type DbAiLog = Tables<"ai_logs">

// ============================================
// Bank Types (Simulator → Bank → Dashboard flow)
// ============================================

export type {
  NakedBankTransaction,
  EnrichedTransaction,
  TransactionCategory,
  BankAccountType,
  BankAccountInfo,
} from "./bank"
export { categoryMeta, bankAccountMeta } from "./bank"

// Re-export status types from the existing status-types module
export type {
  TransactionStatus,
  InvoiceStatus,
  ReceiptStatus,
  StatusVariant,
  AppStatus,
} from "@/lib/status-types"

// Re-export company types
export type {
  CompanyType,
  FeatureKey,
  CompanyTypeInfo,
  FeatureInfo,
} from "@/lib/company-types"

// Import FeatureKey for use in this file
import type { FeatureKey } from "@/lib/company-types"

// Re-export status constants for convenience
export {
  TRANSACTION_STATUSES,
  INVOICE_STATUSES,
  RECEIPT_STATUSES,
} from "@/lib/status-types"

// ============================================
// User & Team Types
// ============================================

export interface User {
  id: string
  name: string
  email: string
  avatar: string
  plan: "Free" | "Pro" | "Max"
}

export interface Team {
  id: string
  name: string
  logo: LucideIcon
  plan: "Free" | "Pro" | "Max"
  companyType: CompanyType
}

// ============================================
// Navigation Types
// ============================================

export interface NavItem {
  title: string
  titleEnkel?: string  // Easy mode label
  url: string
  icon?: LucideIcon
  isActive?: boolean
  muted?: boolean  // Lower opacity styling
  featureKey?: FeatureKey
  items?: NavSubItem[]
}

export interface NavSubItem {
  title: string
  titleEnkel?: string  // Easy mode label
  url: string
  featureKey?: FeatureKey
}

export interface NavigationData {
  navPlatform: NavItem[]
  navSettings: NavItem[]
}

// ============================================
// Dashboard Types
// ============================================

export interface QuickStat {
  id: string
  label: string
  value: string
  change: string
  positive: boolean | null
  href: string
}

export interface PendingTask {
  id: string
  title: string
  href: string
  priority?: "low" | "medium" | "high"
  dueDate?: string
}

export interface RecentActivity {
  id: string
  action: string
  item: string
  time: string
  timestamp: Date
}

export interface QuickLink {
  id: string
  label: string
  href: string
  icon?: LucideIcon
}

export interface DashboardData {
  quickStats: QuickStat[]
  pendingTasks: PendingTask[]
  recentActivity: RecentActivity[]
  quickLinks: QuickLink[]
}

// ============================================
// Inbox Types
// ============================================

export type InboxCategory = "skatt" | "myndighet" | "faktura" | "kvitto" | "leverantorsfaktura" | "annat" | "other"

export interface InboxItem {
  id: string
  sender: string
  title: string
  description: string
  date: string
  timestamp: Date
  category: InboxCategory
  read: boolean
  starred: boolean
  attachments?: string[]
}

export type InboxFilter = "all" | "unread" | "starred"

// ============================================
// Transaction Types
// Note: TransactionStatus is re-exported from @/lib/status-types at the top
// ============================================

import type { TransactionStatus } from "@/lib/status-types"

export interface Transaction {
  id: string
  name: string
  date: string
  timestamp: Date
  amount: string
  amountValue: number // Numeric value for calculations
  vatAmount?: number  // VAT amount in SEK (negative for expenses, positive for income)
  vatRate?: number    // VAT rate (25, 12, 6, or 0)
  status: TransactionStatus
  category: string
  iconName: string
  iconColor: string
  account: string
  description?: string
  attachments?: string[]
}

export interface AISuggestion {
  category: string
  account: string
  confidence: number // 0-100
  reasoning?: string
}

export interface TransactionWithAI extends Transaction {
  aiSuggestion?: AISuggestion
  isAIApproved?: boolean
}

// ============================================
// Report Types
// ============================================

export interface VATReport {
  id: string
  period: string
  dueDate: Date
  status: "pending" | "submitted" | "approved"
  amount: number
}

export interface FinancialSummary {
  revenue: number
  expenses: number
  profit: number
  taxLiability: number
  period: string
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  data: T
  success: boolean
  error?: string
  timestamp: Date
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// ============================================
// Filter & Sort Types
// ============================================

export interface TransactionFilters {
  status?: TransactionStatus[]
  category?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  amountRange?: {
    min: number
    max: number
  }
  account?: string[]
  searchQuery?: string
}

export type SortDirection = "asc" | "desc"

export interface SortConfig<T> {
  field: keyof T
  direction: SortDirection
}

// ============================================
// Invoice Types
// ============================================

import type { InvoiceStatus, ReceiptStatus } from "@/lib/status-types"

export interface Invoice {
  id: string
  invoiceNumber?: string
  customer: string
  email?: string
  issueDate: string
  dueDate: string
  amount: number       // Net amount (ex. VAT)
  vatAmount?: number   // VAT amount
  vatRate?: number     // VAT rate (25, 12, 6, 0)
  status: InvoiceStatus
}

// ============================================
// Receipt Types
// ============================================

export interface Receipt {
  id: string
  supplier: string
  date: string
  amount: string
  status: ReceiptStatus
  category: string
  attachment: string
}

// ============================================
// Simplified Transaction Type (for components that don't need all fields)
// ============================================

export interface SimpleTransaction {
  id: string
  name: string
  date: string
  amount: string
  status: TransactionStatus
  category: string
  iconName: string
  iconColor: string
  account: string
}

// Helper to convert SimpleTransaction to Transaction
export function toFullTransaction(simple: SimpleTransaction): Transaction {
  return {
    ...simple,
    timestamp: parseDateSafe(simple.date),
    amountValue: parseAmount(simple.amount),
  }
}
