"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { InfoCardRenderer, type InfoCardType } from "@/components/ai/chat-tools/information-cards"
import { ActivityFeedCard } from "@/components/ai/chat-tools/information-cards/activity-feed-card"
import { AuditCard } from "@/components/ai/chat-tools/information-cards/audit-card"
import { BuyCreditsCheckout } from "@/components/ai/cards/BuyCreditsCard"
import { AIUsageCard } from "@/components/ai/cards/AIUsageCard"

// =============================================================================
// Feed & status cards
// =============================================================================

export default function InformationCardsPage() {
    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="max-w-3xl mx-auto px-6 pt-6">
                <Link
                    href="/test-ui/chat-tools"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Chat Tools
                </Link>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-8 space-y-12">

                {/* Feed cards */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight mb-1">Information Cards</h1>
                    <p className="text-sm text-muted-foreground mb-8">
                        Kort som visar data — tidslinjer, statusöversikter, beräkningar, listor. Ingen mutation.
                    </p>

                    <div className="space-y-8">
                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Aktivitetsflöde</h3>
                                <span className="text-xs text-muted-foreground">Vad som hänt under en vald period</span>
                            </div>
                            <div className="max-w-lg">
                                <ActivityFeedCard
                                    title="Aktivitet igår"
                                    description="4 händelser den 4 april 2026"
                                    events={[
                                        { id: "1", action: "booked",  entityType: "transaction", title: "Kontorshyra april",           description: "8 500 kr → 5010 Lokalhyra. Ver A-47.", timestamp: "09:14" },
                                        { id: "2", action: "created", entityType: "invoice",     title: "Faktura #2026-042 till Acme AB", description: "37 500 kr inkl. moms",              timestamp: "11:30" },
                                        { id: "3", action: "updated", entityType: "employee",    title: "Anna Lindberg",                 description: "Kommun ändrad: Solna → Stockholm",   timestamp: "14:02" },
                                        { id: "4", action: "booked",  entityType: "receipt",     title: "Postnord — Porto",              description: "89 kr → 6250 Porto. Ver A-48.",      timestamp: "16:45" },
                                    ]}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Statusöversikt — Månadsavslut</h3>
                                <span className="text-xs text-muted-foreground">Statusbadges per punkt att granska</span>
                            </div>
                            <div className="max-w-lg">
                                <ActivityFeedCard
                                    title="Månadsavslut mars 2026"
                                    description="5 punkter att granska"
                                    events={[
                                        { id: "1", action: "done",    entityType: "check", title: "Alla kvitton bokförda",       description: null, timestamp: null },
                                        { id: "2", action: "warning", entityType: "check", title: "Momsavstämning",              description: "Differens 340 kr mellan konto 2641 och beräknad moms", timestamp: null },
                                        { id: "3", action: "error",   entityType: "check", title: "Faktura #2026-039 ej bokförd", description: "15 000 kr. Skickad men saknar verifikation.", timestamp: null },
                                        { id: "4", action: "pending", entityType: "check", title: "Periodisering försäkring",    description: "9 månader kvar att periodisera av 12 000 kr", timestamp: null },
                                        { id: "5", action: "done",    entityType: "check", title: "Semesterskuld uppdaterad",    description: null, timestamp: null },
                                    ]}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Audit cards */}
                <div className="border-t pt-12">
                    <h2 className="text-xl font-bold tracking-tight mb-1">Granskningskort</h2>
                    <p className="text-sm text-muted-foreground mb-8">
                        Balanskontroll och resultatkontroll — pass/warning/fail visas direkt i chatten.
                    </p>

                    <div className="space-y-8">
                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Balanskontroll</h3>
                                <span className="text-xs text-muted-foreground">Rimlighetskontroll av balansräkningen</span>
                            </div>
                            <div className="max-w-lg">
                                <AuditCard audit={{
                                    date: "2026-03-28",
                                    checks: [
                                        { name: "Debet = Kredit",          status: "pass",    description: "Alla verifikationer balanserar", details: "Totalt 47 verifikationer kontrollerade" },
                                        { name: "Bank stämmer",            status: "pass",    description: "Konto 1930 matchar kontoutdrag" },
                                        { name: "Momsavstämning",          status: "warning", description: "Ingående moms avviker med 340 kr", details: "Konto 2641 visar 23 340 kr, beräknad moms 23 000 kr" },
                                        { name: "Periodiseringar",         status: "pass",    description: "Inga ouppmärkta periodiseringar" },
                                        { name: "Verifikationsnumrering",  status: "pass",    description: "Sekventiell numrering A1-A47 utan luckor" },
                                    ],
                                    summary: { total: 5, passed: 4, warnings: 1, failed: 0 },
                                }} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Balanskontroll — med fel</h3>
                                <span className="text-xs text-muted-foreground">Visar hur det ser ut när kontroller misslyckas</span>
                            </div>
                            <div className="max-w-lg">
                                <AuditCard audit={{
                                    date: "2026-03-28",
                                    checks: [
                                        { name: "Debet = Kredit",         status: "pass",    description: "Alla verifikationer balanserar" },
                                        { name: "Bank stämmer",           status: "fail",    description: "Konto 1930 avviker med 12 500 kr", details: "Bokfört saldo: 145 200 kr. Kontoutdrag: 157 700 kr." },
                                        { name: "Momsavstämning",         status: "warning", description: "Ingående moms avviker med 340 kr" },
                                        { name: "Verifikationsnumrering", status: "fail",    description: "Lucka i numreringen: A23 saknas", details: "Serien hoppar från A22 till A24. BFL kräver löpande numrering." },
                                    ],
                                    summary: { total: 4, passed: 1, warnings: 1, failed: 2 },
                                }} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Resultatkontroll</h3>
                                <span className="text-xs text-muted-foreground">Rimlighetskontroll av resultaträkningen</span>
                            </div>
                            <div className="max-w-lg">
                                <AuditCard audit={{
                                    date: "2026-03-28",
                                    checks: [
                                        { name: "Bruttomarginal",       status: "pass",    description: "33.7% — inom förväntat intervall (25-45%)" },
                                        { name: "Personalkostnader",    status: "pass",    description: "45.5% av omsättning — rimligt för tjänsteföretag" },
                                        { name: "Övriga kostnader",     status: "warning", description: "18.4% av omsättning — något högt", details: "Förväntat intervall: 10-15%. Kontrollera konto 6070 och 6210." },
                                        { name: "Rörelseresultat",      status: "pass",    description: "Positivt rörelseresultat: 152 000 kr" },
                                    ],
                                    summary: { total: 4, passed: 3, warnings: 1, failed: 0 },
                                }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Billing cards */}
                <div className="border-t pt-12">
                    <h2 className="text-xl font-bold tracking-tight mb-1">Fakturering & Krediter</h2>
                    <p className="text-sm text-muted-foreground mb-8">AI-användning och kreditköp.</p>

                    <div className="space-y-8">
                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">AI-användning</h3>
                                <span className="text-xs text-muted-foreground">Hur mycket AI-budget som förbrukats</span>
                            </div>
                            <div className="max-w-lg">
                                <AIUsageCard usage={{
                                    tokensUsed: 847000, tokenLimit: 1000000, extraCredits: 200000,
                                    totalAvailable: 1200000, usagePercent: 71, thresholdLevel: "high",
                                    shouldShowReminder: true,
                                    reminderMessage: "Du har använt 71% av din budget. Överväg att köpa extra credits.",
                                }} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Krediter — checkout</h3>
                                <span className="text-xs text-muted-foreground">Visas efter att användaren valt ett paket</span>
                            </div>
                            <div className="max-w-lg">
                                <BuyCreditsCheckout selectedPackage={{ tokens: 2000000, price: 149, label: "2M tokens" }} tokens={2000000} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Compact data rows */}
                <div className="border-t pt-12">
                    <h2 className="text-xl font-bold tracking-tight mb-1">Kompakta datarader</h2>
                    <p className="text-sm text-muted-foreground mb-8">
                        Klickbara rader som visar en entitet — faktura, transaktion, lön m.fl.
                    </p>

                    <div className="space-y-6">
                        {([
                            { label: "Faktura",      description: "Kompakt rad — klickbar",                  card: { cardType: "invoice"      as InfoCardType, data: { id: "inv-1", invoiceNumber: "2026-042", customer: "Acme AB", amount: 37500, status: "sent" } } },
                            { label: "Transaktion",  description: "Kompakt rad — bokförd/obokförd status",   card: { cardType: "transaction"  as InfoCardType, data: { id: "tx-1", description: "Webbhotell mars", amount: 1499, date: "2026-03-01", status: "Bokförd" } } },
                            { label: "Verifikation", description: "Kompakt rad — verifikationsnummer",       card: { cardType: "verification" as InfoCardType, data: { id: "ver-1", verificationNumber: "A47", date: "2026-03-28", description: "Kontorsmaterial", amount: 2499 } } },
                            { label: "Lönebesked",   description: "Kompakt rad — anställd + nettobelopp",    card: { cardType: "payroll"      as InfoCardType, data: { id: "pay-1", employeeName: "Anna Lindberg", period: "Mars 2026", netAmount: 28392, status: "paid" } } },
                            { label: "Rapport",      description: "Kompakt rad — navigerar till rapportsidan", card: { cardType: "report"     as InfoCardType, data: { reportType: "Resultaträkning", period: "Jan-Mar 2026", title: "Resultaträkning Q1" } } },
                            { label: "Kvitto",       description: "Kompakt rad — leverantör + belopp",       card: { cardType: "receipt"     as InfoCardType, data: { id: "rec-1", supplier: "Kjell & Company", amount: 2499, date: "2026-03-28" } } },
                            { label: "Moms",         description: "Kompakt rad — period + att betala",       card: { cardType: "vat"         as InfoCardType, data: { period: "Mars 2026", amount: -3200, status: "Utkast" } } },
                            { label: "Utdelning",    description: "Kompakt rad — planerad utdelning",        card: { cardType: "dividend"    as InfoCardType, data: { name: "Erik Svensson", amount: 150000, year: 2025 } } },
                            { label: "Inventarie",   description: "Kompakt rad — anläggningstillgång",       card: { cardType: "asset"       as InfoCardType, data: { id: "ast-1", name: "MacBook Pro 16\"", acquisitionValue: 32000, bookValue: 24000, depreciationPerMonth: 889 } } },
                            { label: "Förmån",       description: "Kompakt rad — friskvård",                 card: { cardType: "benefit"     as InfoCardType, data: { id: "ben-1", employeeName: "Anna Lindberg", benefitType: "Friskvårdsbidrag", amount: 5000, amountUnit: "år", taxable: false } } },
                            { label: "Delägare",     description: "Kompakt rad — HB/KB-partner",             card: { cardType: "partner"     as InfoCardType, data: { id: "ptr-1", name: "Erik Svensson", sharePercent: 60, equity: 195000, withdrawals: 110000 } } },
                        ] as const).map((item, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-sm font-semibold">{item.label}</h3>
                                    <span className="text-xs text-muted-foreground">{item.description}</span>
                                </div>
                                <div className="max-w-lg">
                                    <InfoCardRenderer card={item.card} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>            </div>
        </div>
    )
}
