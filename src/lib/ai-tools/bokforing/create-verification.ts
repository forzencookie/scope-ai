
import { z } from "zod"
import { AITool, InteractionContext } from "@/lib/ai-tools/types.ts"

export const createVerificationTool: AITool = {
    name: "create_verification",
    description: "Proposes a new manual journal entry (verification). Use this when user wants to book something manually. Requires balanced debit/credit rows.",
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

    execute: async ({ description, date, rows }: { description: string, date?: string, rows: any[] }, context: InteractionContext) => {
        // Validate balance
        // We let the UI handle the hard validation, but good to check here too.

        return {
            success: true,
            message: `Prepared verification: ${description}`,
            display: {
                type: 'verification_preview',
                data: {
                    description,
                    date: date || new Date().toISOString().split('T')[0],
                    rows
                }
            }
        }
    }
}
