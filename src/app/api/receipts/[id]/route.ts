/**
 * Receipt CRUD API
 *
 * DELETE: Remove a receipt
 *
 * Security: Uses withAuthParams wrapper with RLS enforcement
 */

import { NextRequest } from "next/server"
import { withAuthParams, ApiResponse } from "@/lib/database/auth-server"

export const DELETE = withAuthParams(async (_request: NextRequest, { supabase }, { id }) => {
    const { error } = await supabase
        .from('receipts')
        .delete()
        .eq('id', id)

    if (error) {
        console.error(`Failed to delete receipt ${id}:`, error)
        return ApiResponse.serverError('Failed to delete receipt')
    }

    return ApiResponse.success({})
})
