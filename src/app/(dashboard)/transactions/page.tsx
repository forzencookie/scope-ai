import { Metadata } from "next"
import { TransactionsTable, type AISuggestionsMap } from "@/components/transactions"
import { mockTransactions, mockAISuggestions } from "@/data/transactions"

export const metadata: Metadata = {
    title: "Transaktioner | Bokio",
    description: "Hantera dina transaktioner och bokföringar",
}

/**
 * Transactions Page
 * 
 * Displays all transactions with AI categorization suggestions.
 * 
 * In production, transactions and AI suggestions would be fetched from:
 * - Supabase database (via transactions-unified service)
 * - AI service for categorization suggestions
 * 
 * For now, we use mock data for development.
 */
export default function TransactionsPage() {
    // TODO: Replace with server-side data fetching
    // const { data: transactions } = await transactionService.getTransactions(userId)
    // const { data: aiSuggestions } = await transactionService.getAISuggestionsMap(userId)
    
    const transactions = mockTransactions
    const aiSuggestions: AISuggestionsMap = mockAISuggestions

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Transaktioner</h1>
                    <p className="text-sm text-muted-foreground">
                        Hantera och kategorisera dina banktransaktioner
                    </p>
                </div>
            </div>
            
            <TransactionsTable 
                title="Alla transaktioner"
                subtitle={`${transactions.length} transaktioner totalt`}
                transactions={transactions}
                aiSuggestions={aiSuggestions}
            />
        </div>
    )
}
