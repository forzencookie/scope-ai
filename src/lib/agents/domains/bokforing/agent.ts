/**
 * Bokföring Agent
 * 
 * Specialized agent for accounting operations:
 * - Verifications and bookkeeping
 * - Chart of accounts (BAS kontoplan)
 * - Bank transaction matching
 * - Transaction queries
 */

import { BaseAgent } from '../../base-agent'
import type {
    AgentDomain,
    AgentContext,
    AgentResponse,
} from '../../types'

// =============================================================================
// System Prompt
// =============================================================================

const BOKFORING_PROMPT = `# Accounting Agent

You are an expert in Swedish bookkeeping and accounting. Always respond in Swedish.

## Responsibilities
- **Verifikationer**: Create, view, and correct journal entries
- **Kontoplan**: BAS chart of accounts, account lookup, booking suggestions
- **Bank matching**: Match bank transactions to verifications
- **Transactions**: Search and analyze transactions

## BAS Chart of Accounts Reference
- **1xxx**: Assets (1910 Kassa, 1930 Bank, 1510 Kundfordringar)
- **2xxx**: Liabilities & Equity (2440 Leverantörsskulder, 2610 Utgående moms)
- **3xxx**: Revenue (3010 Försäljning, 3740 Öres/kronutjämning)
- **4xxx**: Materials/Goods (4010 Inköp varor)
- **5-6xxx**: Other expenses (5010 Lokalhyra, 5410 Förbrukningsmaterial, 6212 Mobiltelefon)
- **7xxx**: Personnel (7010 Löner, 7510 Arbetsgivaravgifter)
- **8xxx**: Financial (8310 Ränteintäkter, 8410 Räntekostnader)

## VAT Rules (Moms)
- 25%: Standard (most goods/services)
- 12%: Food, hotels, restaurants
- 6%: Books, newspapers, passenger transport
- 0%: Export, healthcare, education

## Behavior
- Always suggest account codes with reasoning
- Ask if uncertain about VAT deductions
- Warn about unusual bookings
- Follow god redovisningssed (Swedish GAAP)

## Tone
- Professional but friendly
- Concise and clear
- Use Swedish accounting terms (verifikation, kontering, etc.)

## Block Composition
When composing walkthrough blocks for this domain:
- **Transaction overview** ("visa transaktioner oktober"): heading → info-card (if warnings) → data-table → prose
- **Kontering flow** ("kontera januari"): heading → callout (unmatched) → timeline (grouped by day, choices per item) → action-bar
- **Missing receipts** ("vilka kvitton saknas?"): heading → info-card (warning) → data-table (missing items) → prose
- **Account lookup**: Mode A chat response, no walkthrough
- Collapse already-matched transactions in a collapsed-group
- Zero-confidence items go FIRST
`

// =============================================================================
// Agent Implementation
// =============================================================================

export class BokforingAgent extends BaseAgent {
    id: AgentDomain = 'bokforing'
    name = 'Bokföringsagent'
    description = 'Hanterar verifikationer, kontoplan och bankmatchning'
    
    capabilities = [
        'verifikation',
        'kontering',
        'bokföring',
        'transaktion',
        'konto',
        'BAS',
        'debet',
        'kredit',
        'huvudbok',
        'bank',
        'matchning',
    ]
    
    tools = [
        'create_verification',
        'get_transactions',
        'get_accounts',
        'match_transaction',
        'get_verifications',
        'update_verification',
    ]
    
    systemPrompt = BOKFORING_PROMPT
    preferredModel = 'gpt-4o'

    /**
     * Handle bookkeeping requests.
     */
    async handle(message: string, context: AgentContext): Promise<AgentResponse> {
        this.log('info', 'Handling request', { message: message.substring(0, 100) })

        const intent = context.intent

        // Route based on sub-intent
        if (intent?.subIntent === 'create') {
            return this.handleCreate(message, context)
        }

        if (intent?.subIntent === 'query') {
            return this.handleQuery(message, context)
        }

        if (this.isMatchingRequest(message)) {
            return this.handleMatching(message, context)
        }

        // Default: try to understand what they want
        return this.handleGeneral(message, context)
    }

    /**
     * Handle verification creation.
     */
    private async handleCreate(message: string, context: AgentContext): Promise<AgentResponse> {
        // Extract entities from context
        const entities = context.intent?.entities || []
        const amount = entities.find(e => e.type === 'amount')?.value
        // const account = entities.find(e => e.type === 'account')?.value

        if (!amount) {
            return this.successResponse(
                'För att skapa en verifikation behöver jag veta beloppet. Vilket belopp ska bokföras?'
            )
        }

        // Suggest accounts based on context
        const suggestion = this.suggestAccounts(message, amount)

        return this.successResponse(
            `Jag föreslår följande kontering:\n\n` +
            `**Debet**: ${suggestion.debit.account} ${suggestion.debit.name} - ${amount}\n` +
            `**Kredit**: ${suggestion.credit.account} ${suggestion.credit.name} - ${amount}\n\n` +
            `Vill du att jag skapar verifikationen?`,
            {
                confirmationRequired: {
                    id: crypto.randomUUID(),
                    action: 'Skapa verifikation',
                    type: 'create',
                    data: {
                        amount,
                        debit: suggestion.debit,
                        credit: suggestion.credit,
                    },
                    toolName: 'create_verification',
                    toolParams: {
                        debitAccount: suggestion.debit.account,
                        creditAccount: suggestion.credit.account,
                        amount: parseFloat(amount.replace(/\s/g, '').replace(',', '.')),
                        description: message,
                    },
                },
            }
        )
    }

