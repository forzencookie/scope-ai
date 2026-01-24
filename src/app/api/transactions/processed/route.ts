// @ts-nocheck
/**
 * Processed Transactions API
 * 
 * This endpoint reads transactions from Supabase filtered by the
 * authenticated user's company (via RLS), then processes them
 * through the transaction-processor service to add display properties.
 * 
 * Security: Uses user-scoped DB access with RLS enforcement
 */

import { NextResponse } from "next/server"
import {
  processTransactions,
  type NakedTransaction,
} from "@/services/transaction-processor"
import { createUserScopedDb } from "@/lib/user-scoped-db"

/**
 * GET /api/transactions/processed
 * Returns fully processed transactions for the authenticated user
 */
export async function GET() {
  try {
    // 1. Get user-scoped database access (enforces RLS)
    const userDb = await createUserScopedDb()
    
    if (!userDb) {
      return NextResponse.json(
        { error: 'Unauthorized', transactions: [] },
        { status: 401 }
      )
    }

    // 2. Fetch transactions - RLS automatically filters by user's company
    const rawTransactions = await userDb.transactions.list({ limit: 100 })

    // 3. Transform to naked transaction format for processing
    const nakedTransactions: NakedTransaction[] = rawTransactions.map((tx) => ({
      id: tx.id,
      name: tx.description || '',
      amount: typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount || '0'),
      date: tx.date || tx.occurred_at || new Date().toISOString(),
      account: tx.account || 'Företagskonto',
      reference: tx.reference || undefined,
    }))

    // 4. Process (clothe) the naked transactions with AI, icons, status
    const processedTransactions = processTransactions(nakedTransactions)

    // 5. Merge with original metadata from DB
    const mergedTransactions = processedTransactions.map((pt, index) => {
      const original = rawTransactions[index]
      if (original) {
        return {
          ...pt,
          status: original.status || pt.status,
          category: original.category || pt.category,
        }
      }
      return pt
    })

    return NextResponse.json({
      transactions: mergedTransactions,
      count: mergedTransactions.length,
      userId: userDb.userId,
      companyId: userDb.companyId,
    })

  } catch (error) {
    console.error('Error processing transactions:', error)
    return NextResponse.json(
      { error: 'Failed to process transactions', transactions: [] },
      { status: 500 }
    )
  }
}

