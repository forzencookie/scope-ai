/**
 * Invoice Agent
 * 
 * Specialized agent for customer invoices:
 * - Create and send invoices
 * - Payment tracking
 * - Reminders and follow-ups
 */

import { BaseAgent } from '../../base-agent'
import type { AgentDomain, AgentContext, AgentResponse } from '../../types'

const INVOICE_PROMPT = `# Invoice Agent

You are an expert in customer invoicing for Swedish businesses. Always respond in Swedish.

## Responsibilities
- **Create invoices**: New invoice with line items
- **Payment status**: Track paid/unpaid invoices
- **Reminders**: Overdue invoices, reminder fees (påminnelser)
- **Credit invoices**: Handle corrections (kreditfakturor)

## Swedish Invoice Rules
- Invoice number: Sequential, unique series
- Payment terms: Typically 30 days
- Reminder fee (Påminnelseavgift): Max 60 SEK
- Late interest (Dröjsmålsränta): Reference rate + 8%

## Required Invoice Information
- Seller name, address, org.nr
- Buyer name and address
- Invoice date and number
- Goods/services with price
- VAT amount per rate (moms)
- Total including VAT
- Payment terms

## Tone
- Professional and clear
- Help with wording

## Block Composition
When composing walkthrough blocks for this domain:
- **Invoice list** ("visa kundfakturor"): heading → info-card (if overdue) → data-table → prose
- **Invoice preview** ("visa faktura 2024-001"): document-preview (meta + body) — or Mode A chat for simple lookup
- **Overdue invoices** ("förfallna fakturor"): heading → stat-cards (total overdue, count) → data-table → action-bar
- **Create invoice**: Mode B fixed flow with confirmation block
`

export class InvoiceAgent extends BaseAgent {
    id: AgentDomain = 'invoices'
    name = 'Fakturaagent'
    description = 'Hanterar kundfakturor, betalningar och påminnelser'
    
    capabilities = [
        'faktura', 'invoice', 'kund', 'betalning', 'förfallen',
        'påminnelse', 'skicka', 'kredit', 'offert'
    ]
    
    tools = [
        'create_invoice', 'get_invoices', 'send_invoice',
        'send_reminder', 'create_credit_invoice', 'mark_paid'
    ]
    
    systemPrompt = INVOICE_PROMPT
    preferredModel = 'gpt-4o'

    async handle(message: string, context: AgentContext): Promise<AgentResponse> {
        const intent = context.intent

        if (intent?.subIntent === 'create') {
            return this.successResponse(
                'Ska vi skapa en faktura! 📄\n\n' +
                'Berätta:\n' +
                '1. Vem är kunden?\n' +
                '2. Vad ska faktureras?\n' +
                '3. Vilket belopp?'
            )
        }

        if (intent?.subIntent === 'query') {
            const result = await this.executeTool('get_invoices', { limit: 10 }, context)
            return this.successResponse(
                `Här är dina senaste fakturor.`,
                { display: { type: 'table', data: result.result } }
            )
        }

        return this.successResponse(
            '📄 Jag hanterar kundfakturor.\n\n' +
            '- "Skapa faktura till [kund]"\n' +
            '- "Visa obetalda fakturor"\n' +
            '- "Skicka påminnelse"\n\n' +
            'Vad vill du göra?'
        )
    }
}

export const invoiceAgent = new InvoiceAgent()
