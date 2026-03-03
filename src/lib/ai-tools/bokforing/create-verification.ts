
import { AITool, InteractionContext } from "@/lib/ai-tools/types"
import { verificationService } from '@/services/verification-service'
import { isValidAccount } from '@/lib/bookkeeping/utils'

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

        // Validate account numbers against BAS kontoplan
        const invalidAccounts = rows
            .map(r => r.account)
            .filter(acc => !isValidAccount(acc))
        if (invalidAccounts.length > 0) {
            return {
                success: false,
                error: `Ogiltiga kontonummer: ${invalidAccounts.join(', ')}. Kontrollera att kontona finns i BAS-kontoplanen.`,
            }
        }

        // Validate balance
        const totalDebit = rows.reduce((sum, r) => sum + (r.debit || 0), 0)
        const totalCredit = rows.reduce((sum, r) => sum + (r.credit || 0), 0)

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            return {
                success: false,
                error: `Verifikationen balanserar inte. Debet: ${totalDebit} kr, Kredit: ${totalCredit} kr. Differens: ${Math.abs(totalDebit - totalCredit)} kr.`,
            }
        }

        // If confirmed in chat, create the verification directly (no double-confirm via pending)
        if (context?.isConfirmed) {
            try {
                const verification = await verificationService.createVerification({
                    series: 'A',
                    date: date || new Date().toISOString().split('T')[0],
                    description,
                    entries: rows.map(r => ({
                        account: r.account,
                        debit: r.debit || 0,
                        credit: r.credit || 0,
                        description: r.description || description,
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
                    error: error instanceof Error ? error.message : 'Kunde inte skapa verifikation.',
                }
            }
        }

        // Preflight: return confirmation request
        const rowSummary = rows.map(r =>
            `${r.account}: ${r.debit ? `D ${r.debit}` : ''} ${r.credit ? `K ${r.credit}` : ''}`
        ).join(', ')

        return {
            success: true,
            message: `Jag har förberett ett verifikat för "${description}". Bekräfta för att bokföra.`,
            confirmationRequired: {
                title: `Vill du bokföra "${description}"?`,
                description: "Detta skapar en verifikation i bokföringen.",
                summary: [
                    { label: "Verifikation", value: description },
                    { label: "Datum", value: date || new Date().toISOString().split('T')[0] },
                    { label: "Rader", value: `${rows.length} rader` },
                    { label: "Belopp", value: `${totalDebit.toLocaleString('sv-SE')} kr` },
                ],
                action: {
                    toolName: "create_verification",
                    params: params as Record<string, unknown>
                }
            }
        }
    }
}
