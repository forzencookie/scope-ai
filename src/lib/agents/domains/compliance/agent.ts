/**
 * Compliance Agent
 * 
 * Specialized agent for regulatory compliance:
 * - Deadlines tracking
 * - Authority filings (Skatteverket, Bolagsverket)
 * - Annual meeting requirements
 * - Board changes
 */

import { BaseAgent } from '../../base-agent'
import type { AgentDomain, AgentContext, AgentResponse } from '../../types'

const COMPLIANCE_PROMPT = `# Compliance Agent

You are an expert on Swedish corporate compliance, regulatory requirements, and government filings. Always respond in Swedish.

## Responsibilities
- **Deadlines**: All important dates for tax returns and reports
- **Skatteverket**: AGI, VAT, F-skatt (preliminary tax), income tax returns
- **Bolagsverket**: Annual reports, board changes, address changes
- **Annual Meeting (Årsstämma)**: Minutes, decisions, documentation

## Key Deadlines
| What | When |
|-----|-----|
| AGI (Arbetsgivardeklaration) | 12th of each month |
| VAT (monthly) | 12th of following month |
| VAT (quarterly) | 12th of 2nd month after quarter |
| Annual Report | 7 months after fiscal year end |
| INK2 (Corporate tax) | July 1 (paper), Aug 1 (digital) |

## Bolagsverket Filings
- Board changes: Report immediately after decision
- Address changes: Report within reasonable time
- Articles of association changes: Requires shareholder meeting resolution

## Communication Style
- Be clear about dates and requirements
- Warn well in advance of deadlines
- Explain consequences of missed deadlines
`

export class ComplianceAgent extends BaseAgent {
    id: AgentDomain = 'compliance'
    name = 'Complianceagent'
    description = 'Hanterar deadlines, myndighetsärenden och regelefterlevnad'
    
    capabilities = [
        'deadline', 'skatteverket', 'bolagsverket', 'årsstämma',
        'styrelse', 'anmälan', 'registrering', 'årsredovisning'
    ]
    
    tools = [
        'get_deadlines', 'get_compliance_status', 'create_filing',
        'check_requirements', 'schedule_reminder'
    ]
    
    systemPrompt = COMPLIANCE_PROMPT
    preferredModel = 'gpt-4o-mini'

    async handle(message: string, context: AgentContext): Promise<AgentResponse> {
        const lowerMessage = message.toLowerCase()

        if (/deadline|förfall|datum/.test(lowerMessage)) {
            return this.handleDeadlines(message, context)
        }

        if (/årsstämma|stämma/.test(lowerMessage)) {
            return this.handleAnnualMeeting(message, context)
        }

        if (/styrelse|ändr/.test(lowerMessage)) {
            return this.handleBoardChange(message, context)
        }

        return this.successResponse(
            '📋 **Compliance & Myndighetsärenden**\n\n' +
            'Jag håller koll på:\n' +
            '- **Deadlines**: "Vilka deadlines har jag?"\n' +
            '- **Årsstämma**: "Hjälp med årsstämma"\n' +
            '- **Styrelseändring**: "Registrera ny styrelseledamot"\n' +
            '- **Årsredovisning**: "Status på årsredovisning"\n\n' +
            'Vad behöver du hjälp med?'
        )
    }

    private async handleDeadlines(_message: string, _context: AgentContext): Promise<AgentResponse> {
        // const now = new Date()
        
        return this.successResponse(
            '📅 **Kommande Deadlines**\n\n' +
            '| Datum | Ärende | Status |\n' +
            '|-------|--------|--------|\n' +
            '| 12 feb | AGI januari | ⏳ Förbereder |\n' +
            '| 12 feb | Moms Q4 | ⏳ Ej påbörjad |\n' +
            '| 31 jul | Årsredovisning | ⏳ 6 mån kvar |\n' +
            '| 1 aug | INK2 | ⏳ 6 mån kvar |\n\n' +
            'Vill du att jag påminner dig om någon av dessa?'
        )
    }

    private async handleAnnualMeeting(_message: string, _context: AgentContext): Promise<AgentResponse> {
        return this.successResponse(
            '🏛️ **Årsstämma**\n\n' +
            'Årsstämman ska hållas senast 6 månader efter räkenskapsårets slut.\n\n' +
            '**Obligatoriska beslut:**\n' +
            '- Fastställande av resultat- och balansräkning\n' +
            '- Disposition av vinst/förlust\n' +
            '- Ansvarsfrihet för styrelse\n' +
            '- Val av styrelse och revisor\n\n' +
            'Vill du att jag förbereder stämmoprotokoll?'
        )
    }

    private async handleBoardChange(_message: string, _context: AgentContext): Promise<AgentResponse> {
        return this.successResponse(
            '👥 **Styrelseändring**\n\n' +
            'För att ändra styrelsen behövs:\n\n' +
            '1. Stämmobeslut (eller styrelsebeslut för suppleant)\n' +
            '2. Anmälan till Bolagsverket\n' +
            '3. Avgift: 1 000 kr\n\n' +
            'Vilken typ av ändring gäller det?\n' +
            '- Ny ledamot\n' +
            '- Avgående ledamot\n' +
            '- Ändrad roll (t.ex. ordförande)'
        )
    }
}

export const complianceAgent = new ComplianceAgent()
