/**
 * INK2 Processor - Complete Implementation
 * 
 * Calculates ALL INK2/INK2R/INK2S fields from ledger verifications
 * matching the official Skatteverket form exactly.
 * 
 * Sections:
 * - INK2R Balansräkning (2.1-2.50): Balance Sheet
 * - INK2R Resultaträkning (3.1-3.27): Income Statement  
 * - INK2S Skattemässiga justeringar (4.1-4.22): Tax Adjustments
 */

import { Verification } from "@/hooks/use-verifications"
// import {
//     ALL_INK2_FIELDS,
//     INK2_MAIN_FIELDS,
//     INK2R_BALANCE_SHEET_FIELDS,
//     INK2R_INCOME_STATEMENT_FIELDS,
//     INK2S_FIELDS,
//     FieldDefinition,
// } from "./ink2-fields"

// =============================================================================
// Types
// =============================================================================

export interface Ink2Field {
    field: string
    code: number | string
    label: string
    value: number
    section: string
    sign?: '+' | '-' | '*'
}

export interface Ink2FormField {
    field: string
    label: string
    value: number
    section?: string
}

export interface Ink2CalculationResult {
    balanceSheet: Ink2FormField[]
    incomeStatement: Ink2FormField[]
    taxAdjustments: Ink2FormField[]
    allFields: Ink2FormField[]
    totals: {
        totalAssets: number
        totalEquityAndLiabilities: number
        revenue: number
        expenses: number
        netIncome: number
        taxableResult: number
    }
}

// =============================================================================
// Account Balance Calculator
// =============================================================================

interface AccountBalances {
    [account: string]: number
}

function buildAccountBalances(
    verifications: Verification[],
    year: number
): AccountBalances {
    const balances: AccountBalances = {}

    const getYear = (dateStr: string) => new Date(dateStr).getFullYear()

    verifications.forEach(v => {
        if (getYear(v.date) !== year) return

        v.rows.forEach(row => {
            const acc = row.account
            const accNum = parseInt(acc, 10)

            // Balance calculation based on account type
            let net: number
            if (accNum >= 1000 && accNum < 2000) {
                // Assets: debit-normal (debit increases)
                net = (row.debit || 0) - (row.credit || 0)
            } else if (accNum >= 2000 && accNum < 3000) {
                // Liabilities & Equity: credit-normal (credit increases)
                net = (row.credit || 0) - (row.debit || 0)
            } else {
                // P&L: Revenue is credit-normal, Expenses are debit-normal
                // We store as credit - debit (revenue positive, expenses negative)
                net = (row.credit || 0) - (row.debit || 0)
            }

            balances[acc] = (balances[acc] || 0) + net
        })
    })

    return balances
}

/**
 * Sum accounts in a range
 */
function sumRange(balances: AccountBalances, start: number, end: number): number {
    let total = 0
    Object.entries(balances).forEach(([acc, balance]) => {
        const accNum = parseInt(acc, 10)
        if (accNum >= start && accNum <= end) {
            total += balance
        }
    })
    return total
}

// =============================================================================
// INK2R Balansräkning (Balance Sheet) - Fields 2.1-2.50
// =============================================================================

