"use client"

import { useCompany } from "@/providers/company-provider"
import {
    Table2Container,
    Table2Section,
    type Table2Item
} from "@/components/bokforing/report-table"
import { cn } from "@/lib/utils"

// ============================================
// Swedish K2/K3 Standard Data
// ============================================

// Resultaträkning (Income Statement) - Swedish structure
const resultatData = {
    rorelseintakter: [
        { label: "Nettoomsättning", value: 1850000 },
        { label: "Övriga rörelseintäkter", value: 0 },
    ],
    rorelsekostnader: [
        { label: "Råvaror och förnödenheter", value: -320000 },
        { label: "Övriga externa kostnader", value: -580000 },
        { label: "Personalkostnader", value: -520000 },
        { label: "Avskrivningar", value: -45000 },
    ],
    finansiellaPoster: [
        { label: "Ränteintäkter och liknande", value: 2500 },
        { label: "Räntekostnader och liknande", value: -8500 },
    ],
}

// Balansräkning (Balance Sheet) - Swedish K2/K3 structure
const balansData = {
    anlaggningstillgangar: [
        { label: "Immateriella anläggningstillgångar", value: 50000 },
        { label: "Materiella anläggningstillgångar", value: 400000 },
    ],
    omsattningstillgangar: [
        { label: "Varulager", value: 125000 },
        { label: "Kundfordringar", value: 285000 },
        { label: "Kassa och bank", value: 520000 },
    ],
    egetKapital: [
        { label: "Aktiekapital", value: 50000 },
        { label: "Balanserat resultat", value: 530000 },
        { label: "Årets resultat", value: 337000 },
    ],
    langfristigaSkulder: [
        { label: "Skulder till kreditinstitut", value: 200000 },
    ],
    kortfristigaSkulder: [
        { label: "Leverantörsskulder", value: 145000 },
        { label: "Skatteskulder", value: 68000 },
        { label: "Övriga kortfristiga skulder", value: 50000 },
    ],
}

// ============================================
// Helper Functions
// ============================================

function sumItems(items: { value: number }[]): number {
    return items.reduce((sum, i) => sum + i.value, 0)
}

// ============================================
// Resultaträkning Component
// ============================================

export function ResultatrakningContent() {
    const { companyType } = useCompany()

    // Calculate subtotals
    const sumRorelseintakter = sumItems(resultatData.rorelseintakter)
    const sumRorelsekostnader = sumItems(resultatData.rorelsekostnader)
    const rorelseresultat = sumRorelseintakter + sumRorelsekostnader
    const sumFinansiella = sumItems(resultatData.finansiellaPoster)
    const resultatForeSkatt = rorelseresultat + sumFinansiella
    const skatt = Math.round(resultatForeSkatt * -0.206) // 20.6% bolagsskatt
    const aretsResultat = resultatForeSkatt + skatt

    return (
        <main className="flex-1 flex flex-col p-6">
            <Table2Container>
                {/* Page Heading */}
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Resultaträkning</h2>
                        <p className="text-muted-foreground">Räkenskapsår 2024 • {companyType.toUpperCase()}</p>
                    </div>
                </div>

                {/* Rörelseintäkter */}
                <Table2Section
                    title="Rörelseintäkter"
                    items={resultatData.rorelseintakter}
                    total={sumRorelseintakter}
                />

                {/* Rörelsekostnader */}
                <Table2Section
                    title="Rörelsekostnader"
                    items={resultatData.rorelsekostnader}
                    total={sumRorelsekostnader}
                />

                {/* Rörelseresultat */}
                <div className="border-t border-border/60 pt-3 mt-3">
                    <div className="flex justify-between items-center py-2 font-medium">
                        <span>Rörelseresultat</span>
                        <span className="tabular-nums">{rorelseresultat.toLocaleString('sv-SE')} kr</span>
                    </div>
                </div>

                {/* Finansiella poster */}
                <Table2Section
                    title="Finansiella poster"
                    items={resultatData.finansiellaPoster}
                    total={sumFinansiella}
                />

                {/* Resultat före skatt */}
                <div className="border-t border-border/60 pt-3 mt-3">
                    <div className="flex justify-between items-center py-2 font-medium">
                        <span>Resultat före skatt</span>
                        <span className="tabular-nums">{resultatForeSkatt.toLocaleString('sv-SE')} kr</span>
                    </div>
                    <div className="flex justify-between items-center py-2 text-muted-foreground">
                        <span>Skatt (20,6%)</span>
                        <span className="tabular-nums">{skatt.toLocaleString('sv-SE')} kr</span>
                    </div>
                </div>

                {/* Årets resultat */}
                <div className="border-t-2 border-primary/30 pt-4 mt-4 bg-muted/20 -mx-2 px-4 py-3 rounded-lg">
                    <div className="flex justify-between items-center font-bold text-lg">
                        <span>Årets resultat</span>
                        <span className={cn(
                            "tabular-nums",
                            aretsResultat >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                        )}>
                            {aretsResultat.toLocaleString('sv-SE')} kr
                        </span>
                    </div>
                </div>
            </Table2Container>
        </main>
    )
}

