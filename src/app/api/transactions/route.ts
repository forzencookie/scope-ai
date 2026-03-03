/**
 * Transactions API
 * 
 * Security: Uses user-scoped DB access with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server"
import { createUserScopedDb } from '@/lib/database/user-scoped-db'

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
        status: tx.status || 'Att bokföra',
        category: tx.category || 'Okategoriserad',
        account: tx.account || '',
        iconName: 'Banknote',
        iconColor: 'bg-gray-100 text-gray-600',
        description: tx.description,
    }
}

export async function GET(request: NextRequest) {
    try {
        const userDb = await createUserScopedDb();

        if (!userDb) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '200', 10);
        const startDate = searchParams.get('startDate') || undefined;
        const endDate = searchParams.get('endDate') || undefined;
        const status = searchParams.get('status') || undefined;

        const transactions = await userDb.transactions.list({ limit, startDate, endDate, status });

        return NextResponse.json({
            success: true,
            transactions: transactions.map(formatTransaction),
            userId: userDb.userId,
            companyId: userDb.companyId,
            timestamp: new Date()
        })
    } catch (error) {
        console.error('Transactions API error:', error)
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const userDb = await createUserScopedDb();

        if (!userDb) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const transaction = await userDb.transactions.create(body);

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