    /**
     * Handle transaction queries.
     * Uses LLM with block composition guidance to present results.
     */
    private async handleQuery(message: string, context: AgentContext): Promise<AgentResponse> {
        return this.generateResponse(message, context, {
            temperature: 0.7,
            maxToolIterations: 3,
        })
    }

    /**
     * Handle bank matching requests.
     */
    private async handleMatching(message: string, context: AgentContext): Promise<AgentResponse> {
        // Get unmatched transactions
        const result = await this.executeTool('get_transactions', {
            status: 'unmatched',
            limit: 20,
        }, context)

        if (!result.success) {
            return this.errorResponse(result.error || 'Kunde inte hämta omatchade transaktioner')
        }
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const unmatched = result.result as any[]

        if (!unmatched || unmatched.length === 0) {
            return this.successResponse(
                '✅ Alla banktransaktioner är matchade! Inget att göra här.'
            )
        }

        return this.successResponse(
            `Det finns ${unmatched.length} omatchade banktransaktioner. Vill du att jag försöker matcha dem automatiskt?`,
            {
                display: {
                    type: 'table',
                    data: unmatched.slice(0, 5),
                },
                confirmationRequired: {
                    id: crypto.randomUUID(),
                    action: 'Automatisk matchning',
                    type: 'update',
                    data: { count: unmatched.length },
                    toolName: 'match_transaction',
                    toolParams: { auto: true },
                },
            }
        )
    }

    /**
     * Handle general bookkeeping questions.
     * Uses LLM with the full system prompt for intelligent responses.
     */
    private async handleGeneral(message: string, context: AgentContext): Promise<AgentResponse> {
        // Check if asking about an account - use specialized handler
        if (/konto\s*\d{4}|vilket konto/i.test(message)) {
            return this.handleAccountQuestion(message, context)
        }

        // Use LLM for intelligent response
        // The LLM has access to tools and the full system prompt
        return this.generateResponse(message, context, {
            temperature: 0.7,
            maxToolIterations: 3,
        })
    }

    /**
     * Handle account lookup questions.
     * Uses LLM with system prompt that contains BAS chart knowledge.
     */
    private async handleAccountQuestion(message: string, context: AgentContext): Promise<AgentResponse> {
        // Use LLM - the system prompt contains full BAS chart knowledge
        return this.generateResponse(message, context, {
            temperature: 0.3, // Lower temp for more consistent account suggestions
            maxToolIterations: 1,
        })
    }

    /**
     * Check if message is about bank matching.
     */
    private isMatchingRequest(message: string): boolean {
        return /matcha|omatchad|bank.*transaktion|synk/i.test(message)
    }

    /**
     * Suggest debit/credit accounts based on message content.
     */
    private suggestAccounts(message: string, _amount: string): {
        debit: { account: string; name: string }
        credit: { account: string; name: string }
    } {
        const lowerMessage = message.toLowerCase()

        // Default expense booking
        let debit = { account: '5410', name: 'Förbrukningsinventarier' }
        let credit = { account: '1930', name: 'Företagskonto' }

        // Detect expense type
        if (/telefon|mobil/.test(lowerMessage)) {
            debit = { account: '6212', name: 'Mobiltelefon' }
        } else if (/hyra|lokal/.test(lowerMessage)) {
            debit = { account: '5010', name: 'Lokalhyra' }
        } else if (/program|mjukvara|licens/.test(lowerMessage)) {
            debit = { account: '5420', name: 'Programvaror' }
        } else if (/resa|taxi|flyg|tåg/.test(lowerMessage)) {
            debit = { account: '5800', name: 'Resekostnader' }
        }

        // Detect payment method
        if (/kort|kreditkort/.test(lowerMessage)) {
            credit = { account: '1930', name: 'Företagskonto' }
        } else if (/kontant|kassa/.test(lowerMessage)) {
            credit = { account: '1910', name: 'Kassa' }
        } else if (/faktura|leverantör/.test(lowerMessage)) {
            credit = { account: '2440', name: 'Leverantörsskulder' }
        }

        return { debit, credit }
    }

    /**
     * Filter relevant memory keys.
     */
    protected isRelevantMemoryKey(key: string): boolean {
        return key.startsWith('transaction') ||
               key.startsWith('verification') ||
               key.startsWith('account') ||
               key.startsWith('balance')
    }
}

// Export instance
export const bokforingAgent = new BokforingAgent()
