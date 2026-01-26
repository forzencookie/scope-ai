/**
 * XBRL Generator (Simplified K2 MVP)
 * 
 * Generates a simplified XBRL-like XML structure for Annual Reports.
 * Full K2/XBRL compliance is extremely complex; this follows the general 
 * structure for visualization and testing purposes.
 */

export interface XBRLParams {
    company: {
        name: string
        orgNumber: string
    }
    period: {
        currentStart: string
        currentEnd: string
        previousStart: string
        previousEnd: string
    }
    values: {
        netTurnover: number // Nettoomsättning
        profitAfterFin: number // Resultat efter fin
        equity: number // Eget kapital
        solidity: number // Soliditet %
        // ... many more in real K2
    }
}

export function generateXBRL(data: XBRLParams): string {
    // const docDate = new Date().toISOString().split('T')[0]

    // This is a simplified wrapper. Real XBRL requires massive taxonomy imports.
    return `<?xml version="1.0" encoding="UTF-8"?>
<xbrli:xbrl xmlns:se-cd="http://www.bolagsverket.se/xbrl/taxonomy/se-cd/2021-01-31"
            xmlns:xbrli="http://www.xbrl.org/2003/instance">
    
    <!-- Context: Current Year -->
    <xbrli:context id="CurrentYear">
        <xbrli:entity>
            <xbrli:identifier scheme="http://www.bolagsverket.se">${data.company.orgNumber}</xbrli:identifier>
        </xbrli:entity>
        <xbrli:period>
            <xbrli:startDate>${data.period.currentStart}</xbrli:startDate>
            <xbrli:endDate>${data.period.currentEnd}</xbrli:endDate>
        </xbrli:period>
    </xbrli:context>

    <!-- Context: Previous Year -->
    <xbrli:context id="PreviousYear">
        <xbrli:entity>
            <xbrli:identifier scheme="http://www.bolagsverket.se">${data.company.orgNumber}</xbrli:identifier>
        </xbrli:entity>
        <xbrli:period>
            <xbrli:startDate>${data.period.previousStart}</xbrli:startDate>
            <xbrli:endDate>${data.period.previousEnd}</xbrli:endDate>
        </xbrli:period>
    </xbrli:context>

    <!-- Facts -->
    <se-cd:NetTurnover contextRef="CurrentYear" unitRef="SEK" decimals="0">${Math.round(data.values.netTurnover)}</se-cd:NetTurnover>
    <se-cd:ProfitLossAfterFinancialItems contextRef="CurrentYear" unitRef="SEK" decimals="0">${Math.round(data.values.profitAfterFin)}</se-cd:ProfitLossAfterFinancialItems>
    <se-cd:Equity contextRef="CurrentYear" unitRef="SEK" decimals="0">${Math.round(data.values.equity)}</se-cd:Equity>
    
</xbrli:xbrl>`
}