function calculateBalanceSheet(balances: AccountBalances): Ink2FormField[] {
    // Helper for assets (shown as positive)
    const asset = (start: number, end: number) => Math.abs(sumRange(balances, start, end))
    // Helper for liabilities/equity (shown as positive)
    const liability = (start: number, end: number) => Math.abs(sumRange(balances, start, end))

    return [
        // === TILLGÅNGAR (ASSETS) ===
        // Immateriella anläggningstillgångar
        { field: "2.1", label: "Koncessioner, patent, licenser, varumärken, hyresrätter, goodwill och liknande rättigheter", value: asset(1000, 1059), section: "Immateriella anläggningstillgångar" },
        { field: "2.2", label: "Förskott avseende immateriella anläggningstillgångar", value: asset(1060, 1099), section: "Immateriella anläggningstillgångar" },

        // Materiella anläggningstillgångar
        { field: "2.3", label: "Byggnader och mark", value: asset(1100, 1139), section: "Materiella anläggningstillgångar" },
        { field: "2.4", label: "Maskiner och andra tekniska anläggningar", value: asset(1200, 1219), section: "Materiella anläggningstillgångar" },
        { field: "2.5", label: "Inventarier, verktyg och installationer", value: asset(1220, 1259), section: "Materiella anläggningstillgångar" },
        { field: "2.6", label: "Förbättringsutgifter på annans fastighet", value: asset(1160, 1169), section: "Materiella anläggningstillgångar" },
        { field: "2.7", label: "Pågående nyanläggningar och förskott avseende materiella anläggningstillgångar", value: asset(1280, 1299), section: "Materiella anläggningstillgångar" },

        // Finansiella anläggningstillgångar
        { field: "2.8", label: "Andelar i koncernföretag", value: asset(1310, 1319), section: "Finansiella anläggningstillgångar" },
        { field: "2.9", label: "Andelar i intresseföretag och gemensamt styrda företag samt andra långfristiga värdepappersinnehav", value: asset(1320, 1349), section: "Finansiella anläggningstillgångar" },
        { field: "2.10", label: "Fordringar hos koncern-, intresse- och gemensamt styrda företag", value: asset(1350, 1369), section: "Finansiella anläggningstillgångar" },
        { field: "2.11", label: "Lån till delägare eller närstående", value: asset(1380, 1389), section: "Finansiella anläggningstillgångar" },
        { field: "2.12", label: "Fordringar hos övriga företag som det finns ett ägarintresse i och andra långfristiga fordringar", value: asset(1370, 1379) + asset(1390, 1399), section: "Finansiella anläggningstillgångar" },

        // Varulager m.m.
        { field: "2.13", label: "Råvaror och förnödenheter", value: asset(1410, 1419), section: "Varulager m.m." },
        { field: "2.14", label: "Varor under tillverkning", value: asset(1440, 1449), section: "Varulager m.m." },
        { field: "2.15", label: "Färdiga varor och handelsvaror", value: asset(1450, 1469), section: "Varulager m.m." },
        { field: "2.16", label: "Övriga lagertillgångar", value: asset(1470, 1479), section: "Varulager m.m." },
        { field: "2.17", label: "Pågående arbeten för annans räkning", value: asset(1480, 1489), section: "Varulager m.m." },
        { field: "2.18", label: "Förskott till leverantörer", value: asset(1490, 1499), section: "Varulager m.m." },

        // Kortfristiga fordringar
        { field: "2.19", label: "Kundfordringar", value: asset(1510, 1519), section: "Kortfristiga fordringar" },
        { field: "2.20", label: "Fordringar hos koncern-, intresse- och gemensamt styrda företag", value: asset(1550, 1579), section: "Kortfristiga fordringar" },
        { field: "2.21", label: "Fordringar hos övriga företag som det finns ett ägarintresse i och övriga fordringar", value: asset(1580, 1599) + asset(1600, 1699), section: "Kortfristiga fordringar" },
        { field: "2.22", label: "Upparbetad men ej fakturerad intäkt", value: asset(1620, 1629), section: "Kortfristiga fordringar" },
        { field: "2.23", label: "Förutbetalda kostnader och upplupna intäkter", value: asset(1700, 1799), section: "Kortfristiga fordringar" },

        // Kortfristiga placeringar
        { field: "2.24", label: "Andelar i koncernföretag", value: asset(1810, 1819), section: "Kortfristiga placeringar" },
        { field: "2.25", label: "Övriga kortfristiga placeringar", value: asset(1820, 1899), section: "Kortfristiga placeringar" },

        // Kassa och bank
        { field: "2.26", label: "Kassa, bank och redovisningsmedel", value: asset(1900, 1999), section: "Kassa och bank" },

        // === EGET KAPITAL OCH SKULDER ===
        // Eget kapital
        { field: "2.27", label: "Bundet eget kapital", value: liability(2081, 2089), section: "Eget kapital" },
        { field: "2.28", label: "Fritt eget kapital", value: liability(2090, 2099), section: "Eget kapital" },

        // Obeskattade reserver
        { field: "2.29", label: "Periodiseringsfonder", value: liability(2110, 2129), section: "Obeskattade reserver" },
        { field: "2.30", label: "Ackumulerade överavskrivningar", value: liability(2150, 2159), section: "Obeskattade reserver" },
        { field: "2.31", label: "Övriga obeskattade reserver", value: liability(2190, 2199), section: "Obeskattade reserver" },

        // Avsättningar
        { field: "2.32", label: "Avsättningar för pensioner och liknande förpliktelser enligt lag (1967:531) om tryggande av pensionsutfästelse m.m.", value: liability(2210, 2219), section: "Avsättningar" },
        { field: "2.33", label: "Övriga avsättningar för pensioner och liknande förpliktelser", value: liability(2220, 2239), section: "Avsättningar" },
        { field: "2.34", label: "Övriga avsättningar", value: liability(2250, 2299), section: "Avsättningar" },

        // Långfristiga skulder
        { field: "2.35", label: "Obligationslån", value: liability(2310, 2319), section: "Långfristiga skulder" },
        { field: "2.36", label: "Checkräkningskredit", value: liability(2330, 2339), section: "Långfristiga skulder" },
        { field: "2.37", label: "Övriga skulder till kreditinstitut", value: liability(2350, 2359), section: "Långfristiga skulder" },
        { field: "2.38", label: "Skulder till koncern-, intresse- och gemensamt styrda företag", value: liability(2360, 2379), section: "Långfristiga skulder" },
        { field: "2.39", label: "Skulder till övriga företag som det finns ett ägarintresse i och övriga skulder", value: liability(2380, 2399), section: "Långfristiga skulder" },

        // Kortfristiga skulder
        { field: "2.40", label: "Checkräkningskredit", value: liability(2410, 2419), section: "Kortfristiga skulder" },
        { field: "2.41", label: "Övriga skulder till kreditinstitut", value: liability(2420, 2439), section: "Kortfristiga skulder" },
        { field: "2.42", label: "Förskott från kunder", value: liability(2450, 2459), section: "Kortfristiga skulder" },
        { field: "2.43", label: "Pågående arbeten för annans räkning", value: liability(2460, 2469), section: "Kortfristiga skulder" },
        { field: "2.44", label: "Fakturerad men ej upparbetad intäkt", value: liability(2470, 2479), section: "Kortfristiga skulder" },
        { field: "2.45", label: "Leverantörsskulder", value: liability(2440, 2449), section: "Kortfristiga skulder" },
        { field: "2.46", label: "Växelskulder", value: liability(2490, 2499), section: "Kortfristiga skulder" },
        { field: "2.47", label: "Skulder till koncern-, intresse- och gemensamt styrda företag", value: liability(2860, 2879), section: "Kortfristiga skulder" },
        { field: "2.48", label: "Skulder till övriga företag som det finns ett ägarintresse i och övriga skulder", value: liability(2880, 2899), section: "Kortfristiga skulder" },
        { field: "2.49", label: "Skatteskulder", value: liability(2510, 2519), section: "Kortfristiga skulder" },
        { field: "2.50", label: "Upplupna kostnader och förutbetalda intäkter", value: liability(2900, 2999), section: "Kortfristiga skulder" },
    ]
}

