/**
 * Receipt Agent
 * 
 * Specialized agent for receipt handling:
 * - Receipt image parsing and OCR
 * - Expense categorization
 * - VAT extraction
 * - Automatic booking suggestions
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

const RECEIPT_PROMPT = `# Receipt Agent

You are an expert in handling receipts and expenses for Swedish businesses. Always respond in Swedish.

## Responsibilities
- **Receipt parsing**: Analyze receipt images, extract data
- **Categorization**: Suggest correct expense category and account
- **VAT extraction**: Identify and calculate VAT amounts (moms)
- **Booking suggestions**: Create kontering proposals

## Common Categories & Accounts
| Category | Account | VAT |
|----------|---------|-----|
| Office supplies (Kontorsmaterial) | 5410 | 25% |
| Consumables (Förbrukningsmaterial) | 5460 | 25% |
| Phone/Data (Telefon) | 6212 | 25% |
| Entertainment external (Representation extern) | 6071 | Not deductible |
| Entertainment internal (Representation intern) | 6072 | Not deductible |
| Travel (Resor) | 5800 | Varies |
| Software (Programvara) | 5420 | 25% |
| Books/Magazines | 6990 | 6% |
| Food (staff) | 7699 | 12% |

## VAT Rules for Receipts
- Verify seller has F-skatt for VAT deduction
- Entertainment: Max 300 SEK/person deductible, VAT NOT deductible
- Wellness (Friskvård): VAT not deductible
- Personal expenses: Require approved expense report

## Behavior
- Analyze receipt images carefully
- Ask if unclear (blurry image, missing info)
- Always suggest account code + VAT
- Flag if VAT deduction may be questioned

## Tone
- Quick and efficient
- Confirm what you see
- Give clear booking suggestions

## Block Composition
When composing walkthrough blocks for this domain:
- **Receipt grid** ("visa kvitton oktober"): heading → photo-grid (receipt thumbnails with status) → prose
- **Single receipt** ("visa kvitto #123"): key-value (supplier, amount, date, account, VAT) — or Mode A chat
- **Missing receipts** ("vilka kvitton saknas?"): heading → info-card (warning count) → data-table → prose
- **Categorization review**: heading → collapsed-group (per category) → action-bar
`

// =============================================================================
// Agent Implementation
// =============================================================================

export class ReceiptAgent extends BaseAgent {
    id: AgentDomain = 'receipts'
    name = 'Kvittoagent'
    description = 'Hanterar kvittotolkning, kategorisering och bokföringsförslag'
    
    capabilities = [
        'kvitto',
        'receipt',
        'utgift',
        'expense',
        'utlägg',
        'bild',
        'foto',
        'OCR',
        'kategorisera',
        'moms',
    ]
    
    tools = [
        'create_receipt',
        'get_receipts',
        'extract_receipt',
        'categorize_expense',
        'get_categories',
    ]
    
    systemPrompt = RECEIPT_PROMPT
    preferredModel = 'claude-sonnet-4-20250514'  // Good at vision tasks

    /**
     * Handle receipt requests.
     */
    async handle(message: string, context: AgentContext): Promise<AgentResponse> {
        this.log('info', 'Handling receipt request', { message: message.substring(0, 100) })

        // Check if there's an image in context
        const hasImage = this.checkForImage(context)

        if (hasImage) {
            return this.handleImageUpload(message, context)
        }

        // Check intent
        const intent = context.intent

        if (intent?.subIntent === 'query') {
            return this.handleQuery(message, context)
        }

        if (intent?.subIntent === 'create') {
            return this.handleManualCreate(message, context)
        }

        // Default: explain capabilities
        return this.handleGeneral(message, context)
    }

    /**
     * Handle receipt image upload.
     */
    private async handleImageUpload(message: string, context: AgentContext): Promise<AgentResponse> {
        // In production, this would call vision API to extract receipt data
        // For now, simulate extraction

        const extracted = await this.extractReceiptData(context)

        if (!extracted) {
            return this.successResponse(
                'Jag kunde inte läsa kvittot tydligt. 📷\n\n' +
                'Tips:\n' +
                '- Se till att hela kvittot syns\n' +
                '- Bra belysning hjälper\n' +
                '- Undvik skuggor\n\n' +
                'Vill du ladda upp en ny bild?'
            )
        }

        const suggestion = this.suggestBooking(extracted)

        return this.successResponse(
            `**Kvitto från ${extracted.vendor}** 🧾\n\n` +
            `Belopp: **${extracted.total} kr**\n` +
            `Moms: ${extracted.vat} kr (${extracted.vatRate}%)\n` +
            `Datum: ${extracted.date}\n\n` +
            `**Förslag:**\n` +
            `Konto ${suggestion.account} - ${suggestion.name}\n\n` +
            `Stämmer det?`,
            {
                display: {
                    type: 'card',
                    cardType: 'ReceiptCard',
                    data: {
                        ...extracted,
                        suggestion,
                    },
                },
                confirmationRequired: {
                    id: crypto.randomUUID(),
                    action: 'Bokför kvitto',
                    type: 'create',
                    data: { ...extracted, suggestion },
                    toolName: 'create_receipt',
                    toolParams: {
                        vendor: extracted.vendor,
                        amount: extracted.total,
                        vat: extracted.vat,
                        vatRate: extracted.vatRate,
                        date: extracted.date,
                        account: suggestion.account,
                        category: suggestion.category,
                    },
                },
            }
        )
    }

    /**
     * Handle receipt queries.
     */
    private async handleQuery(message: string, context: AgentContext): Promise<AgentResponse> {
        const result = await this.executeTool('get_receipts', {
            limit: 20,
        }, context)

        if (!result.success) {
            return this.errorResponse(result.error || 'Kunde inte hämta kvitton')
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const receipts = result.result as any[]

        if (!receipts || receipts.length === 0) {
            return this.successResponse(
                'Inga kvitton hittades. Ladda upp ett kvitto så bokför jag det åt dig! 📸'
            )
        }

        const total = receipts.reduce((sum, r) => sum + (r.amount || 0), 0)

        return this.successResponse(
            `Hittade ${receipts.length} kvitton, totalt ${total.toLocaleString('sv-SE')} kr.`,
            {
                display: {
                    type: 'table',
                    data: receipts,
                },
            }
        )
    }

    /**
     * Handle manual receipt creation.
     */
    private async handleManualCreate(message: string, context: AgentContext): Promise<AgentResponse> {
        const entities = context.intent?.entities || []
        const amount = entities.find(e => e.type === 'amount')?.value

        if (!amount) {
            return this.successResponse(
                'För att registrera ett kvitto manuellt behöver jag:\n\n' +
                '1. **Belopp** (inkl. moms)\n' +
                '2. **Leverantör/butik**\n' +
                '3. **Vad det gäller**\n\n' +
                'Till exempel: "450 kr Clas Ohlson kontorsmaterial"'
            )
        }

        return this.successResponse(
            `Jag ser ${amount}. Vad är det för typ av utgift? ` +
            '(kontorsmaterial, resa, representation, etc.)'
        )
    }

    /**
     * Handle general receipt questions.
     */
    private async handleGeneral(_message: string, _context: AgentContext): Promise<AgentResponse> {
        return this.successResponse(
            '📸 **Ladda upp ett kvitto** så analyserar jag det och föreslår bokföring!\n\n' +
            'Jag kan:\n' +
            '- Läsa av belopp och moms automatiskt\n' +
            '- Föreslå rätt konto och kategori\n' +
            '- Bokföra direkt efter din bekräftelse\n\n' +
            'Du kan också:\n' +
            '- "Visa mina kvitton" - se alla registrerade\n' +
            '- "Lägg till kvitto 450 kr Clas Ohlson" - registrera manuellt'
        )
    }

    /**
     * Check if context contains an image.
     */
    private checkForImage(context: AgentContext): boolean {
        // Check shared memory for uploaded image
        return !!context.sharedMemory['uploadedImage']
    }

    /**
     * Extract data from receipt image.
     */
    private async extractReceiptData(_context: AgentContext): Promise<{
        vendor: string
        total: number
        vat: number
        vatRate: number
        date: string
        items?: string[]
    } | null> {
        // In production, this would call vision API
        // For now, return mock data
        
        return {
            vendor: 'Clas Ohlson',
            total: 450,
            vat: 90,
            vatRate: 25,
            date: new Date().toISOString().split('T')[0],
            items: ['USB-kabel', 'Skrivbordslampa'],
        }
    }

    /**
     * Suggest booking based on extracted data.
     */
    private suggestBooking(data: {
        vendor: string
        total: number
        items?: string[]
    }): {
        account: string
        name: string
        category: string
    } {
        const vendor = data.vendor.toLowerCase()

        // Vendor-based suggestions
        const vendorMap: Record<string, { account: string; name: string; category: string }> = {
            'clas ohlson': { account: '5410', name: 'Förbrukningsinventarier', category: 'kontorsmaterial' },
            'ica': { account: '6072', name: 'Intern representation', category: 'fika' },
            'willys': { account: '6072', name: 'Intern representation', category: 'fika' },
            'pressbyrån': { account: '6990', name: 'Övriga externa kostnader', category: 'övrigt' },
            'apoteket': { account: '7699', name: 'Övriga personalkostnader', category: 'personal' },
            'webhallen': { account: '5410', name: 'Förbrukningsinventarier', category: 'elektronik' },
            'dustin': { account: '5410', name: 'Förbrukningsinventarier', category: 'elektronik' },
        }

        for (const [key, value] of Object.entries(vendorMap)) {
            if (vendor.includes(key)) {
                return value
            }
        }

        // Default
        return {
            account: '5410',
            name: 'Förbrukningsinventarier',
            category: 'övrigt',
        }
    }

    /**
     * Filter relevant memory keys.
     */
    protected isRelevantMemoryKey(key: string): boolean {
        return key.startsWith('receipt') ||
               key.startsWith('expense') ||
               key.startsWith('upload') ||
               key.startsWith('image')
    }
}

// Export instance
export const receiptAgent = new ReceiptAgent()
