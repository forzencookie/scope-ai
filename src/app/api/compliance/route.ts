/**
 * Compliance API (Shareholders, Corporate Documents)
 *
 * Security: Uses withAuth wrapper with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server"
import { withAuth, ApiResponse } from "@/lib/database/auth-server"

export const GET = withAuth(async (request, { supabase }) => {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (type === 'shareholders') {
        const { data: shareholders, error } = await supabase
            .from('shareholders')
            .select('*')

        if (error) throw error;
        return NextResponse.json({ data: shareholders || [] })
    }

    const { data: documents, error } = await supabase
        .from('meetings')
        .select('*')

    if (error) throw error;
    return NextResponse.json({ data: documents || [] })
})

export const POST = withAuth(async (request, { supabase, userId, companyId }) => {
    const body = await request.json()
    // Use 'action' key to avoid collision with document's 'type' field
    const { action, ...data } = body

    if (action === 'document') {
        // Note: corporate_documents doesn't have company_id column, only user_id
        const insertData = { ...data, user_id: userId }
        const { data: newDoc, error } = await supabase
            .from('meetings')
            .insert(insertData)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ data: newDoc })
    }

    if (action === 'document_update') {
        const { id, ...updates } = data
        const { data: updated, error } = await supabase
            .from('meetings')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId) // Ensure user owns this document
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ data: updated })
    }

    if (action === 'shareholder_update') {
        const { id, ...updates } = data
        const { data: updated, error } = await supabase
            .from('shareholders')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ data: updated })
    }

    if (action === 'shareholder_create') {
        const { id: _id, ...newShareholder } = data
        const { data: created, error } = await supabase
            .from('shareholders')
            .insert({ ...newShareholder, company_id: companyId })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ data: created })
    }

    return ApiResponse.badRequest('Invalid compliance action type')
})
