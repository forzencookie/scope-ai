/**
 * Löner Agent (Payroll)
 * 
 * Specialized agent for payroll and benefits:
 * - Salary calculations
 * - Tax tables (skattetabeller)
 * - Employer contributions (arbetsgivaravgifter)
 * - Benefits (förmåner)
 * - AGI declarations
 */

import { BaseAgent } from '../../base-agent'
import type { AgentDomain, AgentContext, AgentResponse } from '../../types'

const LONER_PROMPT = `# Payroll Agent

You are an expert in Swedish payroll management (lönehantering). Always respond in Swedish.

## Responsibilities
- **Salary calculation**: Gross → net with tax deductions
- **Tax tables**: Correct skattetabell based on municipality and birth year
- **Employer contributions**: Arbetsgivaravgifter 31.42% (standard), reduced for young/elderly
- **Benefits**: Friskvård, company car (tjänstebil), benefit values (förmånsvärde)
- **AGI**: Employer declaration (arbetsgivardeklaration)

## Employer Contributions 2024 (Arbetsgivaravgifter)
- Standard: 31.42%
- Born 1958 or earlier: 10.21%
- Born 2002-2006 (age 18-22): 10.21%
- First employee: Reduction possible

## Common Accounts
- 7010: Wages blue-collar (Löner kollektivanställda)
- 7210: Salaries white-collar (Löner tjänstemän)
- 7510: Employer contributions (Arbetsgivaravgifter)
- 7533: Special payroll tax (Särskild löneskatt)
- 2710: Employee tax liability (Personalskatt)
- 2730: Employer contribution liability

## Benefits (Förmåner)
- Wellness (Friskvård): Up to 5000 SEK tax-free
- Company car (Tjänstebil): Standard value based on new car price
- Lunch: 52% of meal value

## Tone
- Precise with numbers
- Explain calculations step by step
`

export class LonerAgent extends BaseAgent {
    id: AgentDomain = 'loner'
    name = 'Löneagent'
    description = 'Hanterar löner, skattetabeller, avgifter och förmåner'
    
    capabilities = [
        'lön', 'salary', 'skatt', 'arbetsgivaravgift', 'AGI',
        'förmån', 'friskvård', 'tjänstebil', 'anställd', 'personal'
    ]
    
    tools = [
        'calculate_salary', 'get_employees', 'generate_payslip',
        'generate_agi', 'calculate_employer_tax', 'assign_benefit'
    ]
    
    systemPrompt = LONER_PROMPT
    preferredModel = 'gpt-4o'

    async handle(message: string, context: AgentContext): Promise<AgentResponse> {
        // const intent = context.intent

        if (/beräkna|kalkyl|räkna/.test(message.toLowerCase())) {
            return this.handleSalaryCalculation(message, context)
        }

        if (/AGI|arbetsgivardeklaration/.test(message)) {
            return this.handleAGI(message, context)
        }

        if (/förmån|friskvård|tjänstebil/.test(message.toLowerCase())) {
            return this.handleBenefits(message, context)
        }

        return this.successResponse(
            '💰 Jag hjälper dig med löner och personal.\n\n' +
            '- "Beräkna lön 45000 brutto"\n' +
            '- "Skapa lönebesked för Erik"\n' +
            '- "Förbered AGI för januari"\n' +
            '- "Lägg till friskvård för Anna"\n\n' +
            'Vad vill du göra?'
        )
    }

    private async handleSalaryCalculation(message: string, _context: AgentContext): Promise<AgentResponse> {
        const amountMatch = message.match(/(\d[\d\s]*)/);
        const amount = amountMatch ? parseInt(amountMatch[1].replace(/\s/g, '')) : null

        if (!amount) {
            return this.successResponse(
                'Vilket bruttobelopp vill du räkna på? (t.ex. 45000 kr)'
            )
        }

        // Simple calculation (in production would use real tax tables)
        const tax = Math.round(amount * 0.32)
        const net = amount - tax
        const employerTax = Math.round(amount * 0.3142)
        const totalCost = amount + employerTax

        return this.successResponse(
            `**Löneuträkning för ${amount.toLocaleString('sv-SE')} kr brutto:**\n\n` +
            `📊 Skatteavdrag (ca 32%): -${tax.toLocaleString('sv-SE')} kr\n` +
            `💵 **Netto till anställd: ${net.toLocaleString('sv-SE')} kr**\n\n` +
            `👔 Arbetsgivaravgift (31.42%): +${employerTax.toLocaleString('sv-SE')} kr\n` +
            `💼 **Total kostnad för företaget: ${totalCost.toLocaleString('sv-SE')} kr**\n\n` +
            `_OBS: Exakt skatt beror på skattetabell och kommun._`
        )
    }

    private async handleAGI(_message: string, _context: AgentContext): Promise<AgentResponse> {
        return this.successResponse(
            '📋 **Arbetsgivardeklaration (AGI)**\n\n' +
            'AGI ska lämnas senast den 12:e varje månad.\n\n' +
            'Jag kan:\n' +
            '- Förbereda AGI baserat på utbetalda löner\n' +
            '- Visa vad som ska rapporteras\n' +
            '- Hjälpa med korrigeringar\n\n' +
            'Vilken period vill du förbereda?'
        )
    }

    private async handleBenefits(_message: string, _context: AgentContext): Promise<AgentResponse> {
        return this.successResponse(
            '🎁 **Förmåner**\n\n' +
            '**Skattefria:**\n' +
            '- Friskvård: upp till 5 000 kr/år\n' +
            '- Personalrabatter (rimliga)\n\n' +
            '**Skattepliktiga:**\n' +
            '- Tjänstebil: Förmånsvärde baserat på nybilspris\n' +
            '- Lunchförmån: 52% av måltidsvärde\n\n' +
            'Vilken förmån vill du registrera?'
        )
    }
}

export const lonerAgent = new LonerAgent()
