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
    search_tools: 'Söker bland verktyg',
    get_knowledge: 'Läser kunskapsdokument',
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
    /** Fallback messages for general thinking state (no specific tool) */
    messages?: string[]
    className?: string
}

export function AiProcessingState({
    toolName,
    completed = false,
    messages,
    className
}: AiProcessingStateProps) {
    const label = toolName
        ? getToolLabel(toolName)
        : (messages?.[0] || 'Tänker')

    if (completed) {
        return (
            <div className={cn("flex items-center gap-1.5 py-1", className)}>
                <span className="text-xs text-muted-foreground/70 flex items-center gap-1.5">
                    <span className="text-emerald-500">✓</span>
                    {label}
                </span>
            </div>
        )
    }

    return (
        <div className={cn("flex items-center py-1", className)}>
            <span className="text-sm text-shimmer">
                {label}...
            </span>
        </div>
    )
}

// Re-export the label getter for external use
export { getToolLabel }
