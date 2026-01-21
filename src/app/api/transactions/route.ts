import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/server-db"
import { verifyAuth, ApiResponse } from "@/lib/api-auth"

// Transaction type (simplified after bank API removal)
interface BankTransaction {
    id: string
    description: string
    amount: number
    date: string
    timestamp: string
}

// Helper to map BankTransaction to our App's Transaction type
function mapToAppTransaction(bankTx: BankTransaction, metadata: any = {}) {
    const isExpense = bankTx.amount < 0
    const absAmount = Math.abs(bankTx.amount)

    // Default values
    const defaultStatus = 'Att bokföra'
    const defaultCategory = 'Okategoriserad'
    const defaultAccount = ''

    return {
        id: bankTx.id,
        name: metadata.description || bankTx.description, // User might rename description
        date: bankTx.date,
        timestamp: new Date(bankTx.timestamp),
        amount: `${isExpense ? '-' : ''}${absAmount.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr`,
        amountValue: bankTx.amount,
        status: metadata.status || defaultStatus,
        category: metadata.category || defaultCategory,
        account: metadata.account || defaultAccount,
        iconName: 'Banknote',
        iconColor: 'bg-gray-100 text-gray-600',
        description: bankTx.description,
        // Add AI fields if available
        aiSuggestion: undefined,
        isAIApproved: false,
        ...metadata // Allow specific overrides
    }
}

export async function GET(request: NextRequest) {
    try {
        // Verify authentication
        const auth = await verifyAuth(request)
        if (!auth) {
            return ApiResponse.unauthorized('Authentication required')
        }

        const data = await db.get()
        const metadata: Record<string, any> = data.transactionMetadata || {}

        // Map BankTransactions to AppTransactions, overlaying metadata
        // TODO: Filter by user ID when user_id column is properly used
        const transactions = data.transactions.map((tx: any) =>
            mapToAppTransaction(tx, metadata[tx.id] || {})
        )

        return NextResponse.json({
            success: true,
            data: transactions,
            timestamp: new Date()
        })
    } catch (error) {
        console.error('Transactions API error:', error)
        return ApiResponse.serverError('Failed to fetch transactions')
    }
}
