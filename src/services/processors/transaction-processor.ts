/**
 * Transaction Processor Service
 * 
 * Takes NAKED transactions (raw bank data) and "clothes" them:
 * - Adds display properties (icons, colors)
 * - Adds status
 * - Runs AI categorization
 * 
 * This is NOT AI - this is deterministic logic.
 * AI is only used for category/account SUGGESTIONS.
 */

import type { TransactionWithAI, TransactionStatus, AISuggestion } from "@/types"
import { TRANSACTION_STATUSES } from "@/lib/status-types"

// ============================================================================
// Types
// ============================================================================

/**
 * Raw transaction from bank - "naked" with only essential data
 */
export interface NakedTransaction {
  id: string
  name: string              // "SPOTIFY AB" - raw from bank
  amount: number            // -149.00 - raw amount
  date: string              // "2025-12-12" - ISO date
  account?: string          // Bank account name
  reference?: string        // OCR/reference number
  counterparty?: string     // Other party's account
}

/**
 * AI categorization suggestion
 * Re-exported for consumers who need the type
 */
export type AICategorization = AISuggestion

/**
 * Fully processed transaction ready for display
 * Extends TransactionWithAI which already has aiSuggestion optional field
 */
export type ProcessedTransaction = TransactionWithAI

// ============================================================================
// Icon & Color Mapping (Deterministic - NOT AI)
// ============================================================================

/**
 * Get icon based on transaction characteristics
 * This is simple pattern matching, not AI
 */
function getTransactionIcon(name: string, amount: number): { iconName: string; iconColor: string } {
  const upperName = name.toUpperCase()
  
  // Income (positive amount)
  if (amount > 0) {
    return { iconName: "Briefcase", iconColor: "text-green-500" }
  }
  
  // Pattern matching for common vendors
  if (upperName.includes("SPOTIFY") || upperName.includes("NETFLIX") || upperName.includes("ADOBE") || upperName.includes("MICROSOFT") || upperName.includes("GOOGLE") || upperName.includes("FIGMA") || upperName.includes("SLACK") || upperName.includes("DROPBOX")) {
    return { iconName: "Smartphone", iconColor: "text-blue-500" }
  }
  
  if (upperName.includes("SAS") || upperName.includes("SJ ") || upperName.includes("UBER") || upperName.includes("TAXI") || upperName.includes("FLYGRESA") || upperName.includes("HOTELS") || upperName.includes("SCANDIC")) {
    return { iconName: "Plane", iconColor: "text-purple-500" }
  }
  
  if (upperName.includes("ESPRESSO") || upperName.includes("STARBUCKS") || upperName.includes("CAFÉ") || upperName.includes("COFFEE") || upperName.includes("FIKA") || upperName.includes("WAYNE")) {
    return { iconName: "Coffee", iconColor: "text-amber-500" }
  }
  
  if (upperName.includes("ICA") || upperName.includes("COOP") || upperName.includes("HEMKÖP") || upperName.includes("WILLYS") || upperName.includes("RESTAURANG") || upperName.includes("MAX ") || upperName.includes("MCDONALDS")) {
    return { iconName: "Building2", iconColor: "text-orange-500" }
  }
  
  if (upperName.includes("BENSIN") || upperName.includes("CIRCLE K") || upperName.includes("PREEM") || upperName.includes("SHELL") || upperName.includes("OKQ8")) {
    return { iconName: "Car", iconColor: "text-gray-500" }
  }
  
  if (upperName.includes("TELIA") || upperName.includes("TELENOR") || upperName.includes("TRE ") || upperName.includes("COMVIQ")) {
    return { iconName: "Phone", iconColor: "text-indigo-500" }
  }
  
  if (upperName.includes("STAPLES") || upperName.includes("CLAS OHLSON") || upperName.includes("IKEA") || upperName.includes("KONTORS")) {
    return { iconName: "Tag", iconColor: "text-orange-500" }
  }
  
  // Default for expenses
  return { iconName: "CreditCard", iconColor: "text-red-500" }
}

/**
 * Get initial status for a transaction
 */
function getInitialStatus(): TransactionStatus {
  return TRANSACTION_STATUSES.TO_RECORD as TransactionStatus
}

// ============================================================================
// AI Categorization (Simulated - would be real ML in production)
// ============================================================================

/**
 * AI-powered categorization suggestion
 * In production, this would call an ML model or API
 * For now, uses pattern matching as a simulation
 */
