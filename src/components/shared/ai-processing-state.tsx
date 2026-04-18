"use client"

import { cn } from "@/lib/utils"

// =============================================================================
// Tool Name → Swedish Label Mapping
// =============================================================================

const TOOL_LABELS: Record<string, string> = {
    // Company
    get_company_info: 'Hämtar företagsinfo',
    get_company_stats: 'Hämtar företagsstatistik',
    update_company_info: 'Uppdaterar företagsinfo',
    // Bookkeeping
    create_verification: 'Skapar verifikation',
    get_verifications: 'Hämtar verifikationer',
    lookup_bas_account: 'Söker i kontoplanen',
    // Invoices
    create_invoice: 'Skapar faktura',
    get_invoices: 'Hämtar fakturor',
    send_invoice: 'Skickar faktura',
    // Transactions
    get_transactions: 'Hämtar transaktioner',
    book_transaction: 'Bokför transaktion',
    // Payroll
    run_payroll: 'Kör lönekörning',
    get_payslips: 'Hämtar lönespecifikationer',
    calculate_salary: 'Beräknar lön',
    // Tax & VAT
    get_vat_report: 'Hämtar momsrapport',
    calculate_vat: 'Beräknar moms',
    calculate_tax: 'Beräknar skatt',
    // Reports
    get_balance_sheet: 'Hämtar balansräkning',
    get_income_statement: 'Hämtar resultaträkning',
    generate_report: 'Genererar rapport',
    // Events
    get_events: 'Hämtar händelser',
    get_events_by_date: 'Hämtar dagens händelser',
    get_upcoming_deadlines: 'Kollar deadlines',
    get_activity_summary: 'Sammanfattar aktivitet',
    // Memory
    query_memories: 'Kollar minnet',
    search_conversations: 'Söker i historiken',
    read_conversation: 'Läser konversation',
    // Common
    navigate_to: 'Navigerar',
}

function getToolLabel(toolName: string): string {
    return TOOL_LABELS[toolName] || 'Bearbetar'
}

// =============================================================================
// Processing State Component
// =============================================================================

interface AiProcessingStateProps {
    /** Tool name being executed — shows specific label */
    toolName?: string
    /** Completed state — shows checkmark instead of shimmer */
    completed?: boolean
    /** Result label shown when completed — e.g. "Hämtade 12 verifikationer" */
    resultLabel?: string
    /** Fallback messages for general thinking state (no specific tool) */
    messages?: string[]
    className?: string
}

export function AiProcessingState({
    toolName,
    completed = false,
    resultLabel,
    messages,
    className
}: AiProcessingStateProps) {
    const activeLabel = toolName
        ? getToolLabel(toolName)
        : (messages?.[0] || 'Tänker')

    const doneLabel = resultLabel ?? activeLabel

    return (
        <div className={cn("relative min-h-[20px] flex items-center py-1", className)}>
            {/* Active shimmer state */}
            <span className={cn(
                "text-xs text-shimmer transition-opacity duration-300",
                completed ? "opacity-0 pointer-events-none" : "opacity-100"
            )}>
                {activeLabel}...
            </span>
            {/* Completed state — overlaid, fades in */}
            <span className={cn(
                "absolute inset-0 flex items-center text-xs text-muted-foreground/70 gap-1.5 transition-opacity duration-300",
                completed ? "opacity-100" : "opacity-0 pointer-events-none"
            )}>
                <span className="text-emerald-500">✓</span>
                {doneLabel}
            </span>
        </div>
    )
}

// Re-export the label getter for external use
export { getToolLabel }
