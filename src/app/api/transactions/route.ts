/**
 * Transactions API
 *
 * Security: Uses withAuth wrapper with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server"
import { withAuth, ApiResponse } from "@/lib/database/auth-server"
import { nullToUndefined } from "@/lib/utils"

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

export const GET = withAuth(async (request, { supabase, userId, companyId }) => {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '200', 10);
    const startDate = nullToUndefined(searchParams.get('startDate'));
    const endDate = nullToUndefined(searchParams.get('endDate'));
    const status = nullToUndefined(searchParams.get('status'));

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
        transactions: (transactions || []).map(tx => formatTransaction(tx as Record<string, unknown>)),
        userId,
        companyId,
        timestamp: new Date()
    })
})

export const POST = withAuth(async (request, { supabase, userId, companyId }) => {
    const body = await request.json();

    const { data: transaction, error } = await supabase
        .from('transactions')
        .insert({ ...body, user_id: body.user_id ?? userId, company_id: body.company_id ?? companyId })
        .select()
        .single();

    if (error) console.error('[Transactions] create error:', error);

    if (!transaction) {
        return ApiResponse.serverError('Failed to create transaction');
    }

    return NextResponse.json({
        transaction: formatTransaction(transaction as Record<string, unknown>),
    });
})
