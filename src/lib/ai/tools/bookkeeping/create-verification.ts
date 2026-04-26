
import { AITool, InteractionContext } from "@/lib/ai/tools/types"
import { verificationService } from '@/services/accounting'
import { createSimpleEntry, validateJournalEntry, generateEntryId } from '@/services/accounting'

interface VerificationRow {
    account: string
    description?: string
    debit?: number
    credit?: number
}

export const createVerificationTool: AITool = {
    name: "create_verification",
    description: "Proposes a new manual journal entry (verification). Use this when user wants to book something manually. Requires balanced debit/credit rows.",
    requiresConfirmation: true,
    category: 'write',
    domain: 'bokforing',
    keywords: ['verifikation', 'bokföring', 'kontering', 'debet', 'kredit'],
    parameters: {
        type: 'object',
        properties: {
            description: { type: 'string', description: 'Description of the transaction' },
            date: { type: 'string', description: 'Date YYYY-MM-DD. Defaults to today.' },
            rows: {
                type: 'array',
                description: 'List of transaction rows. Must balance.',
                items: {
                    type: 'object',
                    properties: {
                        account: { type: 'string', description: 'Account number (e.g. 1930)' },
                        description: { type: 'string', description: 'Row specific description if different' },
                        debit: { type: 'number', description: 'Debit amount' },
                        credit: { type: 'number', description: 'Credit amount' }
                    },
                    required: ['account']
                }
            }
        },
        required: ['description', 'rows']
    },

    execute: async (params: unknown, context: InteractionContext) => {
        const { description, date, rows } = params as { description: string, date?: string, rows: VerificationRow[] }
        const entryDate = date || new Date().toISOString().split('T')[0]

        // 1. Manually construct the JournalEntry following the internal model
        const entry = {
            id: generateEntryId(),
            series: 'A', // Default to A series for manual entries
            date: entryDate,
            description,
            rows: rows.map(r => ({
                account: r.account,
                debit: r.debit || 0,
                credit: r.credit || 0,
                description: r.description
            })),
            finalized: false,
            createdAt: new Date().toISOString(),
        }

        // 2. Validate the entry using the Bookkeeping Engine
        const validation = validateJournalEntry(entry)
        if (!validation.valid) {
            return {
                success: false,
                error: `Ogiltig verifikation: ${validation.errors.join(', ')}`,
            }
        }


        // 3. Persistence flow
        if (context?.isConfirmed) {
            try {
                // Pass the engine-validated entry to the service for DB persistence
                // This guarantees sequential numbering and period lock checks
                const verification = await verificationService.createVerification({
                    series: entry.series || 'A',
                    date: entry.date,
                    description: entry.description,
                    entries: entry.rows.map(r => ({
                        account: r.account,
                        debit: r.debit,
                        credit: r.credit,
                        description: r.description || entry.description,
                    })),
                    sourceType: 'ai_entry',
                })

                return {
                    success: true,
                    data: {
                        verificationId: verification.id,
                        verificationNumber: `${verification.series}${verification.number}`,
                    },
                    message: `Verifikation ${verification.series}${verification.number} "${description}" har bokförts.`,
                }
            } catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Kunde inte spara verifikationen.',
                }
            }
        }

        // 4. Preflight UI: return confirmation request
        const totalAmount = entry.rows.reduce((sum, r) => sum + r.debit, 0)

        return {
            success: true,
            message: `Jag har förberett ett verifikat för "${description}". Bekräfta för att bokföra.`,
            confirmationRequired: {
                title: `Vill du bokföra "${description}"?`,
                description: "Detta skapar en verifikation i bokföringen.",
                summary: [
                    { label: "Verifikation", value: description },
                    { label: "Datum", value: entry.date },
                    { label: "Rader", value: `${entry.rows.length} rader` },
                    { label: "Belopp", value: `${totalAmount.toLocaleString('sv-SE')} kr` },
                ],
                action: {
                    toolName: "create_verification",
                    params: params as Record<string, unknown>
                }
            }
        }
    }
}
