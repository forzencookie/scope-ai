/**
 * Closing Entry Service (Bokslutsposter)
 * 
 * Handles year-end closing entries for Swedish accounting:
 * 1. Close all revenue accounts (3xxx) → 8999
 * 2. Close all expense accounts (4xxx-8998) → 8999
 * 3. Transfer result: 8999 → 2099 (Årets resultat)
 * 
 * Per BAS chart of accounts, 8999 is the result transfer account,
 * and 2099 is the current year result on the balance sheet.
 */

import { getSupabaseClient } from '@/lib/database/supabase'
import { verificationService } from './verification-service'
import { taxService } from './tax-service'

// =============================================================================
// Types
// =============================================================================

export interface ClosingEntryLine {
    account: string
    accountName: string
    debit: number
    credit: number
    description: string
}

export interface ClosingEntryPreview {
    fiscalYear: number
    /** Revenue accounts to close (3000-3999) */
    revenueEntries: ClosingEntryLine[]
    /** Expense accounts to close (4000-8998) */
    expenseEntries: ClosingEntryLine[]
    /** Transfer line: 8999 → 2099 */
    resultTransfer: ClosingEntryLine[]
    /** Tax entry: profit × corporate tax rate → 2510/8910 */
    taxEntry: ClosingEntryLine[] | null
    /** Summary amounts */
    totalRevenue: number
    totalExpenses: number
    resultBeforeTax: number
    corporateTax: number
    netResult: number
    /** Whether closing entries already exist for this year */
    alreadyClosed: boolean
}

// =============================================================================
// Service
// =============================================================================

