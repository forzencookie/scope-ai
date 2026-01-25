/**
 * Skatt Agent (Tax)
 * 
 * Specialized agent for tax matters:
 * - VAT calculations and declarations
 * - Income tax declarations (INK2)
 * - Tax allocation reserves (periodiseringsfonder)
 * - K10 for shareholders
 * - Tax optimization
 */

import { BaseAgent } from '../../base-agent'
import type { AgentDomain, AgentContext, AgentResponse } from '../../types'

const SKATT_PROMPT = `# Tax Agent

You are an expert in Swedish corporate taxation. Always respond in Swedish.

## Responsibilities
- **VAT (Moms)**: Calculation, declaration, periods
- **Income tax**: Corporate tax 20.6%, INK2 declaration
- **Tax allocation reserves**: Periodiseringsfonder, 6-year rule
- **K10**: Close company rules (fåmansföretag), dividends
- **F-skatt**: Preliminary tax payments

## VAT Periods (Momsperioder)
- Annual VAT: Revenue < 1 MSEK
- Quarterly VAT: 1-40 MSEK
- Monthly VAT: > 40 MSEK

## Deadlines
- VAT declaration: 12th of month after period end (quarterly: 12th of 2nd month)
- INK2: July 1 (paper), August 1 (digital)
- Annual report (Årsredovisning): 7 months after fiscal year end

## Tax Allocation Reserves (Periodiseringsfonder)
- Max 25% of profit per year
- Must be reversed by year 6
- Standard interest (schablonränta) applies

## K10 & Dividends (Utdelning)
- Threshold amount (gränsbelopp) calculated annually
- Salary base (löneunderlag) affects dividend space
- Qualified shares: 3:12 rules apply

## Tone
- Precise with rules and dates
- Explain tax effects
- Warn about risks
`

export class SkattAgent extends BaseAgent {
    id: AgentDomain = 'skatt'
    name = 'Skatteagent'
    description = 'Hanterar moms, inkomstskatt, periodiseringsfonder och K10'
    
    capabilities = [
        'moms', 'VAT', 'skatt', 'deklaration', 'INK2', 'K10',
        'periodiseringsfond', 'bolagsskatt', 'F-skatt', 'utdelning'
    ]
    
    tools = [
        'calculate_vat', 'get_tax_periods', 'generate_vat_declaration',
        'calculate_k10', 'manage_periodiseringsfond', 'get_tax_summary'
    ]
    
    systemPrompt = SKATT_PROMPT
    preferredModel = 'claude-opus-4-20250514'  // Complex tax reasoning

    async handle(message: string, context: AgentContext): Promise<AgentResponse> {
        const lowerMessage = message.toLowerCase()

        if (/moms/.test(lowerMessage)) {
            return this.handleVAT(message, context)
        }

        if (/k10|utdelning|fåmansföretag/.test(lowerMessage)) {
            return this.handleK10(message, context)
        }

        if (/periodisering/.test(lowerMessage)) {
            return this.handlePeriodiseringsfonder(message, context)
        }

        if (/deadline|förfall/.test(lowerMessage)) {
            return this.handleDeadlines(message, context)
        }

        return this.successResponse(
            '📊 **Skattehjälp**\n\n' +
            'Jag kan hjälpa med:\n' +
            '- **Moms**: "Beräkna moms för Q4"\n' +
            '- **K10**: "Räkna ut gränsbelopp"\n' +
            '- **Periodiseringsfonder**: "Avsätt till periodiseringsfond"\n' +
            '- **Deadlines**: "Vilka skattedeadlines har jag?"\n\n' +
            'Vad behöver du hjälp med?'
        )
    }

    private async handleVAT(_message: string, _context: AgentContext): Promise<AgentResponse> {
        return this.successResponse(
            '🧾 **Momsdeklaration**\n\n' +
            'Jag kan:\n' +
            '- Beräkna moms för en period\n' +
            '- Visa utgående vs ingående moms\n' +
            '- Förbereda deklarationsunderlag\n\n' +
            'Vilken period vill du titta på?'
        )
    }

    private async handleK10(_message: string, _context: AgentContext): Promise<AgentResponse> {
        return this.successResponse(
            '📈 **K10 - Fåmansföretag**\n\n' +
            'K10 används för att deklarera utdelning från fåmansföretag.\n\n' +
            '**Gränsbelopp 2024:**\n' +
            '- Schablonregel: 204 325 kr\n' +
            '- Lönebaserat: Beroende på löneunderlag\n' +
            '- Huvudregel: 9% av omkostnadsbelopp\n\n' +
            'Vill du att jag beräknar ditt gränsbelopp?'
        )
    }

    private async handlePeriodiseringsfonder(_message: string, _context: AgentContext): Promise<AgentResponse> {
        return this.successResponse(
            '🏦 **Periodiseringsfonder**\n\n' +
            'Minska skatten genom att avsätta upp till 25% av överskottet.\n\n' +
            '**Regler:**\n' +
            '- Max 25% av årets överskott\n' +
            '- Återförs senast år 6\n' +
            '- Schablonränta: Statslåneränta x 72%\n\n' +
            'Vill du se hur mycket du kan avsätta?'
        )
    }

    private async handleDeadlines(_message: string, _context: AgentContext): Promise<AgentResponse> {
        // const now = new Date()
        // const month = now.getMonth() + 1

        return this.successResponse(
            '📅 **Kommande skattedeadlines**\n\n' +
            '| Datum | Vad |\n' +
            '|-------|-----|\n' +
            `| 12/${month} | AGI (arbetsgivardeklaration) |\n` +
            `| 12/${month + 1} | Moms (kvartalsvis) |\n` +
            '| 1 juli | INK2 (inkomstdeklaration) |\n' +
            '| 31 aug | Årsredovisning (juni-bolag) |\n\n' +
            '_Exakta datum beror på ditt räkenskapsår._'
        )
    }
}

export const skattAgent = new SkattAgent()