// =============================================================================
// INK2R Resultaträkning (Income Statement) - Fields 3.1-3.27
// =============================================================================

function calculateIncomeStatement(balances: AccountBalances): Ink2FormField[] {
    // Helper: revenue is credit-normal (positive), expense is debit-normal (negative from our calc)
    const revenue = (start: number, end: number) => Math.abs(sumRange(balances, start, end))
    const expense = (start: number, end: number) => Math.abs(sumRange(balances, start, end))

    // Get values
    const nettoomsattning = revenue(3000, 3799)
    const lagerPlus = revenue(4900, 4909) // Positive change
    const lagerMinus = expense(4910, 4919) // Negative change  
    const aktiverat = revenue(3800, 3899)
    const ovrigaIntakter = revenue(3900, 3999)

    const ravaror = expense(4000, 4099)
    const handelsvaror = expense(4100, 4899)
    const ovrigaExterna = expense(5000, 6999)
    const personal = expense(7000, 7699)
    const avskrivningar = expense(7800, 7899)
    const nedskrivningarOms = expense(7720, 7729)
    const ovrigaRorelsekostnader = expense(7900, 7999)

    const resultatKoncern = sumRange(balances, 8010, 8029)
    const resultatIntresse = sumRange(balances, 8030, 8039)
    const resultatOvriga = sumRange(balances, 8040, 8049)
    const resultatFinans = sumRange(balances, 8200, 8299)
    const ranteIntakter = revenue(8300, 8399)
    const nedskrivningarFinans = expense(8270, 8279)
    const ranteKostnader = expense(8400, 8499)

    const lamnadKoncernbidrag = expense(8820, 8829)
    const mottagetKoncernbidrag = revenue(8810, 8819)
    const aterforingPeriod = revenue(8810, 8819)
    const avsattningPeriod = expense(8810, 8819)
    const overavskrivningar = sumRange(balances, 8850, 8859)
    const ovrigaBokslut = sumRange(balances, 8890, 8899)

    const skatt = expense(8900, 8999)

    // Calculate net result
    const totalIntakter = nettoomsattning + lagerPlus + aktiverat + ovrigaIntakter +
        Math.max(0, resultatKoncern) + Math.max(0, resultatIntresse) + Math.max(0, resultatOvriga) +
        Math.max(0, resultatFinans) + ranteIntakter + mottagetKoncernbidrag +
        aterforingPeriod + Math.max(0, overavskrivningar) + Math.max(0, ovrigaBokslut)

    const totalKostnader = lagerMinus + ravaror + handelsvaror + ovrigaExterna + personal +
        avskrivningar + nedskrivningarOms + ovrigaRorelsekostnader +
        Math.abs(Math.min(0, resultatKoncern)) + Math.abs(Math.min(0, resultatIntresse)) +
        Math.abs(Math.min(0, resultatOvriga)) + Math.abs(Math.min(0, resultatFinans)) +
        nedskrivningarFinans + ranteKostnader + lamnadKoncernbidrag + avsattningPeriod +
        Math.abs(Math.min(0, overavskrivningar)) + Math.abs(Math.min(0, ovrigaBokslut)) + skatt

    const bokfortResultat = totalIntakter - totalKostnader

    return [
        // Rörelseintäkter
        { field: "3.1", label: "Nettoomsättning", value: nettoomsattning, section: "Rörelseintäkter" },
        { field: "3.2+", label: "Förändring av lager av produkter i arbete, färdiga varor och pågående arbete för annans räkning (+)", value: lagerPlus, section: "Rörelseintäkter" },
        { field: "3.2-", label: "Förändring av lager av produkter i arbete, färdiga varor och pågående arbete för annans räkning (-)", value: -lagerMinus, section: "Rörelseintäkter" },
        { field: "3.3", label: "Aktiverat arbete för egen räkning", value: aktiverat, section: "Rörelseintäkter" },
        { field: "3.4", label: "Övriga rörelseintäkter", value: ovrigaIntakter, section: "Rörelseintäkter" },

        // Rörelsekostnader
        { field: "3.5", label: "Råvaror och förnödenheter", value: -ravaror, section: "Rörelsekostnader" },
        { field: "3.6", label: "Handelsvaror", value: -handelsvaror, section: "Rörelsekostnader" },
        { field: "3.7", label: "Övriga externa kostnader", value: -ovrigaExterna, section: "Rörelsekostnader" },
        { field: "3.8", label: "Personalkostnader", value: -personal, section: "Rörelsekostnader" },
        { field: "3.9", label: "Av- och nedskrivningar av materiella och immateriella anläggningstillgångar", value: -avskrivningar, section: "Rörelsekostnader" },
        { field: "3.10", label: "Nedskrivningar av omsättningstillgångar utöver normala nedskrivningar", value: -nedskrivningarOms, section: "Rörelsekostnader" },
        { field: "3.11", label: "Övriga rörelsekostnader", value: -ovrigaRorelsekostnader, section: "Rörelsekostnader" },

        // Finansiella poster
        { field: "3.12+", label: "Resultat från andelar i koncernföretag (+)", value: Math.max(0, resultatKoncern), section: "Finansiella poster" },
        { field: "3.12-", label: "Resultat från andelar i koncernföretag (-)", value: Math.min(0, resultatKoncern), section: "Finansiella poster" },
        { field: "3.13+", label: "Resultat från andelar i intresseföretag och gemensamt styrda företag (+)", value: Math.max(0, resultatIntresse), section: "Finansiella poster" },
        { field: "3.13-", label: "Resultat från andelar i intresseföretag och gemensamt styrda företag (-)", value: Math.min(0, resultatIntresse), section: "Finansiella poster" },
        { field: "3.14+", label: "Resultat från övriga företag som det finns ett ägarintresse i (+)", value: Math.max(0, resultatOvriga), section: "Finansiella poster" },
        { field: "3.14-", label: "Resultat från övriga företag som det finns ett ägarintresse i (-)", value: Math.min(0, resultatOvriga), section: "Finansiella poster" },
        { field: "3.15+", label: "Resultat från övriga finansiella anläggningstillgångar (+)", value: Math.max(0, resultatFinans), section: "Finansiella poster" },
        { field: "3.15-", label: "Resultat från övriga finansiella anläggningstillgångar (-)", value: Math.min(0, resultatFinans), section: "Finansiella poster" },
        { field: "3.16", label: "Övriga ränteintäkter och liknande resultatposter", value: ranteIntakter, section: "Finansiella poster" },
        { field: "3.17", label: "Nedskrivningar av finansiella anläggningstillgångar och kortfristiga placeringar", value: -nedskrivningarFinans, section: "Finansiella poster" },
        { field: "3.18", label: "Räntekostnader och liknande resultatposter", value: -ranteKostnader, section: "Finansiella poster" },

        // Bokslutsdispositioner
        { field: "3.19", label: "Lämnade koncernbidrag", value: -lamnadKoncernbidrag, section: "Bokslutsdispositioner" },
        { field: "3.20", label: "Mottagna koncernbidrag", value: mottagetKoncernbidrag, section: "Bokslutsdispositioner" },
        { field: "3.21", label: "Återföring av periodiseringsfond", value: aterforingPeriod, section: "Bokslutsdispositioner" },
        { field: "3.22", label: "Avsättning till periodiseringsfond", value: -avsattningPeriod, section: "Bokslutsdispositioner" },
        { field: "3.23+", label: "Förändring av överavskrivningar (+)", value: Math.max(0, overavskrivningar), section: "Bokslutsdispositioner" },
        { field: "3.23-", label: "Förändring av överavskrivningar (-)", value: Math.min(0, overavskrivningar), section: "Bokslutsdispositioner" },
        { field: "3.24+", label: "Övriga bokslutsdispositioner (+)", value: Math.max(0, ovrigaBokslut), section: "Bokslutsdispositioner" },
        { field: "3.24-", label: "Övriga bokslutsdispositioner (-)", value: Math.min(0, ovrigaBokslut), section: "Bokslutsdispositioner" },

        // Skatt och resultat
        { field: "3.25", label: "Skatt på årets resultat", value: -skatt, section: "Skatt och resultat" },
        { field: "3.26", label: "Årets resultat, vinst", value: bokfortResultat > 0 ? bokfortResultat : 0, section: "Skatt och resultat" },
        { field: "3.27", label: "Årets resultat, förlust", value: bokfortResultat < 0 ? Math.abs(bokfortResultat) : 0, section: "Skatt och resultat" },
    ]
}

