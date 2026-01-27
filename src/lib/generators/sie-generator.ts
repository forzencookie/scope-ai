/**
 * SIE File Generator
 * 
 * Generates valid SIE4 format files for export.
 * Based on the official SIE specification (www.sie.se)
 * 
 * SIE4 includes:
 * - Company information
 * - Chart of accounts
 * - Opening/closing balances
 * - All verifications with transaction rows
 */

// =============================================================================
// Types
// =============================================================================

export interface SIECompanyInfo {
    orgNumber: string
    name: string
    fiscalYearStart: string  // YYYYMMDD
    fiscalYearEnd: string    // YYYYMMDD
    previousYearStart?: string  // YYYYMMDD - for comparison
    previousYearEnd?: string    // YYYYMMDD - for comparison
    taxYear?: number         // TAXAR - the tax year this relates to
    address?: string
    city?: string
    zipCode?: string
    phone?: string
    contact?: string
}

export interface SIEAccount {
    number: string
    name: string
    type?: 'T' | 'S' | 'K' | 'I'  // Tillgång, Skuld, Kostnad, Intäkt
}

export interface SIEBalance {
    account: string
    amount: number
    yearIndex: number  // 0 = current year, -1 = previous year
}

export interface SIEVerificationEntry {
    account: string
    amount: number  // Positive = debit, negative = credit
    description?: string
    date?: string  // YYYYMMDD
}

export interface SIEVerification {
    series: string
    number: number
    date: string  // YYYYMMDD - transaction date
    description: string
    entries: SIEVerificationEntry[]
    regDate?: string  // YYYYMMDD - registration date (when it was booked)
}

export interface SIEExportData {
    company: SIECompanyInfo
    accounts: SIEAccount[]
    openingBalances: SIEBalance[]
    closingBalances: SIEBalance[]
    resultBalances: SIEBalance[]  // For P&L accounts (3000-8999)
    verifications: SIEVerification[]
    generatedAt?: Date
}

// =============================================================================
// Constants
// =============================================================================

const PROGRAM_NAME = 'Scope AI'
const PROGRAM_VERSION = '1.0'
const SIE_TYPE = '4'  // SIE4 - includes verifications
const FILE_FORMAT = 'PC8'  // PC character set (CP437/ISO-8859-1 compatible)

// =============================================================================
// Formatting Utilities
// =============================================================================

/**
 * Format a Date object as YYYYMMDD
 */
function formatDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}${month}${day}`
}

/**
 * Format organization number (ensure no dash)
 */
function formatOrgNr(orgnr: string): string {
    return orgnr.replace(/-/g, '')
}

/**
 * Escape and quote a string value for SIE
 */
function quoteString(value: string): string {
    // SIE uses double quotes, escape internal quotes
    const escaped = value.replace(/"/g, '""')
    return `"${escaped}"`
}

/**
 * Format amount for SIE (decimal with dot, no thousands separator)
 */
function formatAmount(amount: number): string {
    // SIE uses 2 decimal places
    return amount.toFixed(2)
}

/**
 * Format account number (remove any spaces)
 */
function formatAccount(account: string): string {
    return account.replace(/\s/g, '')
}

// =============================================================================
// SIE File Generator
// =============================================================================

/**
 * Generate a complete SIE4 file from the provided data
 */
export function generateSIE(data: SIEExportData): string {
    const lines: string[] = []
    const now = data.generatedAt || new Date()

    // =========================================================================
    // Header section
    // =========================================================================
    
    // Flag (0 = no flags set)
    lines.push('#FLAGGA 0')
    
    // Program that generated the file
    lines.push(`#PROGRAM ${quoteString(PROGRAM_NAME)} ${quoteString(PROGRAM_VERSION)}`)
    
    // File format
    lines.push(`#FORMAT ${FILE_FORMAT}`)
    
    // Generation date and signature
    lines.push(`#GEN ${formatDate(now)}`)
    
    // SIE type (4 = full export with verifications)
    lines.push(`#SIETYP ${SIE_TYPE}`)

    // =========================================================================
    // Company information
    // =========================================================================
    
    // Organization number
    if (data.company.orgNumber) {
        lines.push(`#ORGNR ${formatOrgNr(data.company.orgNumber)}`)
    }
    
    // Company name
    lines.push(`#FNAMN ${quoteString(data.company.name)}`)
    
    // Address (SIE format: kontakt, gatuadress, postadress, telefon)
    if (data.company.address || data.company.contact) {
        const addressParts = [
            quoteString(data.company.contact || ''),
            quoteString(data.company.address || ''),
            quoteString(`${data.company.zipCode || ''} ${data.company.city || ''}`.trim()),
            quoteString(data.company.phone || '')
        ]
        lines.push(`#ADRESS ${addressParts.join(' ')}`)
    }

    // Tax year (required for tax software compatibility)
    if (data.company.taxYear) {
        lines.push(`#TAXAR ${data.company.taxYear}`)
    }

    // Export scope/coverage period
    lines.push(`#OMFATTN ${data.company.fiscalYearStart} ${data.company.fiscalYearEnd}`)

    // Currency (Swedish kronor)
    lines.push('#VALUTA SEK')

    // =========================================================================
    // Fiscal year (RAR = Räkenskapsår)
    // =========================================================================
    
    // Current year (index 0)
    lines.push(`#RAR 0 ${data.company.fiscalYearStart} ${data.company.fiscalYearEnd}`)

    // Previous year (index -1) for comparison - required by auditors
    if (data.company.previousYearStart && data.company.previousYearEnd) {
        lines.push(`#RAR -1 ${data.company.previousYearStart} ${data.company.previousYearEnd}`)
    }

    // =========================================================================
    // Chart of accounts (KONTO)
    // =========================================================================
    
    // Sort accounts by number for readability
    const sortedAccounts = [...data.accounts].sort((a, b) => 
        a.number.localeCompare(b.number)
    )
    
    for (const account of sortedAccounts) {
        const accountNum = formatAccount(account.number)
        const accountName = quoteString(account.name)
        lines.push(`#KONTO ${accountNum} ${accountName}`)
        
        // Add account type if available
        if (account.type) {
            lines.push(`#KTYP ${accountNum} ${account.type}`)
        }
    }

    // =========================================================================
    // Opening balances (IB = Ingående Balans)
    // =========================================================================
    
    for (const balance of data.openingBalances) {
        if (balance.amount !== 0) {
            lines.push(`#IB ${balance.yearIndex} ${formatAccount(balance.account)} ${formatAmount(balance.amount)}`)
        }
    }

    // =========================================================================
    // Closing balances (UB = Utgående Balans)
    // =========================================================================
    
    for (const balance of data.closingBalances) {
        if (balance.amount !== 0) {
            lines.push(`#UB ${balance.yearIndex} ${formatAccount(balance.account)} ${formatAmount(balance.amount)}`)
        }
    }

    // =========================================================================
    // Result balances (RES = Resultat for P&L accounts)
    // =========================================================================
    
    for (const balance of data.resultBalances) {
        if (balance.amount !== 0) {
            lines.push(`#RES ${balance.yearIndex} ${formatAccount(balance.account)} ${formatAmount(balance.amount)}`)
        }
    }

    // =========================================================================
    // Verifications (VER + TRANS)
    // =========================================================================
    
    // Sort by series then number
    const sortedVerifications = [...data.verifications].sort((a, b) => {
        if (a.series !== b.series) return a.series.localeCompare(b.series)
        return a.number - b.number
    })
    
    for (const ver of sortedVerifications) {
        // Verification header
        // #VER series number date description [regdate] [sign]
        // regdate = when the verification was registered in the system
        const regDatePart = ver.regDate ? ` ${ver.regDate}` : ''
        lines.push(`#VER ${ver.series} ${ver.number} ${ver.date} ${quoteString(ver.description)}${regDatePart}`)
        lines.push('{')
        
        // Transaction rows
        for (const entry of ver.entries) {
            // #TRANS account objectList amount date description
            const account = formatAccount(entry.account)
            const amount = formatAmount(entry.amount)
            const transDate = entry.date || ver.date
            const desc = entry.description ? ` ${quoteString(entry.description)}` : ''
            
            // {} is the empty object list (kostnadsställe/projekt)
            lines.push(`\t#TRANS ${account} {} ${amount} ${transDate}${desc}`)
        }
        
        lines.push('}')
    }

    // Join with CRLF (SIE standard line ending)
    return lines.join('\r\n')
}

// =============================================================================
// Helper: Generate filename
// =============================================================================

/**
 * Generate a standard SIE filename
 */
export function generateSIEFilename(company: SIECompanyInfo, year: number): string {
    const orgNr = company.orgNumber ? formatOrgNr(company.orgNumber) : 'export'
    return `bokforing_${orgNr}_${year}.se`
}

// =============================================================================
// Helper: Download in browser
// =============================================================================

/**
 * Trigger a download of the SIE file in the browser
 */
export function downloadSIE(data: SIEExportData, filename?: string): void {
    const content = generateSIE(data)
    const finalFilename = filename || generateSIEFilename(
        data.company,
        parseInt(data.company.fiscalYearEnd.substring(0, 4))
    )
    
    // Create blob with proper encoding (ISO-8859-1 / Latin1 for Swedish characters)
    const blob = new Blob([content], { type: 'text/plain;charset=iso-8859-1' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = finalFilename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}
