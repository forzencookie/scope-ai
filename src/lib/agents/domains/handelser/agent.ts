/**
 * Händelser Agent (Events/Timeline)
 * 
 * Specialized agent for event management:
 * - Activity timeline
 * - Corporate actions
 * - Roadmaps and planning
 * - Audit trail
 */

import { BaseAgent } from '../../base-agent'
import type { AgentDomain, AgentContext, AgentResponse } from '../../types'

const HANDELSER_PROMPT = `# Events Agent

You are an expert in corporate events and activity tracking for Swedish businesses. Always respond in Swedish.

## Responsibilities
- **Timeline**: All events in chronological order (tidslinje)
- **Activity log**: Who did what and when (aktivitetslogg)
- **Corporate events**: Dividend, board change, capital increase (företagshändelser)
- **Planning**: Roadmaps and milestones

## Event Types
- **AI**: Automatic actions by the AI system
- **User**: Manual user actions
- **System**: Scheduled jobs, integrations
- **Authority**: Skatteverket, Bolagsverket responses

## Corporate Actions (Bolagsåtgärder)
- Dividend (Utdelning): Decision, amount, record date (avstämningsdag)
- Board change (Styrelseändring): New/departing member
- Share issue (Nyemission): Capital increase
- Articles change (Bolagsordningsändring): New bylaws

## Tone
- Clear chronology
- Categorize events
- Link to related documents
`

export class HandelserAgent extends BaseAgent {
    id: AgentDomain = 'handelser'
    name = 'Händelseagent'
    description = 'Hanterar tidslinje, aktivitetslogg och företagshändelser'
    
    capabilities = [
        'händelse', 'event', 'tidslinje', 'aktivitet', 'historik',
        'logg', 'utdelning', 'styrelse', 'roadmap', 'planering'
    ]
    
    tools = [
        'get_events', 'create_event', 'get_roadmap',
        'update_roadmap_status', 'get_corporate_actions'
    ]
    
    systemPrompt = HANDELSER_PROMPT
    preferredModel = 'gpt-4o-mini'

    async handle(message: string, context: AgentContext): Promise<AgentResponse> {
        const lowerMessage = message.toLowerCase()

        if (/hänt|aktivitet|logg|senaste/.test(lowerMessage)) {
            return this.handleTimeline(message, context)
        }

        if (/utdelning|dividend/.test(lowerMessage)) {
            return this.handleDividend(message, context)
        }

        if (/roadmap|plan|milstolpe/.test(lowerMessage)) {
            return this.handleRoadmap(message, context)
        }

        return this.successResponse(
            '📅 **Händelser & Tidslinje**\n\n' +
            'Jag kan visa:\n' +
            '- **Senaste händelser**: "Vad har hänt idag?"\n' +
            '- **AI-aktivitet**: "Visa AI-händelser"\n' +
            '- **Företagshändelser**: "Planera utdelning"\n' +
            '- **Roadmap**: "Visa roadmap"\n\n' +
            'Vad vill du se?'
        )
    }

    private async handleTimeline(_message: string, _context: AgentContext): Promise<AgentResponse> {
        return this.successResponse(
            '📋 **Senaste händelser**\n\n' +
            '| Tid | Typ | Händelse |\n' +
            '|-----|-----|----------|\n' +
            '| 14:32 | 🤖 AI | Klassificerade 12 transaktioner |\n' +
            '| 13:15 | 👤 User | Skapade faktura #2024-015 |\n' +
            '| 11:45 | 🤖 AI | Matchade 8 banktransaktioner |\n' +
            '| 09:30 | ⚙️ System | Hämtade transaktioner från banken |\n' +
            '| Igår | 🏛️ Myndighet | AGI dec godkänd |\n\n' +
            'Vill du filtrera på en specifik typ?'
        )
    }

    private async handleDividend(_message: string, _context: AgentContext): Promise<AgentResponse> {
        return this.successResponse(
            '💰 **Utdelning**\n\n' +
            'För att besluta om utdelning behövs:\n\n' +
            '1. **Stämmobeslut** (ordinarie eller extra stämma)\n' +
            '2. **Täckningskontroll** (fritt eget kapital)\n' +
            '3. **Försiktighetsregeln** (tillräcklig likviditet)\n\n' +
            'Jag kan hjälpa dig:\n' +
            '- Beräkna hur mycket som kan delas ut\n' +
            '- Förbereda stämmoprotokoll\n' +
            '- Bokföra utdelningen\n' +
            '- Hantera K10 för delägare\n\n' +
            'Vill du se hur mycket som är möjligt att dela ut?'
        )
    }

    private async handleRoadmap(_message: string, _context: AgentContext): Promise<AgentResponse> {
        return this.successResponse(
            '🗺️ **Roadmap**\n\n' +
            '**Q1 2026:**\n' +
            '- [x] Bokslutsförberedelser\n' +
            '- [ ] Årsredovisning (deadline: 31 jul)\n' +
            '- [ ] Årsstämma\n\n' +
            '**Q2 2026:**\n' +
            '- [ ] Inkomstdeklaration\n' +
            '- [ ] Ev. utdelning\n\n' +
            'Vill du lägga till eller uppdatera något?'
        )
    }
}

export const handelserAgent = new HandelserAgent()
