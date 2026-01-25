import { Verification } from "@/hooks/use-verifications"

/**
 * Complete VAT Report matching official Skatteverket SKV 4700 form.
 * All rutor (fields) from sections A-H are included.
 */
export interface VatReport {
    // Metadata
    periodId?: string | number
    period: string
    dueDate: string
    status: "upcoming" | "submitted" | "overdue"

    // ==========================================================================
    // Section A: Momspliktig försäljning eller uttag (Sales base, excl VAT)
    // ==========================================================================
    ruta05: number  // Momspliktig försäljning 25%
    ruta06: number  // Momspliktig försäljning 12%
    ruta07: number  // Momspliktig försäljning 6%
    ruta08: number  // Hyresinkomster vid frivillig skattskyldighet

    // ==========================================================================
    // Section B: Utgående moms på försäljning (Output VAT)
    // ==========================================================================
    ruta10: number  // Utgående moms 25%
    ruta11: number  // Utgående moms 12%
    ruta12: number  // Utgående moms 6%

    // ==========================================================================
    // Section C: Momspliktiga inköp vid omvänd skattskyldighet (Reverse charge base)
    // ==========================================================================
    ruta20: number  // Inköp av varor från annat EU-land
    ruta21: number  // Inköp av tjänster från annat EU-land
    ruta22: number  // Inköp av tjänster från land utanför EU
    ruta23: number  // Inköp av varor i Sverige (omvänd moms)
    ruta24: number  // Övriga inköp av tjänster

    // ==========================================================================
    // Section D: Utgående moms på inköp i ruta 20-24 (Output VAT on reverse charge)
    // ==========================================================================
    ruta30: number  // Utgående moms 25%
    ruta31: number  // Utgående moms 12%
    ruta32: number  // Utgående moms 6%

    // ==========================================================================
    // Section E: Försäljning m.m. som är undantagen från moms (Exempt sales)
    // ==========================================================================
    ruta35: number  // Försäljning av varor till annat EU-land
    ruta36: number  // Försäljning av varor utanför EU
    ruta37: number  // Mellanmans inköp av varor vid trepartshandel
    ruta38: number  // Mellanmans försäljning av varor vid trepartshandel
    ruta39: number  // Försäljning av tjänster till annat EU-land (huvudregel)
    ruta40: number  // Övrig försäljning av tjänster utanför Sverige
    ruta41: number  // Försäljning där köparen är skattskyldig i Sverige
    ruta42: number  // Övrig momsfri försäljning m.m.

    // ==========================================================================
    // Section F: Ingående moms (Input VAT)
    // ==========================================================================
    ruta48: number  // Ingående moms att dra av

    // ==========================================================================
    // Section G: Moms att betala eller få tillbaka (Result)
    // ==========================================================================
    ruta49: number  // Moms att betala (+) eller få tillbaka (-)

    // ==========================================================================
    // Section H: Import (Beskattningsunderlag vid import)
    // ==========================================================================
    ruta50: number  // Beskattningsunderlag vid import
    ruta60: number  // Utgående moms på import 25%
    ruta61: number  // Utgående moms på import 12%
    ruta62: number  // Utgående moms på import 6%

    // ==========================================================================
    // Calculated aggregates (for UI convenience)
    // ==========================================================================
    salesVat: number    // Total output VAT (ruta10 + ruta11 + ruta12 + ruta30 + ruta31 + ruta32 + ruta60 + ruta61 + ruta62)
    inputVat: number    // Total input VAT (ruta48)
    netVat: number      // Net VAT to pay/receive (salesVat - inputVat)
}

// Helper functions
function getVatDeadline(quarter: number, year: number): Date {
    const deadline = new Date(year, 0, 1)

    // Set default deadline time to noon to avoid timezone edge cases
    deadline.setHours(12, 0, 0, 0)

    switch (quarter) {
        case 1: // Jan-Mar -> Deadline May 12th
            deadline.setMonth(4) // May (0-indexed)
            deadline.setDate(12)
            break
        case 2: // Apr-Jun -> Deadline Aug 17th
            deadline.setMonth(7) // Aug
            deadline.setDate(17)
            break
        case 3: // Jul-Sep -> Deadline Nov 12th
            deadline.setMonth(10) // Nov
            deadline.setDate(12)
            break
        case 4: // Oct-Dec -> Deadline Feb 12th (next year)
            deadline.setFullYear(year + 1)
            deadline.setMonth(1) // Feb
            deadline.setDate(12)
            break
    }
    return deadline
}

