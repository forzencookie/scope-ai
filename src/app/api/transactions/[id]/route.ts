/**
 * Transaction Update API
 *
 * Security: Uses withAuthParams wrapper with RLS enforcement
 */

import { NextRequest } from "next/server"
import { withAuthParams, ApiResponse } from "@/lib/database/auth-server"

export const PATCH = withAuthParams(async (request: NextRequest, { supabase }, { id }) => {
    const body = await request.json()

    if (!body || typeof body !== 'object') {
        return ApiResponse.badRequest('Invalid body')
    }

    // Update transaction via RLS-protected client
    const { data: updated, error } = await supabase
        .from('transactions')
        .update(body)
        .eq('id', id)
        .select()
        .single()

    if (error) console.error(`[Transactions] update error for ${id}:`, error)

    if (!updated) {
        return ApiResponse.notFound('Transaction not found or update failed')
    }

    return ApiResponse.success({ data: updated })
})