export const closingEntryService = {
    /**
     * Preview closing entries for a fiscal year without persisting anything.
     * Returns all journal lines that would be created.
     */
    async previewClosingEntries(year: number, companyType: 'AB' | 'EF' = 'AB'): Promise<ClosingEntryPreview> {
        const supabase = getSupabaseClient()

        // Check if already closed (look for series "Y" verifications in this year)
        const { data: existingClosing } = await supabase
            .from('verifications')
            .select('id')
            .eq('series', 'Y')
            .eq('fiscal_year', year)
            .limit(1)

        const alreadyClosed = (existingClosing?.length || 0) > 0

        // Fetch all account balances for the fiscal year using RPC
        const { data: balances, error } = await supabase.rpc('get_account_balances', {
            p_start_date: `${year}-01-01`,
            p_end_date: `${year}-12-31`
        })

        if (error) throw error

        const accountBalances = (balances || []).map((row: { account_number: number; balance: number; account_name: string | null }) => ({
            account: String(row.account_number),
            balance: row.balance,
            name: row.account_name || '',
        }))

        // Revenue accounts (3000-3999): RPC returns credit - debit, so positive = revenue
        const revenueAccounts = accountBalances.filter(a => {
            const n = parseInt(a.account)
            return n >= 3000 && n <= 3999 && Math.abs(a.balance) > 0.01
        })

        // Expense accounts (4000-8998): RPC returns credit - debit, so negative = expense
        const expenseAccounts = accountBalances.filter(a => {
            const n = parseInt(a.account)
            return n >= 4000 && n <= 8998 && Math.abs(a.balance) > 0.01
        })

        // Calculate totals
        const totalRevenue = revenueAccounts.reduce((sum, a) => sum + a.balance, 0) // positive
        const totalExpenses = expenseAccounts.reduce((sum, a) => sum + a.balance, 0) // negative
        const resultBeforeTax = totalRevenue + totalExpenses

        // Corporate tax (only for AB, and only on profit)
        let corporateTax = 0
        const taxRates = await taxService.getAllTaxRates(year)
        if (!taxRates) {
            throw new Error(`Kan inte beräkna bokslut: skattesatser för ${year} saknas i databasen.`)
        }
        if (companyType === 'AB' && resultBeforeTax > 0) {
            corporateTax = Math.round(resultBeforeTax * taxRates.corporateTaxRate)
        }
        const netResult = resultBeforeTax - corporateTax

        // Build closing entries:
        // Step 1: Close revenue accounts → debit each revenue account, credit 8999
        const revenueEntries: ClosingEntryLine[] = revenueAccounts.map(a => ({
            account: a.account,
            accountName: a.name,
            // Revenue has credit balance (positive from RPC) → debit to close
            debit: a.balance > 0 ? Math.round(Math.abs(a.balance) * 100) / 100 : 0,
            credit: a.balance < 0 ? Math.round(Math.abs(a.balance) * 100) / 100 : 0,
            description: `Avslut ${a.account} ${a.name}`,
        }))

        // Counterentry for revenue: credit 8999 for total revenue
        if (totalRevenue !== 0) {
            revenueEntries.push({
                account: '8999',
                accountName: 'Årets resultat',
                debit: totalRevenue < 0 ? Math.round(Math.abs(totalRevenue) * 100) / 100 : 0,
                credit: totalRevenue > 0 ? Math.round(Math.abs(totalRevenue) * 100) / 100 : 0,
                description: 'Summa intäkter → resultat',
            })
        }

        // Step 2: Close expense accounts → credit each expense account, debit 8999
        const expenseEntries: ClosingEntryLine[] = expenseAccounts.map(a => ({
            account: a.account,
            accountName: a.name,
            // Expenses have debit balance (negative from RPC) → credit to close
            debit: a.balance < 0 ? 0 : Math.round(Math.abs(a.balance) * 100) / 100,
            credit: a.balance < 0 ? Math.round(Math.abs(a.balance) * 100) / 100 : 0,
            description: `Avslut ${a.account} ${a.name}`,
        }))

        // Counterentry for expenses: debit 8999 for total expenses
        if (totalExpenses !== 0) {
            expenseEntries.push({
                account: '8999',
                accountName: 'Årets resultat',
                debit: totalExpenses < 0 ? Math.round(Math.abs(totalExpenses) * 100) / 100 : 0,
                credit: totalExpenses > 0 ? Math.round(Math.abs(totalExpenses) * 100) / 100 : 0,
                description: 'Summa kostnader → resultat',
            })
        }

        // Step 3: Transfer result from 8999 → 2099
        const resultTransfer: ClosingEntryLine[] = []
        if (Math.abs(netResult) > 0.01) {
            // If profit: 8999 has credit balance → debit 8999, credit 2099
            // If loss: 8999 has debit balance → credit 8999, debit 2099
            resultTransfer.push(
                {
                    account: '8999',
                    accountName: 'Årets resultat',
                    debit: netResult > 0 ? Math.round(Math.abs(netResult) * 100) / 100 : 0,
                    credit: netResult < 0 ? Math.round(Math.abs(netResult) * 100) / 100 : 0,
                    description: 'Överföring årets resultat',
                },
                {
                    account: '2099',
                    accountName: 'Årets resultat',
                    debit: netResult < 0 ? Math.round(Math.abs(netResult) * 100) / 100 : 0,
                    credit: netResult > 0 ? Math.round(Math.abs(netResult) * 100) / 100 : 0,
                    description: 'Årets resultat till balansräkning',
                }
            )
        }

        // Step 4: Tax entry for AB
        let taxEntry: ClosingEntryLine[] | null = null
        if (corporateTax > 0) {
            taxEntry = [
                {
                    account: '8910',
                    accountName: 'Skatt på årets resultat',
                    debit: corporateTax,
                    credit: 0,
                    description: `Bolagsskatt ${(taxRates.corporateTaxRate * 100).toFixed(1)}%`,
                },
                {
                    account: '2510',
                    accountName: 'Skatteskulder',
                    debit: 0,
                    credit: corporateTax,
                    description: 'Beräknad skatteskuld',
                },
            ]
        }

        return {
            fiscalYear: year,
            revenueEntries,
            expenseEntries,
            resultTransfer,
            taxEntry,
            totalRevenue,
            totalExpenses,
            resultBeforeTax,
            corporateTax,
            netResult,
            alreadyClosed,
        }
    },

    /**
     * Execute closing entries — creates verifications in the database.
     * Creates up to 3 verifications in series "Y":
     *   Y1: Close revenue accounts
     *   Y2: Close expense accounts  
     *   Y3: Result transfer + tax
     */
    async executeClosingEntries(year: number, companyType: 'AB' | 'EF' = 'AB'): Promise<{
        verificationIds: string[]
        netResult: number
    }> {
        const preview = await this.previewClosingEntries(year, companyType)

        if (preview.alreadyClosed) {
            throw new Error(`Räkenskapsåret ${year} har redan stängts. Ta bort befintliga bokslutsposter (serie Y) för att köra om.`)
        }

        const verificationIds: string[] = []
        const closingDate = `${year}-12-31`

        // Verification Y1: Close revenue accounts
        if (preview.revenueEntries.length > 0) {
            const v = await verificationService.createVerification({
                series: 'Y',
                date: closingDate,
                description: `Avslut intäktskonton ${year}`,
                entries: preview.revenueEntries.map(e => ({
                    account: e.account,
                    accountName: e.accountName,
                    debit: e.debit,
                    credit: e.credit,
                    description: e.description,
                })),
                sourceType: 'closing',
            })
            verificationIds.push(v.id)
        }

        // Verification Y2: Close expense accounts
        if (preview.expenseEntries.length > 0) {
            const v = await verificationService.createVerification({
                series: 'Y',
                date: closingDate,
                description: `Avslut kostnadskonton ${year}`,
                entries: preview.expenseEntries.map(e => ({
                    account: e.account,
                    accountName: e.accountName,
                    debit: e.debit,
                    credit: e.credit,
                    description: e.description,
                })),
                sourceType: 'closing',
            })
            verificationIds.push(v.id)
        }

        // Verification Y3: Result transfer (+ tax if AB)
        const transferEntries = [...preview.resultTransfer]
        if (preview.taxEntry) {
            transferEntries.push(...preview.taxEntry)
        }

        if (transferEntries.length > 0) {
            const v = await verificationService.createVerification({
                series: 'Y',
                date: closingDate,
                description: `Resultatöverföring ${year}`,
                entries: transferEntries.map(e => ({
                    account: e.account,
                    accountName: e.accountName,
                    debit: e.debit,
                    credit: e.credit,
                    description: e.description,
                })),
                sourceType: 'closing',
            })
            verificationIds.push(v.id)
        }

        return {
            verificationIds,
            netResult: preview.netResult,
        }
    },
}
