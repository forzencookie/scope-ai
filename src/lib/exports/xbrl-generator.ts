/**
 * iXBRL Generator for Arsredovisning (K2)
 *
 * Generates iXBRL-structured XML following Bolagsverket's se-cd taxonomy
 * for digital annual report filing. Covers the essential K2 fields for
 * a minimal valid Bolagsverket submission.
 *
 * Taxonomy reference: Bolagsverket se-cd (Swedish Company Reporting)
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
        // Resultatrakning (Income Statement)
        netTurnover: number             // Nettoomsattning
        goodsCost: number               // Ravaror och fornodenheter
        externalCosts: number           // Ovriga externa kostnader
        personnelCosts: number          // Personalkostnader
        depreciation: number            // Av- och nedskrivningar
        operatingResult: number         // Rorelseresultat
        financialItems: number          // Finansiella poster
        profitAfterFin: number          // Resultat efter finansiella poster
        taxOnResult: number             // Skatt pa arets resultat
        netResult: number               // Arets resultat

        // Balansrakning (Balance Sheet)
        fixedAssets: number             // Anlaggningstillgangar
        currentAssets: number           // Omsattningstillgangar
        cashAndBank: number             // Kassa och bank
        totalAssets: number             // Summa tillgangar
        equity: number                  // Eget kapital
        longTermLiabilities: number     // Langfristiga skulder
        shortTermLiabilities: number    // Kortfristiga skulder
        totalEquityAndLiabilities: number // Summa eget kapital och skulder

        // Notes
        averageEmployees?: number       // Medelantal anstallda
        accountingPrinciples?: string   // Redovisningsprinciper
        significantEvents?: string      // Vasentliga handelser
    }
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

function fact(tag: string, contextRef: string, value: number): string {
    return `    <se-cd:${tag} contextRef="${contextRef}" unitRef="SEK" decimals="0">${Math.round(value)}</se-cd:${tag}>`
}

function textFact(tag: string, contextRef: string, value: string): string {
    return `    <se-cd:${tag} contextRef="${contextRef}">${escapeXml(value)}</se-cd:${tag}>`
}

export function generateXBRL(data: XBRLParams): string {
    const lines: string[] = []

    lines.push(`<?xml version="1.0" encoding="UTF-8"?>`)
    lines.push(`<xbrli:xbrl`)
    lines.push(`    xmlns:se-cd="http://www.bolagsverket.se/xbrl/taxonomy/se-cd/2021-01-31"`)
    lines.push(`    xmlns:xbrli="http://www.xbrl.org/2003/instance"`)
    lines.push(`    xmlns:xlink="http://www.w3.org/1999/xlink"`)
    lines.push(`    xmlns:iso4217="http://www.xbrl.org/2003/iso4217">`)
    lines.push(``)

    // Unit definition
    lines.push(`    <xbrli:unit id="SEK">`)
    lines.push(`        <xbrli:measure>iso4217:SEK</xbrli:measure>`)
    lines.push(`    </xbrli:unit>`)
    lines.push(``)

    // Context: Current Year (duration)
    lines.push(`    <!-- Context: Current Year (duration) -->`)
    lines.push(`    <xbrli:context id="CurrentYear">`)
    lines.push(`        <xbrli:entity>`)
    lines.push(`            <xbrli:identifier scheme="http://www.bolagsverket.se">${escapeXml(data.company.orgNumber)}</xbrli:identifier>`)
    lines.push(`        </xbrli:entity>`)
    lines.push(`        <xbrli:period>`)
    lines.push(`            <xbrli:startDate>${data.period.currentStart}</xbrli:startDate>`)
    lines.push(`            <xbrli:endDate>${data.period.currentEnd}</xbrli:endDate>`)
    lines.push(`        </xbrli:period>`)
    lines.push(`    </xbrli:context>`)
    lines.push(``)

    // Context: Current Year End (instant for balance sheet)
    lines.push(`    <!-- Context: Current Year End (instant) -->`)
    lines.push(`    <xbrli:context id="CurrentYearEnd">`)
    lines.push(`        <xbrli:entity>`)
    lines.push(`            <xbrli:identifier scheme="http://www.bolagsverket.se">${escapeXml(data.company.orgNumber)}</xbrli:identifier>`)
    lines.push(`        </xbrli:entity>`)
    lines.push(`        <xbrli:period>`)
    lines.push(`            <xbrli:instant>${data.period.currentEnd}</xbrli:instant>`)
    lines.push(`        </xbrli:period>`)
    lines.push(`    </xbrli:context>`)
    lines.push(``)

    // Context: Previous Year (duration)
    lines.push(`    <!-- Context: Previous Year (duration) -->`)
    lines.push(`    <xbrli:context id="PreviousYear">`)
    lines.push(`        <xbrli:entity>`)
    lines.push(`            <xbrli:identifier scheme="http://www.bolagsverket.se">${escapeXml(data.company.orgNumber)}</xbrli:identifier>`)
    lines.push(`        </xbrli:entity>`)
    lines.push(`        <xbrli:period>`)
    lines.push(`            <xbrli:startDate>${data.period.previousStart}</xbrli:startDate>`)
    lines.push(`            <xbrli:endDate>${data.period.previousEnd}</xbrli:endDate>`)
    lines.push(`        </xbrli:period>`)
    lines.push(`    </xbrli:context>`)
    lines.push(``)

    // Company information
    lines.push(`    <!-- Company Information -->`)
    lines.push(textFact('CompanyName', 'CurrentYear', data.company.name))
    lines.push(textFact('OrganisationNumber', 'CurrentYear', data.company.orgNumber))
    lines.push(``)

    // ==========================================
    // Resultatrakning (Income Statement)
    // ==========================================
    lines.push(`    <!-- Resultatrakning (Income Statement) -->`)
    lines.push(fact('NetTurnover', 'CurrentYear', data.values.netTurnover))
    lines.push(fact('RawMaterialsAndConsumables', 'CurrentYear', data.values.goodsCost))
    lines.push(fact('OtherExternalExpenses', 'CurrentYear', data.values.externalCosts))
    lines.push(fact('StaffCosts', 'CurrentYear', data.values.personnelCosts))
    lines.push(fact('DepreciationAmortisation', 'CurrentYear', data.values.depreciation))
    lines.push(fact('OperatingResult', 'CurrentYear', data.values.operatingResult))
    lines.push(fact('FinancialItems', 'CurrentYear', data.values.financialItems))
    lines.push(fact('ProfitLossAfterFinancialItems', 'CurrentYear', data.values.profitAfterFin))
    lines.push(fact('TaxOnProfitForTheYear', 'CurrentYear', data.values.taxOnResult))
    lines.push(fact('NetProfitLoss', 'CurrentYear', data.values.netResult))
    lines.push(``)

    // ==========================================
    // Balansrakning (Balance Sheet) — instant context
    // ==========================================
    lines.push(`    <!-- Balansrakning (Balance Sheet) -->`)
    lines.push(`    <!-- Tillgangar (Assets) -->`)
    lines.push(fact('FixedAssets', 'CurrentYearEnd', data.values.fixedAssets))
    lines.push(fact('CurrentAssets', 'CurrentYearEnd', data.values.currentAssets))
    lines.push(fact('CashAndBankBalances', 'CurrentYearEnd', data.values.cashAndBank))
    lines.push(fact('TotalAssets', 'CurrentYearEnd', data.values.totalAssets))
    lines.push(``)
    lines.push(`    <!-- Eget kapital och skulder -->`)
    lines.push(fact('Equity', 'CurrentYearEnd', data.values.equity))
    lines.push(fact('LongTermLiabilities', 'CurrentYearEnd', data.values.longTermLiabilities))
    lines.push(fact('ShortTermLiabilities', 'CurrentYearEnd', data.values.shortTermLiabilities))
    lines.push(fact('TotalEquityAndLiabilities', 'CurrentYearEnd', data.values.totalEquityAndLiabilities))
    lines.push(``)

    // ==========================================
    // Notes
    // ==========================================
    lines.push(`    <!-- Noter (Notes) -->`)
    if (data.values.accountingPrinciples) {
        lines.push(textFact('AccountingPrinciples', 'CurrentYear', data.values.accountingPrinciples))
    } else {
        lines.push(textFact('AccountingPrinciples', 'CurrentYear',
            'Arsredovisningen har upprattats i enlighet med arsredovisningslagen och BFNAR 2016:10 (K2).'))
    }
    if (data.values.averageEmployees !== undefined) {
        lines.push(`    <se-cd:AverageNumberOfEmployees contextRef="CurrentYear" decimals="0">${data.values.averageEmployees}</se-cd:AverageNumberOfEmployees>`)
    }
    if (data.values.significantEvents) {
        lines.push(textFact('SignificantEventsAfterBalanceSheetDate', 'CurrentYear', data.values.significantEvents))
    }
    lines.push(``)

    lines.push(`</xbrli:xbrl>`)

    return lines.join('\n')
}