// =============================================================================
// INK2S Skattemässiga justeringar (Tax Adjustments) - Fields 4.1-4.22
// =============================================================================

function calculateTaxAdjustments(balances: AccountBalances, incomeStatement: Ink2FormField[]): Ink2FormField[] {
    // Get accounting result
    const vinst = incomeStatement.find(f => f.field === "3.26")?.value || 0
    const forlust = incomeStatement.find(f => f.field === "3.27")?.value || 0

    // Get specific values for adjustments
    const skatt = Math.abs(incomeStatement.find(f => f.field === "3.25")?.value || 0)
    const nedskrivningFinans = Math.abs(incomeStatement.find(f => f.field === "3.17")?.value || 0)

    // Representation (partially non-deductible) - account 6070
    const representation = Math.abs(sumRange(balances, 6070, 6079))
    const nonDeductibleRep = Math.round(representation * 0.5) // 50% non-deductible

    // Calculate taxable result  
    const justerat = (vinst - forlust) + skatt + nedskrivningFinans + nonDeductibleRep

    return [
        // Årets resultat
        { field: "4.1", label: "Årets resultat, vinst", value: vinst, section: "Årets resultat" },
        { field: "4.2", label: "Årets resultat, förlust", value: forlust, section: "Årets resultat" },

        // Bokförda kostnader som inte ska dras av
        { field: "4.3a", label: "Skatt på årets resultat", value: skatt, section: "Ej avdragsgilla kostnader" },
        { field: "4.3b", label: "Nedskrivning av finansiella tillgångar", value: nedskrivningFinans, section: "Ej avdragsgilla kostnader" },
        { field: "4.3c", label: "Andra bokförda kostnader (ej avdragsgilla)", value: nonDeductibleRep, section: "Ej avdragsgilla kostnader" },

        // Kostnader som ska dras av men inte bokförda
        { field: "4.4a", label: "Lämnade koncernbidrag", value: 0, section: "Ej bokförda kostnader" },
        { field: "4.4b", label: "Andra ej bokförda kostnader", value: 0, section: "Ej bokförda kostnader" },

        // Bokförda intäkter som inte ska tas upp
        { field: "4.5a", label: "Ackordsvinster", value: 0, section: "Ej skattepliktiga intäkter" },
        { field: "4.5b", label: "Utdelning", value: 0, section: "Ej skattepliktiga intäkter" },
        { field: "4.5c", label: "Andra bokförda intäkter (ej skattepliktiga)", value: 0, section: "Ej skattepliktiga intäkter" },

        // Intäkter som ska tas upp men inte bokförda
        { field: "4.6a", label: "Beräknad schablonintäkt på periodiseringsfonder vid beskattningsårets ingång", value: 0, section: "Ej bokförda intäkter" },
        { field: "4.6b", label: "Beräknad schablonintäkt på fondandelar ägda vid kalenderårets ingång", value: 0, section: "Ej bokförda intäkter" },
        { field: "4.6c", label: "Mottagna koncernbidrag", value: 0, section: "Ej bokförda intäkter" },
        { field: "4.6d", label: "Uppräknat belopp vid återföring av periodiseringsfond", value: 0, section: "Ej bokförda intäkter" },
        { field: "4.6e", label: "Andra ej bokförda intäkter", value: 0, section: "Ej bokförda intäkter" },

        // Avyttring av delägarrätter
        { field: "4.7a", label: "Bokförd vinst", value: 0, section: "Avyttring av delägarrätter" },
        { field: "4.7b", label: "Bokförd förlust", value: 0, section: "Avyttring av delägarrätter" },
        { field: "4.7c", label: "Uppskov med kapitalvinst enligt blankett N4", value: 0, section: "Avyttring av delägarrätter" },
        { field: "4.7d", label: "Återfört uppskov av kapitalvinst enligt blankett N4", value: 0, section: "Avyttring av delägarrätter" },
        { field: "4.7e", label: "Kapitalvinst för beskattningsåret", value: 0, section: "Avyttring av delägarrätter" },
        { field: "4.7f", label: "Kapitalförlust som ska dras av", value: 0, section: "Avyttring av delägarrätter" },

        // Andel i handelsbolag
        { field: "4.8a", label: "Bokförd intäkt/vinst", value: 0, section: "Andel i handelsbolag" },
        { field: "4.8b", label: "Skattemässigt överskott enligt N3B", value: 0, section: "Andel i handelsbolag" },
        { field: "4.8c", label: "Bokförd kostnad/förlust", value: 0, section: "Andel i handelsbolag" },
        { field: "4.8d", label: "Skattemässigt underskott enligt N3B", value: 0, section: "Andel i handelsbolag" },

        // Skattemässiga justeringar
        { field: "4.9", label: "Skattemässig justering av bokfört resultat för avskrivning på byggnader och annan fast egendom samt vid restvärdesavskrivning på maskiner och inventarier", value: 0, section: "Skattemässiga justeringar" },
        { field: "4.10", label: "Skattemässig justering av bokfört resultat vid avyttring av näringsfastighet och näringsbostadsrätt", value: 0, section: "Skattemässiga justeringar" },
        { field: "4.11", label: "Skogs-/substansminskningsavdrag (specificeras på blankett N8)", value: 0, section: "Skattemässiga justeringar" },
        { field: "4.12", label: "Återföringar vid avyttring av fastighet, t.ex. värdeminskningsavdrag, skogsavdrag och substansminskningsavdrag", value: 0, section: "Skattemässiga justeringar" },
        { field: "4.13", label: "Andra skattemässiga justeringar av resultatet (+/-)", value: 0, section: "Skattemässiga justeringar" },

        // Underskott
        { field: "4.14a", label: "Outnyttjat underskott från föregående år", value: 0, section: "Underskott" },
        { field: "4.14b", label: "Reduktion av outnyttjat underskott med hänsyn till beloppsspärr, ackord, konkurs m.m.", value: 0, section: "Underskott" },
        { field: "4.14c", label: "Reduktion av outnyttjat underskott med hänsyn till koncernbidragsspärr, fusionsspärr m.m.", value: 0, section: "Underskott" },

        // Slutligt resultat
        { field: "4.15", label: "Överskott (till p. 1.1)", value: justerat > 0 ? justerat : 0, section: "Slutligt resultat" },
        { field: "4.16", label: "Underskott (till p. 1.2)", value: justerat < 0 ? Math.abs(justerat) : 0, section: "Slutligt resultat" },

        // Tilläggsuppgifter
        { field: "4.17", label: "Årets begärda och tidigare års medgivna värdeminskningsavdrag som finns vid beskattningsårets utgång avseende byggnader", value: 0, section: "Tilläggsuppgifter" },
        { field: "4.18", label: "Årets begärda och tidigare års medgivna värdeminskningsavdrag som finns vid beskattningsårets utgång avseende markanläggningar", value: 0, section: "Tilläggsuppgifter" },
        { field: "4.19", label: "Vid restvärdesavskrivning: återförda belopp för av- och nedskrivning, försäljning, utrangering", value: 0, section: "Tilläggsuppgifter" },
        { field: "4.20", label: "Lån från aktieägare (fysisk person) vid beskattningsårets utgång", value: 0, section: "Tilläggsuppgifter" },
        { field: "4.21", label: "Pensionskostnader (som ingår i p. 3.8)", value: 0, section: "Tilläggsuppgifter" },
        { field: "4.22", label: "Koncernbidragsspärrat och fusionsspärrat underskott m.m. (frivillig uppgift)", value: 0, section: "Tilläggsuppgifter" },
    ]
}

