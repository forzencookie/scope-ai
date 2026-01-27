import { NextRequest, NextResponse } from "next/server"
import { createUserScopedDb } from '@/lib/database/user-scoped-db'
import { 
    generateSIE, 
    generateSIEFilename,
    type SIEExportData,
    type SIEAccount,
    type SIEBalance,
    type SIEVerification,
    type SIEVerificationEntry
} from '@/lib/generators/sie-generator'

/**
 * GET /api/sie/export
 * 
 * Export accounting data as a SIE4 file.
 * 
 * Query params:
 * - year (required): The fiscal year to export
 * - includeOpeningBalances (optional): Include IB records (default: true)
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const yearParam = searchParams.get('year')
        const includeOpeningBalances = searchParams.get('includeOpeningBalances') !== 'false'

        if (!yearParam) {
            return NextResponse.json(
                { error: "Missing required parameter: year" },
                { status: 400 }
            )
        }

        const year = parseInt(yearParam, 10)
        if (isNaN(year) || year < 1900 || year > 2100) {
            return NextResponse.json(
                { error: "Invalid year parameter" },
                { status: 400 }
            )
        }

        // Get user-scoped database connection
        const userDb = await createUserScopedDb()
        if (!userDb) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const supabase = userDb.client

        // =====================================================================
        // Fetch company info
        // =====================================================================
        const { data: companyData, error: companyError } = await supabase
            .from('companies')
            .select('*')
            .single()

        if (companyError && companyError.code !== 'PGRST116') {
            console.error('Error fetching company:', companyError)
        }

        // Type for company data we need (fields may or may not exist in schema)
        interface CompanyRow {
            name?: string
            org_number?: string | null
            fiscal_year_end?: string | null
            address?: string | null
            city?: string | null
            zip_code?: string | null
            phone?: string | null
            contact_person?: string | null
        }

        const company: CompanyRow = (companyData as CompanyRow) || {
            name: 'Mitt Företag',
            org_number: null,
            fiscal_year_end: '12-31'
        }

        // Parse fiscal year dates
        const fiscalYearEnd = company.fiscal_year_end || '12-31'
        const [endMonth, endDay] = fiscalYearEnd.split('-').map(Number)
        
        // Most Swedish companies have calendar year fiscal year
        const fiscalYearStart = `${year}0101`
        const fiscalYearEndDate = `${year}${String(endMonth).padStart(2, '0')}${String(endDay).padStart(2, '0')}`

        // =====================================================================
        // Fetch verifications for the year
        // =====================================================================
        const yearStart = `${year}-01-01`
        const yearEnd = `${year}-12-31`

        const { data: verificationsData, error: verError } = await supabase
            .from('verifications')
            .select('*')
            .gte('date', yearStart)
            .lte('date', yearEnd)
            .order('series', { ascending: true })
            .order('number', { ascending: true })

        if (verError) {
            console.error('Error fetching verifications:', verError)
            return NextResponse.json(
                { error: "Failed to fetch verifications" },
                { status: 500 }
            )
        }

        // =====================================================================
        // Fetch account balances
        // =====================================================================
        const { data: balancesData, error: balError } = await supabase
            .from('accountbalances')
            .select('*')
            .eq('year', year)

        if (balError && balError.code !== 'PGRST116') {
            console.error('Error fetching balances:', balError)
        }

        // =====================================================================
        // Build SIE export data
        // =====================================================================

        // Collect unique accounts from verifications and balances
        const accountMap = new Map<string, SIEAccount>()

        // From balances
        if (balancesData) {
            for (const bal of balancesData) {
                if (!accountMap.has(bal.account_number)) {
                    accountMap.set(bal.account_number, {
                        number: bal.account_number,
                        name: bal.account_name || `Konto ${bal.account_number}`,
                        type: getAccountType(bal.account_number)
                    })
                }
            }
        }

        // From verifications
        if (verificationsData) {
            for (const ver of verificationsData) {
                const rows = ver.rows as Array<{ account: string; accountName?: string; debit?: number; credit?: number }> | null
                if (rows) {
                    for (const row of rows) {
                        if (row.account && !accountMap.has(row.account)) {
                            accountMap.set(row.account, {
                                number: row.account,
                                name: row.accountName || `Konto ${row.account}`,
                                type: getAccountType(row.account)
                            })
                        }
                    }
                }
            }
        }

        const accounts = Array.from(accountMap.values())

        // Build opening balances (from previous year or start of year)
        const openingBalances: SIEBalance[] = []
        const closingBalances: SIEBalance[] = []
        const resultBalances: SIEBalance[] = []

        if (balancesData && includeOpeningBalances) {
            for (const bal of balancesData) {
                const accountNum = bal.account_number
                const firstDigit = accountNum.charAt(0)
                
                // Balance sheet accounts (1xxx, 2xxx) have IB/UB
                if (firstDigit === '1' || firstDigit === '2') {
                    closingBalances.push({
                        account: accountNum,
                        amount: bal.balance || 0,
                        yearIndex: 0
                    })
                }
                // P&L accounts (3xxx-8xxx) have RES
                else if (firstDigit >= '3' && firstDigit <= '8') {
                    resultBalances.push({
                        account: accountNum,
                        amount: bal.balance || 0,
                        yearIndex: 0
                    })
                }
            }
        }

        // Build verifications
        const verifications: SIEVerification[] = []

        if (verificationsData) {
            for (const ver of verificationsData) {
                const rows = ver.rows as Array<{ 
                    account: string
                    debit?: number
                    credit?: number
                    description?: string 
                }> | null

                if (!rows || rows.length === 0) continue

                const entries: SIEVerificationEntry[] = rows.map(row => {
                    // SIE uses positive = debit, negative = credit
                    const amount = (row.debit || 0) - (row.credit || 0)
                    return {
                        account: row.account,
                        amount,
                        description: row.description
                    }
                })

                verifications.push({
                    series: ver.series || 'A',
                    number: ver.number || 0,
                    date: (ver.date || '').replace(/-/g, ''), // Convert YYYY-MM-DD to YYYYMMDD
                    description: ver.description || '',
                    entries,
                    regDate: (ver.created_at || '').substring(0, 10).replace(/-/g, '') || undefined // Registration date
                })
            }
        }

        // Calculate previous year for comparison (required by auditors)
        const previousYear = year - 1
        const previousYearStart = `${previousYear}0101`
        const previousYearEnd = `${previousYear}${String(endMonth).padStart(2, '0')}${String(endDay).padStart(2, '0')}`

        // Build export data
        const exportData: SIEExportData = {
            company: {
                orgNumber: company.org_number || '',
                name: company.name || 'Mitt Företag',
                fiscalYearStart,
                fiscalYearEnd: fiscalYearEndDate,
                previousYearStart,
                previousYearEnd,
                taxYear: year + 1, // Tax year is the year after the fiscal year
                address: company.address || undefined,
                city: company.city || undefined,
                zipCode: company.zip_code || undefined,
                phone: company.phone || undefined,
                contact: company.contact_person || undefined
            },
            accounts,
            openingBalances,
            closingBalances,
            resultBalances,
            verifications,
            generatedAt: new Date()
        }

        // Generate SIE content
        const sieContent = generateSIE(exportData)
        const filename = generateSIEFilename(exportData.company, year)

        // Return as downloadable file
        return new NextResponse(sieContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/plain; charset=iso-8859-1',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Cache-Control': 'no-cache'
            }
        })

    } catch (error) {
        console.error('SIE export error:', error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

/**
 * Determine account type from account number
 */
function getAccountType(accountNumber: string): 'T' | 'S' | 'K' | 'I' | undefined {
    const firstDigit = accountNumber.charAt(0)
    
    switch (firstDigit) {
        case '1':
            return 'T' // Tillgång (Asset)
        case '2':
            return 'S' // Skuld (Liability) or Eget kapital
        case '3':
            return 'I' // Intäkt (Income)
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
            return 'K' // Kostnad (Expense)
        default:
            return undefined
    }
}
