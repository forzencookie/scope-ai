import { getSupabaseClient } from '@/lib/database/supabase'

/**
 * Account Balance Row - represents an account from BAS kontoplan
 */
export interface AccountBalanceRow {
    id: string
    account_number: string
    account_name: string
    balance: number | null
    period: string | null
    year: number
    company_id: string
    user_id: string
    created_at: string | null
    updated_at: string | null
}

/**
 * Account for display in UI
 */
export interface Account {
    id: string
    accountNumber: string
    accountName: string
    balance: number
    period: string | null
    year: number
    accountClass: string // Tillgångar, Skulder, Eget kapital, Intäkter, Kostnader
    accountType: string  // Current asset, Fixed asset, etc.
}

/**
 * Account filter options
 */
export interface GetAccountsOptions {
    limit?: number
    offset?: number
    search?: string
    year?: number
    period?: string
    accountClass?: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' // BAS account classes
}

/**
 * Account balance summary
 */
export interface AccountBalanceSummary {
    totalAssets: number      // Class 1
    totalLiabilities: number // Class 2
    totalEquity: number      // Class 2 (20xx)
    totalRevenue: number     // Class 3
    totalExpenses: number    // Classes 4-8
    netResult: number        // Revenue - Expenses
}

/**
 * Map account number to account class description
 */
function getAccountClass(accountNumber: string): string {
    const firstDigit = accountNumber.charAt(0)
    const twoDigit = accountNumber.substring(0, 2)

    switch (firstDigit) {
        case '1':
            return 'Tillgångar'
        case '2':
            if (twoDigit >= '20' && twoDigit <= '21') return 'Eget kapital'
            return 'Skulder'
        case '3':
            return 'Intäkter'
        case '4':
            return 'Kostnader - Inköp'
        case '5':
            return 'Kostnader - Personal'
        case '6':
            return 'Kostnader - Övriga externa'
        case '7':
            return 'Kostnader - Avskrivningar'
        case '8':
            return 'Finansiella poster'
        default:
            return 'Övriga'
    }
}

/**
 * Get account type from account number
 */
function getAccountType(accountNumber: string): string {
    const prefix = accountNumber.substring(0, 2)

    // Assets (1xxx)
    if (prefix >= '10' && prefix <= '13') return 'Anläggningstillgångar'
    if (prefix >= '14' && prefix <= '17') return 'Omsättningstillgångar'
    if (prefix >= '18' && prefix <= '19') return 'Kortfristiga fordringar'

    // Liabilities (2xxx)
    if (prefix >= '20' && prefix <= '21') return 'Eget kapital'
    if (prefix >= '22' && prefix <= '24') return 'Långfristiga skulder'
    if (prefix >= '25' && prefix <= '29') return 'Kortfristiga skulder'

    // Revenue (3xxx)
    if (prefix >= '30' && prefix <= '37') return 'Försäljningsintäkter'
    if (prefix >= '38' && prefix <= '39') return 'Övriga rörelseintäkter'

    // Expenses (4xxx-8xxx)
    if (prefix >= '40' && prefix <= '49') return 'Varuinköp'
    if (prefix >= '50' && prefix <= '59') return 'Personalkostnader'
    if (prefix >= '60' && prefix <= '69') return 'Övriga externa kostnader'
    if (prefix >= '70' && prefix <= '79') return 'Av-/nedskrivningar'
    if (prefix >= '80' && prefix <= '89') return 'Finansiella intäkter/kostnader'

    return 'Övriga'
}

