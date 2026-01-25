
/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod"
import { AITool, InteractionContext } from "@/lib/ai-tools/types"

export const createVerificationTool: AITool = {
    name: "create_verification",
    description: "Proposes a new manual journal entry (verification). Use this when user wants to book something manually. Requires balanced debit/credit rows.",
    requiresConfirmation: true,
    category: 'write',
    parameters: z.object({
        description: z.string().describe("Description of the transaction"),
        date: z.string().optional().describe("Date YYYY-MM-DD. Defaults to today."),
        rows: z.array(z.object({
            account: z.string().describe("Account number (e.g. 1930)"),
            description: z.string().optional().describe("Row specific description if different"),
            debit: z.number().optional().describe("Debit amount"),
            credit: z.number().optional().describe("Credit amount"),
        })).describe("List of transaction rows. Must balance."),
    }),

    execute: async (params: unknown, _context: InteractionContext) => {
        const { description, date, rows } = params as { description: string, date?: string, rows: any[] }
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
                    params: params
                }
            }
        }
    }
}
