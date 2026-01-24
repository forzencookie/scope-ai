// @ts-nocheck - TODO: Fix after regenerating Supabase types
/**
 * Compliance API (Shareholders, Corporate Documents)
 * 
 * Security: Uses user-scoped DB access with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server"
import { createUserScopedDb } from '@/lib/database/user-scoped-db'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    try {
        const userDb = await createUserScopedDb();
        
        if (!userDb) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Use raw client for tables not yet in typed accessors
        const supabase = userDb.client;

        if (type === 'shareholders') {
            const { data: shareholders, error } = await supabase
                .from('shareholders')
                .select('*')
            
            if (error) throw error;
            return NextResponse.json({ success: true, data: shareholders || [] })
        }

        const { data: documents, error } = await supabase
            .from('corporate_documents')
            .select('*')
        
        if (error) throw error;
        return NextResponse.json({ success: true, data: documents || [] })
    } catch (error) {
        console.error('Compliance API GET error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch compliance data' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const userDb = await createUserScopedDb();
        
        if (!userDb) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json()
        const { type, ...data } = body
        const supabase = userDb.client;

        if (type === 'document') {
            const { data: newDoc, error } = await supabase
                .from('corporate_documents')
                .insert({ ...data, company_id: userDb.companyId })
                .select()
                .single();
            
            if (error) throw error;
            return NextResponse.json({ success: true, data: newDoc })
        }

        if (type === 'shareholder_update') {
            const { id, ...updates } = data
            const { data: updated, error } = await supabase
                .from('shareholders')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            return NextResponse.json({ success: true, data: updated })
        }

        if (type === 'shareholder_create') {
            const { id: _id, ...newShareholder } = data
            const { data: created, error } = await supabase
                .from('shareholders')
                .insert({ ...newShareholder, company_id: userDb.companyId })
                .select()
                .single();
            
            if (error) throw error;
            return NextResponse.json({ success: true, data: created })
        }

        return NextResponse.json(
            { success: false, error: 'Invalid compliance action type' },
            { status: 400 }
        )
    } catch (error) {
        console.error('Compliance API POST error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to process compliance action' },
            { status: 500 }
        )
    }
}
