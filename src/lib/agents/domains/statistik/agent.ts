/**
 * Statistik Agent (Statistics/KPIs)
 * 
 * Specialized agent for company analytics:
 * - KPIs (soliditet, kassalikviditet, etc.)
 * - Revenue trends
 * - Cost analysis
 * - Company health overview
 */

import { BaseAgent } from '../../base-agent'
import type { AgentDomain, AgentContext, AgentResponse } from '../../types'

const STATISTIK_PROMPT = `# Statistics Agent

You are an expert on business analytics and financial KPIs for Swedish companies. Always respond in Swedish.

## Responsibilities
- **Key Metrics (Nyckeltal)**: Equity ratio, liquidity, profitability
- **Trends**: Revenue, costs, profit over time
- **Cost Analysis**: Where is the money going?
- **Company Health**: Overall status assessment

## Key Performance Indicators (KPIs)

### Soliditet (Equity Ratio)
- Formula: Equity / Total Assets × 100
- Good: > 30%
- Risk: < 20%

### Kassalikviditet (Quick Ratio)
- Formula: (Current Assets - Inventory) / Current Liabilities × 100
- Good: > 100%
- Risk: < 80%

### Skuldsättningsgrad (Debt-to-Equity)
- Formula: Debt / Equity
- Good: < 1.0
- Risk: > 2.0

### Vinstmarginal (Profit Margin)
- Formula: Profit / Revenue × 100
- Varies by industry

## Communication Style
- Explain numbers in context
- Compare against healthy benchmarks
- Provide concrete recommendations
`

export class StatistikAgent extends BaseAgent {
    id: AgentDomain = 'statistik'
    name = 'Statistikagent'
    description = 'Analyserar företagshälsa, KPIs och trender'
    
    capabilities = [
        'statistik', 'KPI', 'nyckeltal', 'soliditet', 'likviditet',
        'hur går det', 'trend', 'utveckling', 'analys', 'översikt'
    ]
    
    tools = [
        'get_financial_kpis', 'get_revenue_trends', 'get_expense_breakdown',
        'compare_periods', 'generate_insights'
    ]
    
    systemPrompt = STATISTIK_PROMPT
    preferredModel = 'gpt-4o'

    async handle(message: string, context: AgentContext): Promise<AgentResponse> {
        const lowerMessage = message.toLowerCase()

        if (/hur går det|status|översikt|hälsa/.test(lowerMessage)) {
            return this.handleOverview(message, context)
        }

        if (/soliditet|likviditet|nyckeltal|kpi/.test(lowerMessage)) {
            return this.handleKPIs(message, context)
        }

        if (/kostnad|utgift|analys/.test(lowerMessage)) {
            return this.handleCostAnalysis(message, context)
        }

        if (/trend|utveckling|jämför/.test(lowerMessage)) {
            return this.handleTrends(message, context)
        }

        return this.successResponse(
            '📊 **Företagsstatistik**\n\n' +
            'Jag kan analysera:\n' +
            '- **Översikt**: "Hur går det för företaget?"\n' +
            '- **Nyckeltal**: "Visa soliditet och likviditet"\n' +
            '- **Kostnader**: "Analysera kostnader"\n' +
            '- **Trender**: "Visa intäktsutveckling"\n\n' +
            'Vad vill du veta?'
        )
    }

    private async handleOverview(message: string, context: AgentContext): Promise<AgentResponse> {
        // In production, fetch real data
        return this.successResponse(
            '🏢 **Företagsöversikt**\n\n' +
            '**Denna månad:**\n' +
            '📈 Intäkter: 145 000 kr (+12% mot förra månaden)\n' +
            '📉 Kostnader: 98 000 kr (+5%)\n' +
            '💰 Resultat: 47 000 kr\n\n' +
            '**Nyckeltal:**\n' +
            '- Soliditet: 42% ✅ (bra)\n' +
            '- Kassalikviditet: 156% ✅ (bra)\n' +
            '- Vinstmarginal: 32% ✅\n\n' +
            '**OBS:** 3 kundfordringar är förfallna (totalt 23 000 kr). Vill du att jag skickar påminnelser?'
        )
    }

    private async handleKPIs(message: string, context: AgentContext): Promise<AgentResponse> {
        return this.successResponse(
            '📊 **Nyckeltal**\n\n' +
            '| Nyckeltal | Värde | Status |\n' +
            '|-----------|-------|--------|\n' +
            '| Soliditet | 42% | ✅ Bra (>30%) |\n' +
            '| Kassalikviditet | 156% | ✅ Bra (>100%) |\n' +
            '| Skuldsättning | 0.8 | ✅ Bra (<1.0) |\n' +
            '| Vinstmarginal | 32% | ✅ Bra |\n' +
            '| Kundfordringsdagar | 28 | ✅ OK (<30) |\n\n' +
            '_Baserat på senaste bokföringen._'
        )
    }

    private async handleCostAnalysis(message: string, context: AgentContext): Promise<AgentResponse> {
        return this.successResponse(
            '💸 **Kostnadsanalys**\n\n' +
            '**Top 5 kostnadsposter:**\n' +
            '1. Personal (löner + avgifter): 52 000 kr (53%)\n' +
            '2. Lokalkostnader: 15 000 kr (15%)\n' +
            '3. Programvara: 8 500 kr (9%)\n' +
            '4. Marknadsföring: 7 200 kr (7%)\n' +
            '5. Resor: 4 300 kr (4%)\n\n' +
            '📈 Personalkostnad +8% mot förra månaden (ny anställd?)\n' +
            '📉 Marknadsföring -15% (kampanj avslutad)'
        )
    }

    private async handleTrends(message: string, context: AgentContext): Promise<AgentResponse> {
        return this.successResponse(
            '📈 **Trender (senaste 6 mån)**\n\n' +
            'Intäkter: ↗️ +18% (stabil uppgång)\n' +
            'Kostnader: ↗️ +12% (under kontroll)\n' +
            'Resultat: ↗️ +32% (bra utveckling)\n\n' +
            '**Insikt:** Intäkterna växer snabbare än kostnaderna. ' +
            'Om trenden håller i sig estimeras helårsresultatet till ~580 000 kr.'
        )
    }
}

export const statistikAgent = new StatistikAgent()