export const accountService = {
    /**
     * Get accounts with optional filters
     */
    async getAccounts({
        limit = 100,
        offset = 0,
        search = '',
        year,
        period,
        accountClass
    }: GetAccountsOptions = {}) {
        const supabase = getSupabaseClient()
        const targetYear = year || new Date().getFullYear()

        let query = supabase
            .from('accountbalances')
            .select('*', { count: 'exact' })
            .eq('year', targetYear)
            .order('account_number', { ascending: true })
            .range(offset, offset + limit - 1)

        if (search) {
            query = query.or(`account_name.ilike.%${search}%,account_number.ilike.%${search}%`)
        }

        if (period) {
            query = query.eq('period', period)
        }

        if (accountClass) {
            // Filter by first digit of account number
            query = query.like('account_number', `${accountClass}%`)
        }

        const { data, error, count } = await query

        if (error) throw error

        if (!data || data.length === 0) {
            return {
                accounts: [],
                totalCount: 0
            }
        }

        const accounts: Account[] = data.map((row) => ({
            id: row.id,
            accountNumber: row.account_number,
            accountName: row.account_name,
            balance: row.balance || 0,
            period: row.period,
            year: row.year,
            accountClass: getAccountClass(row.account_number),
            accountType: getAccountType(row.account_number)
        }))

        return {
            accounts,
            totalCount: count || 0
        }
    },

    /**
     * Get balance for a specific account
     */
    async getAccountBalance(accountNumber: string, year?: number): Promise<Account | null> {
        const supabase = getSupabaseClient()
        const targetYear = year || new Date().getFullYear()

        const { data, error } = await supabase
            .from('accountbalances')
            .select('*')
            .eq('account_number', accountNumber)
            .eq('year', targetYear)
            .order('period', { ascending: false })
            .limit(1)
            .single()

        if (error || !data) return null

        return {
            id: data.id,
            accountNumber: data.account_number,
            accountName: data.account_name,
            balance: data.balance || 0,
            period: data.period,
            year: data.year,
            accountClass: getAccountClass(data.account_number),
            accountType: getAccountType(data.account_number)
        }
    },

    /**
     * Get accounts by account class (1xxx, 2xxx, etc.)
     */
    async getAccountsByClass(accountClass: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8', year?: number) {
        return this.getAccounts({ accountClass, year, limit: 200 })
    },

    /**
     * Get balance sheet summary (assets, liabilities, equity)
     */
    async getBalanceSheetSummary(year?: number): Promise<AccountBalanceSummary> {
        const supabase = getSupabaseClient()
        const targetYear = year || new Date().getFullYear()

        const { data } = await supabase
            .from('accountbalances')
            .select('account_number, balance')
            .eq('year', targetYear)

        if (!data || data.length === 0) {
            return {
                totalAssets: 0,
                totalLiabilities: 0,
                totalEquity: 0,
                totalRevenue: 0,
                totalExpenses: 0,
                netResult: 0
            }
        }

        let totalAssets = 0
        let totalLiabilities = 0
        let totalEquity = 0
        let totalRevenue = 0
        let totalExpenses = 0

        for (const row of data) {
            const balance = row.balance || 0
            const firstDigit = row.account_number.charAt(0)
            const twoDigit = row.account_number.substring(0, 2)

            switch (firstDigit) {
                case '1':
                    totalAssets += balance
                    break
                case '2':
                    if (twoDigit >= '20' && twoDigit <= '21') {
                        totalEquity += balance
                    } else {
                        totalLiabilities += balance
                    }
                    break
                case '3':
                    totalRevenue += balance
                    break
                case '4':
                case '5':
                case '6':
                case '7':
                case '8':
                    totalExpenses += balance
                    break
            }
        }

        return {
            totalAssets,
            totalLiabilities,
            totalEquity,
            totalRevenue,
            totalExpenses,
            netResult: totalRevenue - totalExpenses
        }
    },

    /**
     * Search for accounts by name or number
     */
    async searchAccounts(query: string, year?: number) {
        return this.getAccounts({ search: query, year, limit: 50 })
    },

    /**
     * Get chart of accounts (kontoplan) - all accounts grouped by class
     */
    async getChartOfAccounts(year?: number) {
        const { accounts } = await this.getAccounts({ year, limit: 500 })

        // Group by account class
        const grouped: Record<string, Account[]> = {}

        for (const account of accounts) {
            const firstDigit = account.accountNumber.charAt(0)
            if (!grouped[firstDigit]) {
                grouped[firstDigit] = []
            }
            grouped[firstDigit].push(account)
        }

        return {
            tillgangar: grouped['1'] || [],          // Assets
            egnaKapitalOchSkulder: grouped['2'] || [], // Equity & Liabilities
            intakter: grouped['3'] || [],            // Revenue
            varuinkop: grouped['4'] || [],           // Cost of goods
            personalkostnader: grouped['5'] || [],   // Personnel costs
            ovrigaKostnader: grouped['6'] || [],     // Other external costs
            avskrivningar: grouped['7'] || [],       // Depreciation
            finansiellaPoster: grouped['8'] || []    // Financial items
        }
    }
}
