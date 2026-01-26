/**
 * Intent to Agent Mapping
 */

import type { AgentDomain } from '@/lib/agents/types'

/**
 * Map intent category to agent domain.
 */
export function mapIntentToAgent(category: string): AgentDomain {
    const mapping: Record<string, AgentDomain> = {
        'RECEIPT': 'receipts',
        'INVOICE': 'invoices',
        'BOOKKEEPING': 'bokforing',
        'PAYROLL': 'loner',
        'TAX': 'skatt',
        'REPORTING': 'rapporter',
        'COMPLIANCE': 'compliance',
        'STATISTICS': 'statistik',
        'EVENTS': 'handelser',
        'SETTINGS': 'installningar',
        'NAVIGATION': 'orchestrator',
        'GENERAL': 'orchestrator',
        'MULTI_DOMAIN': 'orchestrator',
    }
    return mapping[category] || 'orchestrator'
}
