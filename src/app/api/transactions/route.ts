/**
 * Transactions API
 *
 * Security: Uses getAuthContext() with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/database/auth-server"

// Helper to format transaction for frontend
function formatTransaction(tx: Record<string, unknown>) {
    const amount = Number(tx.amount) || 0
    const isExpense = amount < 0
    const absAmount = Math.abs(amount)

    return {
        id: tx.id,
        name: tx.description || '',
        date: tx.date || tx.occurred_at,
        timestamp: tx.created_at,
        amount: `${isExpense ? '-' : ''}${absAmount.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr`,
        amountValue: amount,
        status: tx.status || 'Obokförd',
        category: tx.category || 'Okategoriserad',
        account: tx.account || '',
        iconName: 'Banknote',
        iconColor: 'bg-gray-100 text-gray-600',
        description: tx.description,
    }
}

export async function GET(request: NextRequest) {
    try {
        const ctx = await getAuthContext();

        if (!ctx) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { supabase, userId, companyId } = ctx;

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '200', 10);
        const startDate = searchParams.get('startDate') || undefined;
        const endDate = searchParams.get('endDate') || undefined;
        const status = searchParams.get('status') || undefined;

        let query = supabase
            .from('transactions')
            .select('*')
            .order('date', { ascending: false })
            .limit(limit);

        if (startDate) query = query.gte('date', startDate);
        if (endDate) query = query.lte('date', endDate);
        if (status) query = query.eq('status', status);

        const { data: transactions, error } = await query;
        if (error) console.error('[Transactions] list error:', error);

        return NextResponse.json({
            success: true,
            transactions: (transactions || []).map(tx => formatTransaction(tx as Record<string, unknown>)),
            userId,
            companyId,
            timestamp: new Date()
        })
    } catch (error) {
        console.error('Transactions API error:', error)
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const ctx = await getAuthContext();

        if (!ctx) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { supabase, userId, companyId } = ctx;

        const body = await request.json();

        const { data: transaction, error } = await supabase
            .from('transactions')
            .insert({ ...body, user_id: body.user_id ?? userId, company_id: body.company_id ?? companyId })
            .select()
            .single();

        if (error) console.error('[Transactions] create error:', error);

        if (!transaction) {
            return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            transaction: formatTransaction(transaction as Record<string, unknown>),
        });
    } catch (error) {
        console.error('Transactions POST error:', error);
        return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }
}
