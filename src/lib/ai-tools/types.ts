/**
 * AI Tools Type System
 * 
 * Core types for the AI tool layer that gives the AI Workspace
 * full control over the dashboard.
 */

// Use OpenAI-compatible parameter type instead of JSONSchema7
// This matches OpenAI's FunctionParameters type
export type FunctionParameters = {
    type: 'object'
    properties: Record<string, {
        type: string
        description?: string
        enum?: string[]
        items?: { type: string }
    }>
    required?: string[]
}

// =============================================================================
// Tool Definition Types
// =============================================================================

/**
 * Defines a single tool that the AI can invoke.
 * Maps to OpenAI function calling format.
 */
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
    requiresConfirmation: boolean

    /** 
     * Category for organizing tools 
     */
    category: 'read' | 'write' | 'navigation'

    /** 
     * Execute the tool with the given parameters.
     * Returns a structured result.
     */
    execute: (params: TParams) => Promise<AIToolResult<TResult>>
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
 * Instructions for rendering a component inline in the chat
 */
export interface AIDisplayInstruction {
    /** Component type to render */
    component:
    | 'TransactionsTable'
    | 'ReceiptsTable'
    | 'PayslipsTable'
    | 'VatSummary'
    | 'BalanceSheet'
    | 'IncomeStatement'
    | 'EmployeeList'
    | 'InvoicePreview'
    | 'DeadlinesList'
    | 'CompanyStats'
    | 'ReceiptCard'
    | 'TransactionCard'
    | 'TaskChecklist'

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

// =============================================================================
// OpenAI Function Calling Conversion
// =============================================================================

/**
 * Convert an AITool to OpenAI function definition format
 */
export function toolToOpenAIFunction(tool: AITool): {
    type: 'function'
    function: {
        name: string
        description: string
        parameters: FunctionParameters
    }
} {
    return {
        type: 'function',
        function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
        },
    }
}

/**
 * Convert multiple tools to OpenAI format
 */
export function toolsToOpenAIFunctions(tools: AITool[]): ReturnType<typeof toolToOpenAIFunction>[] {
    return tools.map(toolToOpenAIFunction)
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Extract the parameter type from a tool
 */
export type ToolParams<T extends AITool> = T extends AITool<infer P, unknown> ? P : never

// =============================================================================
// Google Gemini Function Calling Conversion
// =============================================================================

/**
 * Convert an AITool to Google Gemini function declaration format
 */
export function toolToGoogleFunction(tool: AITool): {
    name: string
    description: string
    parameters: {
        type: string
        properties: Record<string, any>
        required?: string[]
    }
} {
    // Map JSON schema types to Google types (uppercase)
    const mapType = (type: string): string => {
        const t = type.toLowerCase()
        if (t === 'string') return 'STRING'
        if (t === 'number') return 'NUMBER'
        if (t === 'integer') return 'INTEGER'
        if (t === 'boolean') return 'BOOLEAN'
        if (t === 'array') return 'ARRAY'
        if (t === 'object') return 'OBJECT'
        return 'STRING' // Default
    }

    const mapProperties = (props: Record<string, any>): Record<string, any> => {
        const result: Record<string, any> = {}
        for (const [key, value] of Object.entries(props)) {
            result[key] = {
                type: mapType(value.type),
                description: value.description,
                enum: value.enum,
            }
            if (value.items) {
                result[key].items = { type: mapType(value.items.type) }
            }
            if (value.properties) {
                result[key].properties = mapProperties(value.properties)
            }
        }
        return result
    }

    return {
        name: tool.name,
        description: tool.description,
        parameters: {
            type: 'OBJECT',
            properties: mapProperties(tool.parameters.properties),
            required: tool.parameters.required
        }
    }
}

/**
 * Convert multiple tools to Google format
 */
export function toolsToGoogleFunctions(tools: AITool[]) {
    return tools.map(toolToGoogleFunction)
}

/**
 * Extract the result type from a tool
 */
export type ToolResult<T extends AITool> = T extends AITool<unknown, infer R> ? R : never