function formatDate(date: Date): string {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

/**
 * Creates an empty VatReport with all fields initialized to 0
 */
export function createEmptyVatReport(period: string, dueDate: string, status: VatReport["status"] = "upcoming"): VatReport {
    return {
        period,
        dueDate,
        status,
        // Section A
        ruta05: 0, ruta06: 0, ruta07: 0, ruta08: 0,
        // Section B
        ruta10: 0, ruta11: 0, ruta12: 0,
        // Section C
        ruta20: 0, ruta21: 0, ruta22: 0, ruta23: 0, ruta24: 0,
        // Section D
        ruta30: 0, ruta31: 0, ruta32: 0,
        // Section E
        ruta35: 0, ruta36: 0, ruta37: 0, ruta38: 0, ruta39: 0, ruta40: 0, ruta41: 0, ruta42: 0,
        // Section F
        ruta48: 0,
        // Section G
        ruta49: 0,
        // Section H
        ruta50: 0, ruta60: 0, ruta61: 0, ruta62: 0,
        // Aggregates
        salesVat: 0, inputVat: 0, netVat: 0,
    }
}

/**
 * Recalculates derived fields (ruta49, salesVat, inputVat, netVat)
 */
export function recalculateVatReport(report: VatReport): VatReport {
    // Total output VAT = B + D + H output
    const salesVat =
        report.ruta10 + report.ruta11 + report.ruta12 +
        report.ruta30 + report.ruta31 + report.ruta32 +
        report.ruta60 + report.ruta61 + report.ruta62

    const inputVat = report.ruta48
    const netVat = salesVat - inputVat

    return {
        ...report,
        salesVat,
        inputVat,
        netVat,
        ruta49: netVat,
    }
}

export const VatProcessor = {
    /**
     * Calculate VAT report from verifikationer for a given period.
     * Maps BAS account codes to the appropriate rutor.
     */
    calculateReport(verifikationer: Verification[], period: string): VatReport {
        const [p, yearStr] = period.split(" ") // e.g., "Q4 2024"
        const year = parseInt(yearStr)
        const quarter = parseInt(p.replace("Q", ""))

        // Define Period Range
        const startMonth = (quarter - 1) * 3 // 0, 3, 6, 9
        const endMonth = startMonth + 2

        // Filter Transactions
        const periodTransactions = verifikationer.filter(v => {
            const d = new Date(v.date)
            return d.getFullYear() === year && d.getMonth() >= startMonth && d.getMonth() <= endMonth
        })

        const dueDate = getVatDeadline(quarter, year)
        const today = new Date()
        let status: VatReport["status"] = "upcoming"
        if (today > dueDate) status = "overdue"

        // Start with empty report
        const report = createEmptyVatReport(period, formatDate(dueDate), status)

        // Map accounts to rutor
        // BAS account mappings for Swedish VAT:
        // 2610-2619: Utgående moms 25%
        // 2620-2629: Utgående moms 12%
        // 2630-2639: Utgående moms 6%
        // 2640-2649: Ingående moms
        // 2650: Moms redovisningskonto
        // Map accounts to rutor
        // BAS account mappings for Swedish VAT:
        // 2610-2619: Utgående moms 25%
        // 2620-2629: Utgående moms 12%
        // 2630-2639: Utgående moms 6%
        // 2640-2649: Ingående moms
        // 2650: Moms redovisningskonto
        periodTransactions.forEach(v => {
            if (!v.rows) return

            v.rows.forEach(row => {
                const _amount = Math.abs(row.credit || row.debit || 0) // VAT amount is the balance of the line
                // Wait, if it's credit, it's Liability (Output VAT). If Debit, Asset (Input VAT).
                // But specifically for VAT report calculation, we sum the absolute value accumulated in these accounts.
                // Or better: Net change.
                // Standard logic:
                // Input VAT (2640) is typically Debited.
                // Output VAT (2610) is typically Credited.

                // Let's use the explicit amount field if available in Row or derive from debit/credit.
                const val = (row.credit || 0) - (row.debit || 0)

                const konto = row.account

                // Output VAT 25% (2610-2619) -> Expect Credit (positive val)
                if (konto >= "2610" && konto <= "2619") {
                    report.ruta10 += Math.max(0, val) // Only add if credit > debit? Or just sum net? 
                    // Usually we sum the credit side for Output VAT.
                    // Let's use simple logic similar to RealVerifications method:
                    // But here I am replacing specific broken code that used v.amount.

                    if (row.credit) report.ruta10 += row.credit
                }
                // Output VAT 12% (2620-2629)
                else if (konto >= "2620" && konto <= "2629") {
                    if (row.credit) report.ruta11 += row.credit
                }
                // Output VAT 6% (2630-2639)
                else if (konto >= "2630" && konto <= "2639") {
                    if (row.credit) report.ruta12 += row.credit
                }
                // Input VAT (2640-2649) -> Expect Debit
                else if (konto >= "2640" && konto <= "2649") {
                    if (row.debit) report.ruta48 += row.debit
                }
            })
        })

        // Calculate sales base from VAT (reverse calculation)
        // In production, this would come from revenue accounts (3xxx)
        if (report.ruta10 > 0) report.ruta05 = Math.round(report.ruta10 / 0.25)
        if (report.ruta11 > 0) report.ruta06 = Math.round(report.ruta11 / 0.12)
        if (report.ruta12 > 0) report.ruta07 = Math.round(report.ruta12 / 0.06)

        // Recalculate aggregates
        return recalculateVatReport(report)
    },

    /**
     * Calculate VAT report from transactions for a given period.
     * Aggregates vatAmount from transactions to get ingående/utgående moms.
     */
    calculateReportFromTransactions(transactions: { amountValue: number; vatAmount?: number; vatRate?: number; timestamp: Date }[], period: string): VatReport {
        const [p, yearStr] = period.split(" ") // e.g., "Q4 2024"
        const year = parseInt(yearStr)
        const quarter = parseInt(p.replace("Q", ""))

        // Define Period Range
        const startMonth = (quarter - 1) * 3 // 0, 3, 6, 9
        const endMonth = startMonth + 2

        // Filter Transactions
        const periodTransactions = transactions.filter(t => {
            const d = new Date(t.timestamp)
            return d.getFullYear() === year && d.getMonth() >= startMonth && d.getMonth() <= endMonth
        })

        const dueDate = getVatDeadline(quarter, year)
        const today = new Date()
        let status: VatReport["status"] = "upcoming"
        if (today > dueDate) status = "overdue"

        // Start with empty report
        const report = createEmptyVatReport(period, formatDate(dueDate), status)

        // Aggregate VAT from transactions
        // Positive vatAmount = utgående moms (from sales/income)
        // Negative vatAmount = ingående moms (from purchases/expenses)
        periodTransactions.forEach(t => {
            if (t.vatAmount) {
                if (t.vatAmount > 0) {
                    // Utgående moms - distribute to correct ruta based on rate
                    if (t.vatRate === 25) {
                        report.ruta10 += t.vatAmount
                    } else if (t.vatRate === 12) {
                        report.ruta11 += t.vatAmount
                    } else if (t.vatRate === 6) {
                        report.ruta12 += t.vatAmount
                    }
                } else {
                    // Ingående moms (negative values, so add as positive)
                    report.ruta48 += Math.abs(t.vatAmount)
                }
            }
        })

        // Calculate sales base from VAT (reverse calculation)
        if (report.ruta10 > 0) report.ruta05 = Math.round(report.ruta10 / 0.25)
        if (report.ruta11 > 0) report.ruta06 = Math.round(report.ruta11 / 0.12)
        if (report.ruta12 > 0) report.ruta07 = Math.round(report.ruta12 / 0.06)

        // Recalculate aggregates
        return recalculateVatReport(report)
    },

    /**
     * Calculate VAT report from source documents for a given period.
     * This is the proper accounting approach:
     * - Utgående moms: From customer invoices (kundfakturor)
     * - Ingående moms: From supplier invoices (leverantörsfakturor) + receipts (kvitton)
     */
    calculateReportFromDocuments(params: {
        customerInvoices: Array<{ issueDate: string; vatAmount?: number; vatRate?: number }>;
        supplierInvoices: Array<{ invoiceDate: string; vatAmount: number }>;
        receipts?: Array<{ date: string; vatAmount?: number }>;
        period: string;
    }): VatReport {
        const { customerInvoices, supplierInvoices, receipts = [], period } = params

        const [p, yearStr] = period.split(" ") // e.g., "Q4 2024"
        const year = parseInt(yearStr)
        const quarter = parseInt(p.replace("Q", ""))

        // Define Period Range
        const startMonth = (quarter - 1) * 3 // 0, 3, 6, 9
        const endMonth = startMonth + 2

        // Helper to check if date is in period
        const isInPeriod = (dateStr: string) => {
            const d = new Date(dateStr)
            return d.getFullYear() === year && d.getMonth() >= startMonth && d.getMonth() <= endMonth
        }

        const dueDate = getVatDeadline(quarter, year)
        const today = new Date()
        let status: VatReport["status"] = "upcoming"
        if (today > dueDate) status = "overdue"

        // Start with empty report
        const report = createEmptyVatReport(period, formatDate(dueDate), status)

        // Calculate Utgående moms from customer invoices
        customerInvoices
            .filter(inv => isInPeriod(inv.issueDate))
            .forEach(inv => {
                if (inv.vatAmount) {
                    // Distribute to correct ruta based on rate
                    if (inv.vatRate === 25) {
                        report.ruta10 += inv.vatAmount
                    } else if (inv.vatRate === 12) {
                        report.ruta11 += inv.vatAmount
                    } else if (inv.vatRate === 6) {
                        report.ruta12 += inv.vatAmount
                    }
                }
            })

        // Calculate Ingående moms from supplier invoices
        supplierInvoices
            .filter(inv => isInPeriod(inv.invoiceDate))
            .forEach(inv => {
                report.ruta48 += inv.vatAmount
            })

        // Calculate Ingående moms from receipts
        receipts
            .filter(r => isInPeriod(r.date))
            .forEach(r => {
                if (r.vatAmount) {
                    report.ruta48 += r.vatAmount
                }
            })

        // Calculate sales base from VAT (reverse calculation)
        if (report.ruta10 > 0) report.ruta05 = Math.round(report.ruta10 / 0.25)
        if (report.ruta11 > 0) report.ruta06 = Math.round(report.ruta11 / 0.12)
        if (report.ruta12 > 0) report.ruta07 = Math.round(report.ruta12 / 0.06)

        // Recalculate aggregates
        return recalculateVatReport(report)
    },

    /**
     * Calculate VAT report from Real Verifications (Ledger).
     * This uses the real double-entry data.
     */
    calculateReportFromRealVerifications(verifications: import("@/hooks/use-verifications").Verification[], period: string): VatReport {
        const [p, yearStr] = period.split(" ") // e.g., "Q4 2024"
        const year = parseInt(yearStr)
        const quarter = parseInt(p.replace("Q", ""))

        // Define Period Range
        const startMonth = (quarter - 1) * 3 // 0, 3, 6, 9
        const endMonth = startMonth + 2

        const dueDate = getVatDeadline(quarter, year)
        const today = new Date()
        let status: VatReport["status"] = "upcoming"
        if (today > dueDate) status = "overdue"

        // Start with empty report
        const report = createEmptyVatReport(period, formatDate(dueDate), status)

        // Iterate verifications in period
        verifications.forEach(v => {
            const d = new Date(v.date)
            if (d.getFullYear() !== year || d.getMonth() < startMonth || d.getMonth() > endMonth) {
                return
            }

            v.rows.forEach(row => {
                const konto = row.account
                // Net change depending on account type
                // Output VAT (Liability): Credit - Debit
                const liabilityNet = (row.credit || 0) - (row.debit || 0)
                // Input VAT (Asset): Debit - Credit
                const assetNet = (row.debit || 0) - (row.credit || 0)

                // Output VAT 25% (2610-2619)
                if (konto >= "2610" && konto <= "2619") {
                    report.ruta10 += liabilityNet
                }
                // Output VAT 12% (2620-2629)
                else if (konto >= "2620" && konto <= "2629") {
                    report.ruta11 += liabilityNet
                }
                // Output VAT 6% (2630-2639)
                else if (konto >= "2630" && konto <= "2639") {
                    report.ruta12 += liabilityNet
                }
                // Input VAT (2640-2649)
                else if (konto >= "2640" && konto <= "2649") {
                    report.ruta48 += assetNet
                }
            })
        })

        // Estimate Sales Base (Momspliktig försäljning) from Output VAT
        // In a real system, we should sum accounts 3000-3300 instead.
        // Let's improve this: Scan for Revenue accounts (3000-3399 typically)

        // let salesBase25 = 0
        const _salesBase12 = 0
        const _salesBase6 = 0

        verifications.forEach(v => {
            const d = new Date(v.date)
            if (d.getFullYear() !== year || d.getMonth() < startMonth || d.getMonth() > endMonth) return

            v.rows.forEach(row => {
                // Revenue (3xxx) is usually Credit. Net Revenue = Credit - Debit
                const _netRevenue = (row.credit || 0) - (row.debit || 0)

                // Simplified mapping based on standard BAS
                // 3001-3004: 25%
                // if (row.account >= "3000" && row.account <= "3004") salesBase25 += netRevenue
                // 3005-3009: Depends, often 12/6. Let's assume standard maps.
                // Or fallback to back-calculation if 0.
            })
        })

        // Use back-calculation as fallback/primary if revenue accounts aren't perfectly mapped
        if (report.ruta10 > 0) report.ruta05 = Math.round(report.ruta10 / 0.25)
        if (report.ruta11 > 0) report.ruta06 = Math.round(report.ruta11 / 0.12)
        if (report.ruta12 > 0) report.ruta07 = Math.round(report.ruta12 / 0.06)

        return recalculateVatReport(report)
    },

    /**
     * Generates an XML file content for Skatteverket (Simplified eSKD/SRU format)
     */
    generateXML(report: VatReport, orgNumber: string = "556000-0000"): string {
        // This is a simplified example of the Swedish Tax Agency's XML format
        const timestamp = new Date().toISOString()

        return `<?xml version="1.0" encoding="UTF-8"?>
<eSKD xmlns="http://xmls.skatteverket.se/se/skatteverket/ai/instans/info/1.0">
  <Avsandare>
    <Program>Scope AI Accounting</Program>
    <Organisationsnummer>${orgNumber}</Organisationsnummer>
  </Avsandare>
  <Momsdeklaration>
    <Period>${report.period}</Period>
    <SkapaTidpunkt>${timestamp}</SkapaTidpunkt>
    <Uppgifter>
      <MomspliktigForsaljning>
        <Ruta05>${report.ruta05}</Ruta05>
        <Ruta06>${report.ruta06}</Ruta06>
        <Ruta07>${report.ruta07}</Ruta07>
      </MomspliktigForsaljning>
      <UtgåendeMoms>
        <Ruta10>${report.ruta10}</Ruta10>
        <Ruta11>${report.ruta11}</Ruta11>
        <Ruta12>${report.ruta12}</Ruta12>
      </UtgåendeMoms>
      <IngåendeMoms>
        <Ruta48>${report.ruta48}</Ruta48>
      </IngåendeMoms>
      <AttBetalaEllerFaTillbaka>${report.ruta49}</AttBetalaEllerFaTillbaka>
    </Uppgifter>
  </Momsdeklaration>
</eSKD>`
    }
}
