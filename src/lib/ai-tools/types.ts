/**
 * AI Tools Type System
 * 
 * Core types for the AI tool layer that gives the AI Workspace
 * full control over the dashboard.
 */

import { ZodTypeAny } from 'zod'

// Use OpenAI-compatible parameter type instead of JSONSchema7
// This matches OpenAI's FunctionParameters type
export type FunctionParameters = {
    type: 'object'
    properties: Record<string, {
        type: string
        description?: string
        enum?: string[]
        format?: string
        items?: {
            type: string
            properties?: Record<string, {
                type: string
                description?: string
            }>
            required?: string[]
        }
    }>
    required?: string[]
} | ZodTypeAny // Allow Zod schemas

export interface InteractionContext {
    userId: string
    companyId: string
    isConfirmed: boolean
}

// =============================================================================
// Tool Definition Types
// =============================================================================

/**
 * Defines a single tool that the AI can invoke.
 * Maps to OpenAI function calling format.
 */
/** Tool domain — maps to folder structure */
export type AIToolDomain = 'bokforing' | 'loner' | 'skatt' | 'parter' | 'common' | 'planning'

export interface AITool<TParams = unknown, TResult = unknown> {
    /** Unique identifier for the tool */
    name: string

    /** Human-readable description for the AI */
    description: string

    /** JSON Schema for parameters */
    parameters: FunctionParameters

    /**
     * Whether this tool requires user confirmation before execution.
     * Used for destructive/legally-binding actions.
     */
    requiresConfirmation?: boolean

    /**
     * Category for organizing tools
     */
    category: 'read' | 'write' | 'navigation'

    /** Domain this tool belongs to (for search/discovery) */
    domain?: AIToolDomain

    /** Swedish/English keywords for search matching */
    keywords?: string[]

    /** If true, this tool is always loaded (not discovered via search) */
    coreTool?: boolean

    /**
     * Execute the tool with the given parameters.
     * Returns a structured result.
     */
    execute: (params: TParams, context: InteractionContext) => Promise<AIToolResult<TResult>>

    /** List of company types allowed to execute this tool. If omitted or empty, allowed for all. */
    allowedCompanyTypes?: Array<'ab' | 'ef' | 'hb' | 'kb' | 'forening'>
}

// =============================================================================
// Tool Result Types
// =============================================================================

/**
 * Unified result type for all AI tool executions
 */
export interface AIToolResult<T = unknown> {
    /** Whether the tool executed successfully */
    success: boolean

    /** The data returned by the tool (for read operations) */
    data?: T

    /** Human-readable message for the AI to use in response */
    message?: string

    /** Error message if success is false */
    error?: string

    /** 
     * @deprecated Use walkthrough blocks (W: protocol) instead.
     * Display instructions for the frontend.
     * If present, the AI workspace should render this component.
     */
    display?: AIDisplayInstruction

    /**
     * Navigation instruction.
     * If present, the AI workspace should offer to navigate.
     */
    navigation?: AINavigationInstruction

    /**
     * Confirmation request for destructive actions.
     * If present, show confirmation UI before executing.
     */
    confirmationRequired?: AIConfirmationRequest
}

/**
 * @deprecated Use block primitives (src/components/ai/blocks) instead.
 * Instructions for rendering a component inline in the chat.
 * The new system uses W: protocol and block-renderer.tsx.
 */
export interface AIDisplayInstruction {
    /** Component type to render */
    component:
    // Tables
    | 'TransactionsTable'
    | 'ReceiptsTable'
    | 'PayslipsTable'
    | 'EmployeeList'
    | 'DeadlinesList'
    | 'InvoicesTable'
    | 'SupplierInvoicesTable'
    // Summaries
    | 'VatSummary'
    | 'BalanceSheet'
    | 'IncomeStatement'
    | 'CompanyStats'
    | 'CompanyInfoCard'
    // Cards (simple previews)
    | 'ReceiptCard'
    | 'TransactionCard'
    | 'TaskChecklist'
    | 'InvoicePreview'
    // Document Previews (PDF-ready, sendable)
    | 'PayslipPreview'
    | 'BoardMinutesPreview'
    | 'ShareRegisterPreview'
    | 'FinancialReportPreview'
    | 'DividendPreview'
    | 'MeetingMinutesPreview'
    | 'DocumentPreview'
    | 'AgmPreparationPreview'
    // Form Previews (Authority submissions)
    | 'VATFormPreview'
    | 'AGIFormPreview'
    | 'TaxDeclarationPreview'
    | 'K10FormPreview'
    | 'NEFormPreview'
    | 'AnnualReportPreview'
    // Bokföring Previews
    | 'AssetPreview'
    | 'DepreciationPreview'
    | 'PeriodizationPreview'
    | 'INK2FormPreview'
    | 'YearEndPreview'
    // Löner Previews
    | 'SelfEmploymentPreview'
    | 'Optimization312Preview'
    // Settings & Planning
    | 'SubscriptionPreview'
    | 'IntegrationsList'
    // Bokföring - Verifications & Accounts
    | 'VerificationList'
    | 'AccountList'
    | 'BalanceSheetSummary'
    | 'ChartOfAccounts'
    // Ägare & Styrning
    | 'BoardMembersList'
    | 'SignatoriesList'
    | 'BoardMeetingMinutesList'
    | 'CompanyMeetingsList'
    // Company Statistics
    | 'CompanyStatistics'
    | 'MonthlyBreakdown'
    | 'KPIDisplay'
    | 'DashboardCounts'
    // Audit
    | 'BalanceAuditCard'
    // Generic Displays
    | 'DataTable'

    /** Props to pass to the component */
    props: Record<string, unknown>

    /** Title for the inline display */
    title?: string

    /** Show "Open full view" button linking to this route */
    fullViewRoute?: string
}

/**
 * Navigation instruction for the AI workspace
 */
export interface AINavigationInstruction {
    /** Route to navigate to */
    route: string

    /** Human-readable label for the navigation button */
    label: string

    /** Whether to open in a new tab */
    newTab?: boolean
}

/**
 * Confirmation request for destructive actions
 */
export interface AIConfirmationRequest {
    /** Title for the confirmation dialog */
    title: string

    /** Description of what will happen */
    description: string

    /** Summary items to display (key-value pairs) */
    summary: Array<{
        label: string
        value: string
    }>

    /** Warnings to display (if any) */
    warnings?: string[]

    /** The action to execute after confirmation */
    action: {
        toolName: string
        params: unknown
    }

    /** Whether to require a checkbox ("I confirm...") */
    requireCheckbox?: boolean
    checkboxLabel?: string
}

// =============================================================================
// Tool Execution Types
// =============================================================================

/**
 * A pending confirmation that needs user approval
 */
export interface PendingConfirmation {
    id: string
    request: AIConfirmationRequest
    createdAt: number
    expiresAt: number
}

/**
 * Audit log entry for executed actions
 */
export interface ActionAuditLog {
    id: string
    toolName: string
    params: unknown
    result: AIToolResult
    userId: string
    timestamp: number
    confirmationId?: string
    payloadHash: string
}

