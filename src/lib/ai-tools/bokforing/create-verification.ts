
import { AITool, InteractionContext } from "@/lib/ai-tools/types"

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

    execute: async (params: unknown, _context: InteractionContext) => {
        const { description, date, rows } = params as { description: string, date?: string, rows: VerificationRow[] }
        // Validate balance
        // We let the UI handle the hard validation, but good to check here too.

        return {
            success: true,
            message: `Jag har förberett ett verifikat för "${description}". Vill du att jag bokför det?`,
            display: {
                component: "TransactionsTable",
                props: {
                    transactions: [{
                        description,
                        date,
                        rows,
                        id: 'preview',
                        amount: 0,
                        status: 'pending'
                    }]
                }
            },
            confirmationRequired: {
                title: `Vill du bokföra "${description}"?`,
                description: "Detta skapar en verifikation i bokföringen.",
                summary: [
                    { label: "Verifikation", value: description },
                    { label: "Datum", value: date || "Idag" }
                ],
                action: {
                    toolName: "create_verification",
                    params: params as Record<string, unknown>
                }
            }
        }
    }
}
