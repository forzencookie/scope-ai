import { z } from "zod"

/**
 * AI Display Schemas — The "Deterministic Bridge"
 * 
 * These schemas validate and NORMALIZE stochastic AI output 
 * into strict, predictable types for the UI.
 * 
 * "AI guesses the data, Zod ensures the UI never has to."
 */

// =============================================================================
// 1. Receipt Normalization
// =============================================================================

export const ReceiptSchema = z.object({
    id: z.string().optional(),
    vendor: z.string().default("Okänd leverantör"),
    amount: z.coerce.number().default(0),
    date: z.string().default(() => new Date().toISOString().split('T')[0]),
    category: z.string().default("Övrigt"),
    description: z.string().optional(),
    vat: z.coerce.number().optional(),
})

export type Receipt = z.infer<typeof ReceiptSchema>

// =============================================================================
// 2. Transaction Normalization
// =============================================================================

export const TransactionSchema = z.object({
    id: z.string().optional(),
    description: z.string().default("Ny transaktion"),
    amount: z.coerce.number().default(0),
    date: z.string().default(() => new Date().toISOString().split('T')[0]),
    account: z.string().default("1930"), // Default to Bank
    type: z.enum(["income", "expense"]).optional().default("expense"),
}).transform((data) => ({
    ...data,
    // Infer type from amount if not provided
    type: (data.type || (data.amount > 0 ? "income" : "expense")) as "income" | "expense",
}))

export type Transaction = z.infer<typeof TransactionSchema>

// =============================================================================
// 3. Task Normalization
// =============================================================================

export const TaskSchema = z.object({
    id: z.string().default(() => Math.random().toString(36).substring(7)),
    label: z.string(),
    completed: z.boolean().default(false),
})

export const TaskChecklistSchema = z.object({
    title: z.string().default("Uppgifter"),
    tasks: z.array(TaskSchema).default([]),
})

export type TaskChecklist = z.infer<typeof TaskChecklistSchema>

// =============================================================================
// 4. Benefit Normalization
// =============================================================================

export const BenefitItemSchema = z.object({
    id: z.string().optional(),
    name: z.string().default("Förmån"),
    category: z.string().default("Övrigt"),
    amount: z.coerce.number().optional(),
})

export const BenefitsTableSchema = z.object({
    benefits: z.array(BenefitItemSchema).default([]),
})

export type BenefitsTable = z.infer<typeof BenefitsTableSchema>

// =============================================================================
// 5. Activity Normalization
// =============================================================================


export const ActivitySummarySchema = z.object({
    period: z.string().default("senaste månaden"),
    totalEvents: z.number().default(0),
    bySource: z.record(z.string(), z.number()).default({}),
    byType: z.record(z.string(), z.number()).default({}),
    highlights: z.array(z.string()).default([]),
})

export type ActivitySummary = z.infer<typeof ActivitySummarySchema>

// =============================================================================
// 6. AI Usage Normalization
// =============================================================================

export const AIUsageStatusSchema = z.object({
    tokensUsed: z.number().default(0),
    tokenLimit: z.number().default(0),
    extraCredits: z.number().default(0),
    totalAvailable: z.number().default(0),
    usagePercent: z.number().default(0),
    thresholdLevel: z.enum(['ok', 'moderate', 'high', 'critical', 'exceeded']).default('ok'),
    shouldShowReminder: z.boolean().default(false),
    reminderMessage: z.string().optional(),
})

export type AIUsageStatus = z.infer<typeof AIUsageStatusSchema>

// =============================================================================
// 7. Audit Normalization
// =============================================================================

export const AuditIssueSchema = z.object({
    id: z.string(),
    type: z.enum(['warning', 'error', 'info']),
    title: z.string(),
    description: z.string(),
    details: z.string().optional(),
})

export const BalanceAuditSchema = z.object({
    timestamp: z.string(),
    accountCount: z.number(),
    issues: z.array(AuditIssueSchema).default([]),
    summary: z.string(),
})

export type BalanceAudit = z.infer<typeof BalanceAuditSchema>

export const IncomeAuditSchema = z.object({
    timestamp: z.string(),
    period: z.string(),
    issues: z.array(AuditIssueSchema).default([]),
    summary: z.string(),
    metrics: z.record(z.string(), z.number()).default({}),
})

export type IncomeAudit = z.infer<typeof IncomeAuditSchema>

// =============================================================================
// 8. Comparison Normalization
// =============================================================================

export const ComparisonRowSchema = z.object({
    label: z.string(),
    before: z.string().default('—'),
    after: z.string().default('—'),
})

export const ComparisonTableSchema = z.object({
    title: z.string().default("Jämförelse"),
    rows: z.array(ComparisonRowSchema).default([]),
})