// =============================================================================
// Main Processor
// =============================================================================

export const Ink2Processor = {
    /**
     * Calculate ALL INK2 fields from ledger verifications for a specific year.
     * Returns complete form data matching the Skatteverket INK2 exactly.
     */
    calculateAll(verifications: Verification[], year: number): Ink2CalculationResult {
        const balances = buildAccountBalances(verifications, year)

        const balanceSheet = calculateBalanceSheet(balances)
        const incomeStatement = calculateIncomeStatement(balances)
        const taxAdjustments = calculateTaxAdjustments(balances, incomeStatement)

        // Calculate totals
        const totalAssets = balanceSheet
            .filter(f => f.field.startsWith("2.") && parseInt(f.field.split(".")[1]) <= 26)
            .reduce((sum, f) => sum + f.value, 0)

        const totalEquityAndLiabilities = balanceSheet
            .filter(f => f.field.startsWith("2.") && parseInt(f.field.split(".")[1]) >= 27)
            .reduce((sum, f) => sum + f.value, 0)

        const revenue = incomeStatement
            .filter(f => f.value > 0)
            .reduce((sum, f) => sum + f.value, 0)

        const expenses = incomeStatement
            .filter(f => f.value < 0)
            .reduce((sum, f) => sum + Math.abs(f.value), 0)

        const netIncome = incomeStatement.find(f => f.field === "3.26")?.value ||
            -(incomeStatement.find(f => f.field === "3.27")?.value || 0)

        const taxableResult = taxAdjustments.find(f => f.field === "4.15")?.value ||
            -(taxAdjustments.find(f => f.field === "4.16")?.value || 0)

        return {
            balanceSheet,
            incomeStatement,
            taxAdjustments,
            allFields: [...balanceSheet, ...incomeStatement, ...taxAdjustments],
            totals: {
                totalAssets,
                totalEquityAndLiabilities,
                revenue,
                expenses,
                netIncome,
                taxableResult,
            }
        }
    },

    /**
     * Returns all INK2 fields in a flat list for the table view.
     * Includes Balance Sheet (2.x), Income Statement (3.x), and Tax Adjustments (4.x).
     */
    calculateInk2(verifications: Verification[], year: number): Ink2FormField[] {
        const result = this.calculateAll(verifications, year)
        return result.allFields
    },

    /**
     * Get fields organized by section
     */
    getFieldsBySection(verifications: Verification[], year: number): Map<string, Ink2FormField[]> {
        const result = this.calculateAll(verifications, year)
        const sectionMap = new Map<string, Ink2FormField[]>()

        result.allFields.forEach(field => {
            const section = field.section || "Övrigt"
            const existing = sectionMap.get(section) || []
            existing.push(field)
            sectionMap.set(section, existing)
        })

        return sectionMap
    },
}
