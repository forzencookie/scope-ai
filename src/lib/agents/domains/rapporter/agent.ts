/**
 * Rapporter Agent (Reports)
 * 
 * Specialized agent for financial reporting:
 * - P&L (Resultaträkning)
 * - Balance sheet (Balansräkning)
 * - Custom reports
 * - Period comparisons
 */

import { BaseAgent } from '../../base-agent'
import type { AgentDomain, AgentContext, AgentResponse } from '../../types'

const RAPPORTER_PROMPT = `# Reports Agent

You are an expert in financial reporting for Swedish businesses. Always respond in Swedish.

## Responsibilities
- **Income statement (Resultaträkning)**: Revenue, expenses, profit
- **Balance sheet (Balansräkning)**: Assets, liabilities, equity
- **Cash flow analysis (Kassaflödesanalys)**: Cash inflows/outflows
- **Period comparisons**: Month-over-month, year-over-year

## Report Formats
- K2: Simplified (smaller companies)
- K3: Complete (larger companies)

## Key Metrics
- Gross profit = Revenue - Direct costs (Bruttovinst)
- Operating profit (EBIT) = Gross - Other expenses (Rörelseresultat)
- Net profit = EBIT - Tax (Nettoresultat)

## Tone
- Present data clearly
- Explain trends and deviations
- Give insights, not just numbers
`

export class RapporterAgent extends BaseAgent {
    id: AgentDomain = 'rapporter'
    name = 'Rapportagent'
    description = 'Genererar finansiella rapporter och analyser'
    
    capabilities = [
        'rapport', 'resultat', 'balans', 'P&L', 'årsredovisning',
        'kassaflöde', 'jämförelse', 'bokslut', 'nyckeltal'
    ]
    
    tools = [
        'generate_pl_report', 'generate_balance_sheet',
        'compare_periods', 'get_financial_metrics'
    ]
    
    systemPrompt = RAPPORTER_PROMPT
    preferredModel = 'gpt-4o'

    async handle(message: string, context: AgentContext): Promise<AgentResponse> {
        const lowerMessage = message.toLowerCase()

        if (/resultat/.test(lowerMessage)) {
            return this.handlePL(message, context)
        }

        if (/balans/.test(lowerMessage)) {
            return this.handleBalance(message, context)
        }

        if (/jämför/.test(lowerMessage)) {
            return this.handleComparison(message, context)
        }

        return this.successResponse(
            '📊 **Finansiella rapporter**\n\n' +
            'Jag kan generera:\n' +
            '- **Resultaträkning**: "Visa resultaträkning för Q4"\n' +
            '- **Balansräkning**: "Generera balansräkning"\n' +
            '- **Jämförelse**: "Jämför januari med förra året"\n' +
            '- **Årsredovisning**: "Förbered årsredovisning"\n\n' +
            'Vilken rapport vill du ha?'
        )
    }

    private async handlePL(message: string, context: AgentContext): Promise<AgentResponse> {
        return this.successResponse(
            '📈 **Resultaträkning**\n\n' +
            'Jag förbereder resultaträkningen...\n\n' +
            '_I produktion hämtar jag data från bokföringen och genererar en komplett rapport._'
        )
    }

    private async handleBalance(message: string, context: AgentContext): Promise<AgentResponse> {
        return this.successResponse(
            '⚖️ **Balansräkning**\n\n' +
            'Jag förbereder balansräkningen...\n\n' +
            '_I produktion hämtar jag kontosaldon och presenterar tillgångar, skulder och eget kapital._'
        )
    }

    private async handleComparison(message: string, context: AgentContext): Promise<AgentResponse> {
        return this.successResponse(
            '📊 **Periodjämförelse**\n\n' +
            'Vilka perioder vill du jämföra?\n' +
            '- Denna månad vs förra månaden\n' +
            '- Q4 2025 vs Q4 2024\n' +
            '- Helår 2025 vs 2024'
        )
    }
}

export const rapporterAgent = new RapporterAgent()