export type ComparisonTable = z.infer<typeof ComparisonTableSchema>

// =============================================================================
// 9. Company Settings Normalization
// =============================================================================

/**
 * IMPORTANT — Scope boundary:
 * This schema represents the COMPANY entity (the `companies` DB table).
 * It has NOTHING to do with the user's own Konto (profile).
 *
 * - `email`         → The company's public contact email (e.g. info@bolaget.se),
 *                     NOT the user's Supabase auth email.
 * - `contactPerson` → A named contact person at the company (e.g. a CEO or
 *                     office manager), NOT the authenticated user's name.
 *
 * If Scooby is answering questions about "the user's name/email", those fields
 * live on `UserProfile` in settings-service.ts, not here.
 */
export const CompanySettingsSchema = z.object({
    name: z.string().min(1),
    orgNumber: z.string(),
    companyType: z.enum(['ab', 'ef', 'hb', 'kb', 'forening']).default('ef'),
    vatNumber: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    zipCode: z.string().optional(),
    /** Company public contact email — NOT the user's auth/login email */
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    /** Named contact person at the company — NOT the authenticated user */
    contactPerson: z.string().optional(),
    registrationDate: z.string().optional(),
    fiscalYearEnd: z.string().default("12-31"),
    accountingMethod: z.enum(['cash', 'invoice']).default("invoice"),
    vatFrequency: z.enum(['monthly', 'quarterly', 'annually']).default("quarterly"),
    isCloselyHeld: z.boolean().default(true),
    hasEmployees: z.boolean().default(false),
    hasMomsRegistration: z.boolean().default(true),
    hasFskatt: z.boolean().default(true),
    shareCapital: z.number().optional(),
    totalShares: z.number().optional(),
})

export type CompanySettings = z.infer<typeof CompanySettingsSchema>

// =============================================================================
// 10. User Memory Normalization
// =============================================================================

export const MemoryCategorySchema = z.enum(['decision', 'preference', 'pending'])
export type MemoryCategory = z.infer<typeof MemoryCategorySchema>

export const UserMemorySchema = z.object({
    id: z.string(),
    companyId: z.string(),
    content: z.string(),
    category: MemoryCategorySchema,
    confidence: z.number().nullable().default(1.0),
    supersededBy: z.string().nullable().default(null),
    sourceMessageId: z.string().nullable().default(null),
    createdAt: z.string().nullable().default(null),
    updatedAt: z.string().nullable().default(null),
})

export type UserMemory = z.infer<typeof UserMemorySchema>

// =============================================================================
// 10. Tool Discovery Normalization
// =============================================================================

export const DiscoveredToolSchema = z.object({
    name: z.string(),
    description: z.string(),
    domain: z.string().optional(),
})

export const DiscoveredToolsSchema = z.array(DiscoveredToolSchema)

export type DiscoveredTool = z.infer<typeof DiscoveredToolSchema>

// =============================================================================
// Global Normalizer
// =============================================================================

/**
 * Normalizes any incoming "display" data from AI into a strictly typed structure.
 * This is the ONLY place where "guessing" or "defaulting" happens.
 * 
 * STRICT MANDATE: Never return raw data as a fallback.
 */
export function normalizeAIDisplay(type: string, data: unknown): unknown {
    if (!data) {
        throw new Error(`[Normalization] Missing data for type: ${type}`);
    }

    // Handle AI sometimes wrapping data in a key (e.g., { receipt: {...} } vs {...})
    const record = (typeof data === 'object' && !Array.isArray(data)) ? data as Record<string, unknown> : null
    const unwrapped = record
        ? (record[type.toLowerCase().replace('card', '')] || data)
        : data;

    try {
        switch (type) {
            case 'ReceiptCard':
                return ReceiptSchema.parse(unwrapped);
            case 'TransactionCard':
                return TransactionSchema.parse(unwrapped);
            case 'TaskChecklist':
                return TaskChecklistSchema.parse(unwrapped);
            case 'BenefitsTable':
                return BenefitsTableSchema.parse(unwrapped);
            case 'ComparisonTable':
                return ComparisonTableSchema.parse(unwrapped);
            case 'DiscoveredTools':
                return DiscoveredToolsSchema.parse(unwrapped);
            // NOTE: CompanySettingsSchema is intentionally NOT registered here.
            // It serves as a server-action input validator (updateCompanyAction),
            // not as an AI display card. If a CompanySettings card is ever added
            // to the chat UI, register it here as 'CompanySettingsCard'.
            default:
                throw new Error(`[Normalization] Unknown display type: ${type}`);
        }
    } catch (e) {
        console.error(`[Normalization] Validation failed for ${type}:`, e);
        // We throw so the UI can handle it via ErrorBoundary
        throw e;
    }
}
