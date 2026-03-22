'use server'

import { getAuthContext } from "@/lib/database/auth-server"
import { bookTransaction } from "@/services/accounting/transactions"
import { revalidatePath } from "next/cache"

/**
 * Server Action to prepare a transaction for booking.
 * Encapsulates business logic and revalidates the UI.
 */
export async function bookTransactionAction(id: string, params: {
    category: string
    debitAccount: string
    creditAccount: string
    description?: string
    vatRate?: number
}) {
    const ctx = await getAuthContext()
    if (!ctx) {
        return { success: false, error: "Unauthorized" }
    }

    const { supabase, userId } = ctx

    try {
        const result = await bookTransaction(id, userId, params, supabase)
        
        if (result.success) {
            revalidatePath('/dashboard/bokforing/transaktioner')
        }
        
        return result
    } catch (error) {
        console.error('[Action] bookTransactionAction error:', error)
        return { 
            success: false, 
            error: error instanceof Error ? error.message : "Failed to book transaction" 
        }
    }
}