export function getAICategorization(name: string, amount: number): AICategorization {
  const upperName = name.toUpperCase()
  
  // Income
  if (amount > 0) {
    return {
      category: "Intäkter",
      account: "3010",
      confidence: 95,
      reasoning: "Positivt belopp indikerar inkomst"
    }
  }
  
  // Software/Subscriptions - high confidence
  if (upperName.includes("SPOTIFY") || upperName.includes("NETFLIX") || upperName.includes("ADOBE") || upperName.includes("MICROSOFT") || upperName.includes("GOOGLE") || upperName.includes("FIGMA") || upperName.includes("SLACK") || upperName.includes("DROPBOX")) {
    return {
      category: "Programvara",
      account: "6540",
      confidence: 94,
      reasoning: "Känd programvaruleverantör"
    }
  }
  
  // Travel - medium-high confidence
  if (upperName.includes("SAS") || upperName.includes("SJ ") || upperName.includes("FLYGRESA")) {
    return {
      category: "Resor",
      account: "5800",
      confidence: 88,
      reasoning: "Transportbolag identifierat"
    }
  }
  
  if (upperName.includes("SCANDIC") || upperName.includes("HOTELS") || upperName.includes("NORDIC CHOICE")) {
    return {
      category: "Logi",
      account: "5810",
      confidence: 85,
      reasoning: "Hotellbokning identifierad"
    }
  }
  
  if (upperName.includes("UBER") || upperName.includes("TAXI") || upperName.includes("BOLT")) {
    return {
      category: "Resor",
      account: "5800",
      confidence: 80,
      reasoning: "Taxitjänst identifierad"
    }
  }
  
  // Food & Representation - lower confidence (could be personal or business)
  if (upperName.includes("ESPRESSO") || upperName.includes("STARBUCKS") || upperName.includes("COFFEE") || upperName.includes("WAYNE") || upperName.includes("CAFÉ")) {
    return {
      category: "Representation",
      account: "6072",
      confidence: 65,
      reasoning: "Möjlig representation - verifiera med kvitto"
    }
  }
  
  if (upperName.includes("RESTAURANG") || upperName.includes("MAX ") || upperName.includes("MCDONALDS") || upperName.includes("BASTARD")) {
    return {
      category: "Representation",
      account: "6072",
      confidence: 60,
      reasoning: "Restaurang - kan vara representation eller privat"
    }
  }
  
  // Groceries - very low confidence (usually not business expense)
  if (upperName.includes("ICA") || upperName.includes("COOP") || upperName.includes("HEMKÖP") || upperName.includes("WILLYS")) {
    return {
      category: "Representation",
      account: "6072",
      confidence: 40,
      reasoning: "Livsmedelsbutik - sannolikt privat, verifiera"
    }
  }
  
  // Fuel - medium confidence
  if (upperName.includes("BENSIN") || upperName.includes("CIRCLE K") || upperName.includes("PREEM") || upperName.includes("SHELL") || upperName.includes("OKQ8")) {
    return {
      category: "Drivmedel",
      account: "5611",
      confidence: 70,
      reasoning: "Bränsle - verifiera om tjänsterelaterat"
    }
  }
  
  // Phone/Telecom - high confidence
  if (upperName.includes("TELIA") || upperName.includes("TELENOR") || upperName.includes("TRE ") || upperName.includes("COMVIQ")) {
    return {
      category: "Telefon",
      account: "6212",
      confidence: 88,
      reasoning: "Telekomoperatör identifierad"
    }
  }
  
  // Office supplies - medium confidence
  if (upperName.includes("STAPLES") || upperName.includes("CLAS OHLSON") || upperName.includes("KONTORS")) {
    return {
      category: "Kontorsmaterial",
      account: "6110",
      confidence: 75,
      reasoning: "Troligt kontorsmaterial"
    }
  }
  
  if (upperName.includes("IKEA")) {
    return {
      category: "Inventarier",
      account: "5410",
      confidence: 65,
      reasoning: "IKEA - kan vara kontor eller privat"
    }
  }
  
  // Utilities
  if (upperName.includes("VATTENFALL") || upperName.includes("EON") || upperName.includes("FORTUM")) {
    return {
      category: "El",
      account: "5020",
      confidence: 85,
      reasoning: "Elleverantör identifierad"
    }
  }
  
  if (upperName.includes("FÖRSÄKRING") || upperName.includes("IF ") || upperName.includes("TRYGG HANSA") || upperName.includes("LÄNSFÖRSÄKRING")) {
    return {
      category: "Försäkringar",
      account: "6310",
      confidence: 82,
      reasoning: "Försäkringsbolag identifierat"
    }
  }
  
  // Default - low confidence, needs human review
  return {
    category: "Övriga kostnader",
    account: "6990",
    confidence: 30,
    reasoning: "Okänd leverantör - manuell granskning krävs"
  }
}

// ============================================================================
// Main Processor Function
// ============================================================================

/**
 * Process a naked transaction into a fully clothed, display-ready transaction
 */
export function processTransaction(naked: NakedTransaction): ProcessedTransaction {
  const { iconName, iconColor } = getTransactionIcon(naked.name, naked.amount)
  const aiSuggestion = getAICategorization(naked.name, naked.amount)
  
  // Format the amount for display
  const formattedAmount = new Intl.NumberFormat('sv-SE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(naked.amount))
  const amountString = `${naked.amount < 0 ? '-' : '+'}${formattedAmount} kr`
  
  // Format date for display
  const dateObj = new Date(naked.date)
  const formattedDate = dateObj.toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
  
  return {
    id: naked.id,
    name: naked.name,
    date: formattedDate,
    timestamp: dateObj,
    amount: amountString,
    amountValue: naked.amount,
    status: getInitialStatus(),
    category: aiSuggestion.category, // AI suggested, user can change
    iconName,
    iconColor,
    account: naked.account || "Företagskonto",
    aiSuggestion,
  }
}

/**
 * Process multiple naked transactions
 */
export function processTransactions(naked: NakedTransaction[]): ProcessedTransaction[] {
  return naked.map(processTransaction)
}
