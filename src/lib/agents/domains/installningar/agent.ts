/**
 * Inställningar Agent (Settings)
 * 
 * Specialized agent for platform configuration:
 * - Company settings
 * - Integrations (bank, accounting systems)
 * - User preferences
 * - Team management
 * - Billing
 */

import { BaseAgent } from '../../base-agent'
import type { AgentDomain, AgentContext, AgentResponse } from '../../types'

const INSTALLNINGAR_PROMPT = `# Settings Agent

You are an expert in platform configuration for Swedish businesses. Always respond in Swedish.

## Responsibilities
- **Company info**: Org.nr, address, fiscal year (räkenskapsår)
- **Integrations**: Bank, accounting systems, e-signing
- **User settings**: Language, notifications, appearance
- **Team**: Users, roles, permissions
- **Subscription**: Plan, payment, invoices

## Available Integrations
- **Banks**: SEB, Nordea, Handelsbanken, Swedbank
- **E-signing**: Scrive, BankID
- **Accounting**: Fortnox, Visma (import/export)
- **Payment**: Stripe, Swish

## User Roles
- **Owner (Ägare)**: Full access, can delete company
- **Admin**: Full access except ownership
- **Accountant (Bokförare)**: Bookkeeping, reports, documents
- **Reader (Läsare)**: Read-only access

## Tone
- Helpful and guiding
- Explain consequences of changes
- Confirm sensitive actions
`

export class InstallningarAgent extends BaseAgent {
    id: AgentDomain = 'installningar'
    name = 'Inställningsagent'
    description = 'Hanterar konfiguration, integrationer och teamhantering'
    
    capabilities = [
        'inställning', 'setting', 'integration', 'bank', 'koppla',
        'användare', 'team', 'prenumeration', 'plan', 'språk', 'notis'
    ]
    
    tools = [
        'get_company_settings', 'update_company_settings',
        'get_integrations', 'connect_integration', 'disconnect_integration',
        'get_team_members', 'invite_member', 'update_member_role',
        'get_billing_status', 'update_preferences'
    ]
    
    systemPrompt = INSTALLNINGAR_PROMPT
    preferredModel = 'gpt-4o-mini'

    async handle(message: string, context: AgentContext): Promise<AgentResponse> {
        const lowerMessage = message.toLowerCase()

        if (/bank|koppla|integration/.test(lowerMessage)) {
            return this.handleIntegrations(message, context)
        }

        if (/användare|team|bjud in|roll/.test(lowerMessage)) {
            return this.handleTeam(message, context)
        }

        if (/prenumeration|plan|betala|faktura/.test(lowerMessage)) {
            return this.handleBilling(message, context)
        }

        if (/språk|notis|utseende/.test(lowerMessage)) {
            return this.handlePreferences(message, context)
        }

        return this.successResponse(
            '⚙️ **Inställningar**\n\n' +
            'Jag kan hjälpa med:\n' +
            '- **Integrationer**: "Koppla min bank"\n' +
            '- **Team**: "Bjud in en användare"\n' +
            '- **Prenumeration**: "Vilken plan har jag?"\n' +
            '- **Preferenser**: "Ändra språk till engelska"\n\n' +
            'Vad vill du ändra?'
        )
    }

    private async handleIntegrations(message: string, context: AgentContext): Promise<AgentResponse> {
        return this.successResponse(
            '🔌 **Integrationer**\n\n' +
            '**Tillgängliga:**\n' +
            '- 🏦 **SEB** - Automatisk bankhämtning\n' +
            '- 🏦 **Nordea** - Automatisk bankhämtning\n' +
            '- 🏦 **Handelsbanken** - Automatisk bankhämtning\n' +
            '- 🏦 **Swedbank** - Automatisk bankhämtning\n' +
            '- ✍️ **BankID** - Digital signering\n' +
            '- 📊 **Fortnox** - Import/export\n\n' +
            '**Anslutna:**\n' +
            '- Inga integrationer kopplade ännu\n\n' +
            'Vilken vill du koppla?'
        )
    }

    private async handleTeam(message: string, context: AgentContext): Promise<AgentResponse> {
        return this.successResponse(
            '👥 **Team**\n\n' +
            '**Användare:**\n' +
            '| Namn | Roll | Status |\n' +
            '|------|------|--------|\n' +
            '| Du | Ägare | ✅ Aktiv |\n\n' +
            '**Bjud in:**\n' +
            'Skriv "Bjud in [email]" för att lägga till någon.\n\n' +
            '**Tillgängliga roller:**\n' +
            '- Ägare, Admin, Bokförare, Läsare'
        )
    }

    private async handleBilling(message: string, context: AgentContext): Promise<AgentResponse> {
        return this.successResponse(
            '💳 **Prenumeration**\n\n' +
            '**Din plan:** Pro\n' +
            '**Pris:** 499 kr/mån\n' +
            '**Nästa faktura:** 1 februari 2026\n\n' +
            '**Inkluderar:**\n' +
            '- Obegränsat antal transaktioner\n' +
            '- Alla AI-funktioner\n' +
            '- Bankintegration\n' +
            '- Upp till 5 användare\n\n' +
            'Vill du uppgradera eller se fakturor?'
        )
    }

    private async handlePreferences(message: string, context: AgentContext): Promise<AgentResponse> {
        return this.successResponse(
            '🎨 **Inställningar**\n\n' +
            '**Språk:** Svenska 🇸🇪\n' +
            '**Tema:** Systemet (ljust/mörkt)\n' +
            '**Notiser:** Aktiverade\n\n' +
            'Vad vill du ändra?\n' +
            '- "Byt till engelska"\n' +
            '- "Stäng av notiser"\n' +
            '- "Använd mörkt tema"'
        )
    }
}

export const installningarAgent = new InstallningarAgent()
