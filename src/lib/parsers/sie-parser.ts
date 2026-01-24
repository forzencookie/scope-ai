export interface SIEVerification {
    series: string
    verNumber: string
    date: string
    description: string
    rows: SIEVerificationRow[]
}

export interface SIEVerificationRow {
    account: string
    amount: number
    objectId?: string
    objectType?: string
    quantity?: number
}

export interface SIEAccount {
    number: string
    name: string
}

export interface SIEBalance {
    account: string
    amount: number
    year: number
    period?: number
}

export interface SIEData {
    program: string
    fiskalYear: { start: string, end: string }[]
    accounts: SIEAccount[]
    balances: SIEBalance[]
    verifications: SIEVerification[]
}

/**
 * Parses SIE4 file content into structured data
 */
export function parseSIE(content: string): SIEData {
    const lines = content.split(/\r?\n/)
    const data: SIEData = {
        program: '',
        fiskalYear: [],
        accounts: [],
        balances: [],
        verifications: []
    }

    let currentVer: SIEVerification | null = null

    for (const line of lines) {
        if (!line.startsWith('#')) continue

        const parts = parseLine(line)
        const code = parts[0]

        try {
            switch (code) {
                case '#PROGRAM':
                    data.program = parts[1] || ''
                    break

                case '#RAR':
                    // #RAR 0 20240101 20241231
                    data.fiskalYear.push({
                        start: parts[2],
                        end: parts[3]
                    })
                    break

                case '#KONTO':
                    // #KONTO 1930 "Företagskonto"
                    data.accounts.push({
                        number: parts[1],
                        name: parts[2]?.replace(/"/g, '') || ''
                    })
                    break

                case '#IB': // Ingående balans
                case '#UB': // Utgående balans
                    // #IB 0 1930 10000.00
                    data.balances.push({
                        year: parseInt(parts[1]),
                        account: parts[2],
                        amount: parseFloat(parts[3])
                    })
                    break

                case '#VER':
                    // #VER A 1 20240101 "Start"
                    currentVer = {
                        series: parts[1],
                        verNumber: parts[2],
                        date: parts[3],
                        description: parts[4]?.replace(/"/g, '') || '',
                        rows: []
                    }
                    data.verifications.push(currentVer)
                    break

                case '#TRANS':
                    // #TRANS 1930 {} -100.00 20240101
                    if (currentVer) {
                        currentVer.rows.push({
                            account: parts[1],
                            amount: parseFloat(parts[3]),
                        })
                    }
                    break
            }
        } catch (e) {
            console.warn(`Failed to parse line: ${line}`, e)
        }
    }

    return data
}

function parseLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuote = false

    for (let i = 0; i < line.length; i++) {
        const char = line[i]

        if (char === '"') {
            inQuote = !inQuote
            current += char
        } else if (char === ' ' && !inQuote) {
            if (current) result.push(current)
            current = ''
        } else {
            current += char
        }
    }
    if (current) result.push(current)

    return result
}
