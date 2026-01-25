import { NextRequest, NextResponse } from "next/server"
import { parseSIE } from '@/lib/parsers/sie-parser'
import { createUserScopedDb } from '@/lib/database/user-scoped-db'
import { randomUUID } from "crypto"

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            )
        }

        const text = await file.text()
        const data = parseSIE(text)

        // Get user-scoped database connection
        const userDb = await createUserScopedDb()
        if (!userDb) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }
        const supabase = userDb.client
        const userId = userDb.userId

        // Track import statistics
        let transactionsInserted = 0
        let accountBalancesInserted = 0
        const errors: string[] = []

        // Insert verifications as transactions
        for (const ver of data.verifications) {
            // Each verification row becomes a transaction
            for (const row of ver.rows) {
                const transactionId = randomUUID()
                
                // Find account name from parsed accounts
                const account = data.accounts.find(a => a.number === row.account)
                const accountName = account?.name || `Konto ${row.account}`
                
                const { error } = await supabase
                    .from('transactions')
                    .insert({
                        id: transactionId,
                        name: ver.description || `${ver.series}${ver.verNumber}`,
                        date: formatSIEDate(ver.date),
                        timestamp: formatSIEDate(ver.date),
                        amount: formatAmount(row.amount),
                        amount_value: row.amount,
                        currency: 'SEK',
                        status: 'Bokförd',
                        category: accountName,
                        account: row.account,
                        description: `Importerad från SIE: ${ver.series}${ver.verNumber}`,
                        source: 'sie_import',
                        external_id: `${ver.series}${ver.verNumber}-${row.account}`,
                        voucher_id: `${ver.series}${ver.verNumber}`,
                        booked_at: new Date().toISOString(),
                        user_id: userId,
                    } as never)

                if (error) {
                    // Skip duplicates (same external_id)
                    if (!error.message?.includes('duplicate')) {
                        errors.push(`Ver ${ver.series}${ver.verNumber}: ${error.message}`)
                    }
                } else {
                    transactionsInserted++
                }
            }
        }

        // Insert/update account balances
        for (const balance of data.balances) {
            // Determine period based on balance type (IB = period 0, UB = period 12)
            const period = balance.year === 0 ? 
                data.fiskalYear[0]?.start?.slice(0, 7) || new Date().toISOString().slice(0, 7) :
                data.fiskalYear[0]?.end?.slice(0, 7) || new Date().toISOString().slice(0, 7)

            const { error } = await supabase
                .from('accountbalances')
                .upsert({
                    user_id: userId,
                    account_number: balance.account,
                    period,
                    balance: balance.amount,
                    updated_at: new Date().toISOString(),
                } as never, {
                    onConflict: 'user_id,account_number,period'
                })

            if (error) {
                if (!error.message?.includes('duplicate')) {
                    errors.push(`Balance ${balance.account}: ${error.message}`)
                }
            } else {
                accountBalancesInserted++
            }
        }

        return NextResponse.json({
            success: true,
            stats: {
                verifications: data.verifications.length,
                accounts: data.accounts.length,
                balances: data.balances.length,
                transactionsInserted,
                accountBalancesInserted,
                period: data.fiskalYear[0] ? `${data.fiskalYear[0].start} - ${data.fiskalYear[0].end}` : 'N/A'
            },
            errors: errors.length > 0 ? errors : undefined
        })
    } catch (error) {
        console.error("SIE Import error:", error)
        return NextResponse.json(
            { error: "Failed to parse SIE file" },
            { status: 500 }
        )
    }
}

/**
 * Format SIE date (YYYYMMDD) to ISO format
 */
function formatSIEDate(sieDate: string): string {
    if (!sieDate || sieDate.length !== 8) {
        return new Date().toISOString()
    }
    const year = sieDate.slice(0, 4)
    const month = sieDate.slice(4, 6)
    const day = sieDate.slice(6, 8)
    return `${year}-${month}-${day}T00:00:00Z`
}

/**
 * Format amount for display
 */
function formatAmount(amount: number): string {
    const formatted = new Intl.NumberFormat('sv-SE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Math.abs(amount))
    return amount < 0 ? `-${formatted} kr` : `${formatted} kr`
}