// ============================================
// Balansräkning Component
// ============================================

export function BalansrakningContent() {
    const { companyType } = useCompany()

    // Calculate subtotals
    const sumAnlaggning = sumItems(balansData.anlaggningstillgangar)
    const sumOmsattning = sumItems(balansData.omsattningstillgangar)
    const summaTillgangar = sumAnlaggning + sumOmsattning

    const sumEgetKapital = sumItems(balansData.egetKapital)
    const sumLangfristiga = sumItems(balansData.langfristigaSkulder)
    const sumKortfristiga = sumItems(balansData.kortfristigaSkulder)
    const sumSkulder = sumLangfristiga + sumKortfristiga
    const summaEgetKapitalOchSkulder = sumEgetKapital + sumSkulder

    // Balance check
    const isBalanced = summaTillgangar === summaEgetKapitalOchSkulder

    return (
        <main className="flex-1 flex flex-col p-6">
            <Table2Container>
                {/* Page Heading */}
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Balansräkning</h2>
                        <p className="text-muted-foreground">Per 2024-12-31 • {companyType.toUpperCase()}</p>
                    </div>
                </div>

                {/* ============ TILLGÅNGAR ============ */}
                <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 pb-2 border-b border-border/60">
                    Tillgångar
                </div>

                <Table2Section
                    title="Anläggningstillgångar"
                    items={balansData.anlaggningstillgangar}
                    total={sumAnlaggning}
                    neutral
                />

                <Table2Section
                    title="Omsättningstillgångar"
                    items={balansData.omsattningstillgangar}
                    total={sumOmsattning}
                    neutral
                />

                {/* Summa tillgångar */}
                <div className="border-t border-border/60 pt-3 mt-3">
                    <div className="flex justify-between items-center py-2 font-semibold">
                        <span>Summa tillgångar</span>
                        <span className="tabular-nums">{summaTillgangar.toLocaleString('sv-SE')} kr</span>
                    </div>
                </div>

                {/* ============ EGET KAPITAL OCH SKULDER ============ */}
                <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 pb-2 border-b border-border/60 mt-8">
                    Eget kapital och skulder
                </div>

                <Table2Section
                    title="Eget kapital"
                    items={balansData.egetKapital}
                    total={sumEgetKapital}
                    neutral
                />

                <Table2Section
                    title="Långfristiga skulder"
                    items={balansData.langfristigaSkulder}
                    total={sumLangfristiga}
                    neutral
                />

                <Table2Section
                    title="Kortfristiga skulder"
                    items={balansData.kortfristigaSkulder}
                    total={sumKortfristiga}
                    neutral
                />

                {/* Summa eget kapital och skulder */}
                <div className="border-t border-border/60 pt-3 mt-3">
                    <div className="flex justify-between items-center py-2 font-semibold">
                        <span>Summa eget kapital och skulder</span>
                        <span className="tabular-nums">{summaEgetKapitalOchSkulder.toLocaleString('sv-SE')} kr</span>
                    </div>
                </div>

                {/* Balance Verification */}
                <div className={cn(
                    "mt-6 p-4 rounded-lg border-2",
                    isBalanced
                        ? "bg-green-500/10 border-green-500/30"
                        : "bg-red-500/10 border-red-500/30"
                )}>
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="font-medium">Balansräkningsprov</span>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Tillgångar {isBalanced ? "=" : "≠"} Eget kapital + Skulder
                            </p>
                        </div>
                        <div className={cn(
                            "text-sm font-medium px-3 py-1 rounded-full",
                            isBalanced
                                ? "bg-green-500/20 text-green-600 dark:text-green-400"
                                : "bg-red-500/20 text-red-600 dark:text-red-400"
                        )}>
                            {isBalanced ? "✓ Balanserar" : "✗ Obalanserad"}
                        </div>
                    </div>
                </div>
            </Table2Container>
        </main>
    )
}
