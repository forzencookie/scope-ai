"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ChevronRight, FileText, type LucideIcon, TrendingUp, Scale, Receipt, PieChart, Calculator, BookOpen, Send, FileBarChart } from "lucide-react"
import { CardRenderer } from "@/components/ai/card-renderer"
import { InlineCardRenderer, type InlineCardType } from "@/components/ai/cards/inline"
import { BalanceAuditCard } from "@/components/ai/cards/BalanceAuditCard"
import { ResultatAuditCard } from "@/components/ai/cards/ResultatAuditCard"
import { ActivityCard } from "@/components/ai/cards/ActivityCard"
import { BuyCreditsCheckout } from "@/components/ai/cards/BuyCreditsCard"
import { cn } from "@/lib/utils"

/**
 * Test page: All Layer 1 card types
 *
 * Shows every card type that Scooby can render inline in chat.
 * These are compact preview cards — the first thing a user sees
 * after Scooby executes a tool.
 *
 * Split into sections:
 * 1. Walkthrough opener cards — clickable, opens full walkthrough overlay
 * 2. Data display cards — activity feed, status checklist, summary, lists
 * 3. Audit cards — balanskontroll, resultatkontroll
 * 4. Billing cards — usage, credits
 * 5. Inline cards — compact clickable result rows
 *
 * NOT here (handled by ConfirmationCard isDone state):
 * - TransactionCard, InvoiceCard, ReceiptCard, ActivityCard (after-action display)
 *   These are replaced by the confirmation card staying visible with "Klart".
 */

// =============================================================================
// Section 1: Walkthrough opener cards
// =============================================================================

interface WalkthroughOpener {
    title: string
    subtitle: string
    icon: LucideIcon
    iconBg: string
    iconColor: string
    href: string
}

const walkthroughOpeners: WalkthroughOpener[] = [
    { title: "Resultaträkning Q1 2026", subtitle: "Intäkter 485 000 kr · Kostnader 312 000 kr · Resultat 173 000 kr", icon: TrendingUp, iconBg: "bg-emerald-500/10", iconColor: "text-emerald-600 dark:text-emerald-500", href: "/test-ui/walkthroughs/resultatrakning" },
    { title: "Balansräkning 2026-03-31", subtitle: "Tillgångar 1 245 000 kr · Skulder 892 000 kr · EK 353 000 kr", icon: Scale, iconBg: "bg-blue-500/10", iconColor: "text-blue-600 dark:text-blue-500", href: "/test-ui/walkthroughs/balansrakning" },
    { title: "Momsdeklaration mars 2026", subtitle: "Utgående 24 500 kr · Ingående 12 050 kr · Att betala 12 450 kr", icon: Receipt, iconBg: "bg-amber-500/10", iconColor: "text-amber-600 dark:text-amber-500", href: "/test-ui/walkthroughs/momsdeklaration" },
    { title: "K10-beräkning 2025", subtitle: "Gränsbelopp 187 550 kr · Utdelningsutrymme 187 550 kr", icon: PieChart, iconBg: "bg-purple-500/10", iconColor: "text-purple-600 dark:text-purple-500", href: "/test-ui/walkthroughs/k10" },
    { title: "Egenavgifter 2026", subtitle: "Årsresultat 485 000 kr · Avgifter 152 163 kr · Sats 31,42%", icon: Calculator, iconBg: "bg-amber-500/10", iconColor: "text-amber-600 dark:text-amber-500", href: "/test-ui/walkthroughs/egenavgifter" },
    { title: "AGI mars 2026", subtitle: "3 anställda · Bruttolön 125 000 kr · Arbetsgivaravgift 39 275 kr", icon: Send, iconBg: "bg-blue-500/10", iconColor: "text-blue-600 dark:text-blue-500", href: "/test-ui/walkthroughs/agi" },
    { title: "Inkomstdeklaration 2025", subtitle: "Skattepliktig inkomst 612 000 kr · Slutlig skatt 198 400 kr", icon: FileText, iconBg: "bg-red-500/10", iconColor: "text-red-600 dark:text-red-500", href: "/test-ui/walkthroughs/inkomstdeklaration" },
    { title: "Årsredovisning 2025", subtitle: "K2 · Förvaltningsberättelse + Resultat + Balans + Noter", icon: BookOpen, iconBg: "bg-indigo-500/10", iconColor: "text-indigo-600 dark:text-indigo-500", href: "/test-ui/walkthroughs/arsredovisning" },
]

function WalkthroughOpenerCard({ opener }: { opener: WalkthroughOpener }) {
    const Icon = opener.icon
    return (
        <Link
            href={opener.href}
            className="w-full max-w-md flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted/50 transition-colors group border border-border/60"
        >
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg shrink-0", opener.iconBg)}>
                <Icon className={cn("h-4 w-4", opener.iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{opener.title}</p>
                <p className="text-xs text-muted-foreground truncate">{opener.subtitle}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground shrink-0 transition-colors" />
        </Link>
    )
}

// =============================================================================
// Section 2: Data display cards (CardRenderer)
// =============================================================================

const displayCards: Array<{
    label: string
    description: string
    display: { type: string; data: Record<string, unknown>; title?: string }
}> = [
    {
        label: "Aktivitetsflöde",
        description: "Visar vad som hänt under en vald period — hämtas på fråga",
        display: {
            type: "activityfeed",
            data: {
                title: "Aktivitet igår",
                description: "4 händelser den 4 april 2026",
                events: [
                    { id: "1", action: "booked", entityType: "transaction", title: "Kontorshyra april", description: "8 500 kr → 5010 Lokalhyra. Ver A-47.", timestamp: "09:14" },
                    { id: "2", action: "created", entityType: "invoice", title: "Faktura #2026-042 till Acme AB", description: "37 500 kr inkl. moms", timestamp: "11:30" },
                    { id: "3", action: "updated", entityType: "employee", title: "Anna Lindberg", description: "Kommun ändrad: Solna → Stockholm", timestamp: "14:02" },
                    { id: "4", action: "booked", entityType: "receipt", title: "Postnord — Porto", description: "89 kr → 6250 Porto. Ver A-48.", timestamp: "16:45" },
                ],
            },
        },
    },
    {
        label: "Statusöversikt — Månadsavslut",
        description: "Samma kort som aktivitetsflöde, med statusbadges istället för action-badges",
        display: {
            type: "activityfeed",
            data: {
                title: "Månadsavslut mars 2026",
                description: "5 punkter att granska",
                events: [
                    { id: "1", action: "done", entityType: "check", title: "Alla kvitton bokförda", description: null, timestamp: null },
                    { id: "2", action: "warning", entityType: "check", title: "Momsavstämning", description: "Differens 340 kr mellan konto 2641 och beräknad moms", timestamp: null },
                    { id: "3", action: "error", entityType: "check", title: "Faktura #2026-039 ej bokförd", description: "15 000 kr. Skickad men saknar verifikation.", timestamp: null },
                    { id: "4", action: "pending", entityType: "check", title: "Periodisering försäkring", description: "9 månader kvar att periodisera av 12 000 kr", timestamp: null },
                    { id: "5", action: "done", entityType: "check", title: "Semesterskuld uppdaterad", description: null, timestamp: null },
                ],
            },
        },
    },
    {
        label: "Statusöversikt — Saknad data",
        description: "Samma kort — blockerande checklist innan lönekörning",
        display: {
            type: "activityfeed",
            data: {
                title: "Saknad information för lönekörning",
                description: "3 saker att lösa innan löner kan köras",
                events: [
                    { id: "a", action: "error", entityType: "check", title: "Anna Lindberg — kommun saknas", description: "Skattesats kan inte beräknas utan kommun", timestamp: null },
                    { id: "b", action: "error", entityType: "check", title: "Johan Berg — skattetabell ej vald", description: "Kolumn 1 eller 2?", timestamp: null },
                    { id: "c", action: "warning", entityType: "check", title: "Friskvårdsbidrag — belopp ej satt", description: "Policy finns men beloppet är tomt", timestamp: null },
                ],
            },
        },
    },
    {
        label: "Sammanfattning (Summary)",
        description: "Beräkningsresultat, t.ex. lön eller K10",
        display: {
            type: "summary",
            data: {
                title: "Löneberäkning — mars 2026",
                items: [
                    { label: "Bruttolön", value: 42000 },
                    { label: "Kommunalskatt (32.4%)", value: -13608 },
                    { label: "Nettolön", value: 28392, highlight: true },
                    { label: "Arbetsgivaravgift (31.42%)", value: 13196 },
                ],
            },
        },
    },
    {
        label: "Generisk lista",
        description: "Listar sökresultat eller entiteter kompakt",
        display: {
            type: "genericlist",
            data: {
                title: "Senaste kvitton",
                items: [
                    { primary: "Clas Ohlson", secondary: "2026-03-25", value: 349 },
                    { primary: "Postnord", secondary: "2026-03-22", value: 89 },
                    { primary: "Webhallen", secondary: "2026-03-18", value: 4999 },
                ],
            },
        },
    },
]

// =============================================================================
// Section 4: Billing cards
// =============================================================================

const billingCards: Array<{
    label: string
    description: string
    display: { type: string; data: Record<string, unknown> }
}> = [
    {
        label: "AI-användning (Usage)",
        description: "Hur mycket AI-budget som förbrukats",
        display: {
            type: "aiusagecard",
            data: {
                usage: {
                    tokensUsed: 847000,
                    tokenLimit: 1000000,
                    extraCredits: 200000,
                    totalAvailable: 1200000,
                    usagePercent: 71,
                    thresholdLevel: "high",
                    shouldShowReminder: true,
                    reminderMessage: "Du har använt 71% av din budget. Överväg att köpa extra credits.",
                },
            },
        },
    },
    {
        label: "Köp Credits",
        description: "Prompt för att köpa fler AI-tokens",
        display: {
            type: "buycreditsprompt",
            data: {
                packages: [
                    { tokens: 500000, price: 49, label: "500k tokens" },
                    { tokens: 2000000, price: 149, label: "2M tokens", popular: true, savings: "Spara 25%" },
                    { tokens: 5000000, price: 299, label: "5M tokens", savings: "Spara 40%" },
                ],
            },
        },
    },
]

// =============================================================================
// Section 5: Inline cards (compact result rows)
// =============================================================================

const inlineCards: Array<{
    label: string
    description: string
    card: { cardType: InlineCardType; data: Record<string, unknown> }
}> = [
    {
        label: "Faktura (inline)",
        description: "Kompakt rad — klickbar, navigerar till fakturasidan",
        card: {
            cardType: "invoice",
            data: { id: "inv-1", invoiceNumber: "2026-042", customer: "Acme AB", amount: 37500, status: "sent" },
        },
    },
    {
        label: "Transaktion (inline)",
        description: "Kompakt rad — visar bokförd/obokförd status",
        card: {
            cardType: "transaction",
            data: { id: "tx-1", description: "Webbhotell mars", amount: 1499, date: "2026-03-01", status: "Bokförd" },
        },
    },
    {
        label: "Verifikation (inline)",
        description: "Kompakt rad — visar verifikationsnummer",
        card: {
            cardType: "verification",
            data: { id: "ver-1", verificationNumber: "A47", date: "2026-03-28", description: "Kontorsmaterial", amount: 2499 },
        },
    },
    {
        label: "Lönebesked (inline)",
        description: "Kompakt rad — anställd + nettobelopp",
        card: {
            cardType: "payroll",
            data: { id: "pay-1", employeeName: "Anna Lindberg", period: "Mars 2026", netAmount: 28392, status: "paid" },
        },
    },
    {
        label: "Rapport (inline)",
        description: "Kompakt rad — navigerar till rapportsidan",
        card: {
            cardType: "report",
            data: { reportType: "Resultaträkning", period: "Jan-Mar 2026", title: "Resultaträkning Q1" },
        },
    },
    {
        label: "Kvitto (inline)",
        description: "Kompakt rad — leverantör + belopp",
        card: {
            cardType: "receipt",
            data: { id: "rec-1", supplier: "Kjell & Company", amount: 2499, date: "2026-03-28" },
        },
    },
    {
        label: "Moms (inline)",
        description: "Kompakt rad — period + att betala/få tillbaka",
        card: {
            cardType: "vat",
            data: { period: "Mars 2026", amount: -3200, status: "Utkast" },
        },
    },
    {
        label: "Utdelning (inline)",
        description: "Kompakt rad — planerad utdelning",
        card: {
            cardType: "dividend",
            data: { name: "Erik Svensson", amount: 150000, year: 2025 },
        },
    },
    {
        label: "Inventarie (inline)",
        description: "Kompakt rad — anläggningstillgång med bokfört värde",
        card: {
            cardType: "asset",
            data: { id: "ast-1", name: "MacBook Pro 16\"", acquisitionValue: 32000, bookValue: 24000, depreciationPerMonth: 889 },
        },
    },
    {
        label: "Förmån (inline)",
        description: "Kompakt rad — anställd + förmånstyp + skatteeffekt",
        card: {
            cardType: "benefit",
            data: { id: "ben-1", employeeName: "Anna Lindberg", benefitType: "Friskvårdsbidrag", amount: 5000, amountUnit: "år", taxable: false },
        },
    },
    {
        label: "Förmån — förmånsvärde (inline)",
        description: "Kompakt rad — tjänstebil med förmånsvärde",
        card: {
            cardType: "benefit",
            data: { id: "ben-2", employeeName: "Johan Berg", benefitType: "Tjänstebil (Volvo XC40)", amount: 4200, amountUnit: "mån", taxable: true },
        },
    },
    {
        label: "Delägare (inline)",
        description: "Kompakt rad — HB/KB-partner med ägarandel + eget kapital",
        card: {
            cardType: "partner",
            data: { id: "ptr-1", name: "Erik Svensson", sharePercent: 60, equity: 195000, withdrawals: 110000 },
        },
    },
    {
        label: "Delägare 2 (inline)",
        description: "Kompakt rad — minoritetspartner",
        card: {
            cardType: "partner",
            data: { id: "ptr-2", name: "Maria Johansson", sharePercent: 40, equity: 130000, withdrawals: 45000 },
        },
    },
]

export default function TestCardsPage() {
    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="max-w-3xl mx-auto px-6 pt-6">
                <Link
                    href="/test-ui/walkthroughs"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Walkthroughs & Overlays
                </Link>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-8 space-y-12">
                {/* Section 1: Walkthrough Openers */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight mb-1">Alla kort (Layer 1)</h1>
                    <p className="text-sm text-muted-foreground mb-8">
                        Varje kort som Scooby kan visa inline i chatten.
                        Klickbara kort öppnar walkthrough-overlay med fullständig data.
                    </p>

                    <h2 className="text-lg font-bold tracking-tight mb-1">Walkthrough-kort</h2>
                    <p className="text-sm text-muted-foreground mb-6">
                        Klickbara kort som öppnar detaljerad walkthrough.
                        Titeln sätts dynamiskt av AI baserat på innehållet — Scooby namnger kortet efter vad det visar.
                    </p>

                    <div className="space-y-2">
                        {walkthroughOpeners.map((opener, i) => (
                            <div key={i}>
                                <WalkthroughOpenerCard opener={opener} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section 2: Data Display Cards */}
                <div className="border-t pt-12">
                    <h2 className="text-xl font-bold tracking-tight mb-1">Datakort</h2>
                    <p className="text-sm text-muted-foreground mb-8">
                        Kort för tidslinjer, statusöversikter, beräkningar och listor.
                        Visas direkt i chatten efter att Scooby hämtat data.
                    </p>

                    <div className="space-y-8">
                        {displayCards.map((item, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-sm font-semibold">{item.label}</h3>
                                    <span className="text-xs text-muted-foreground">{item.description}</span>
                                </div>
                                <div className="max-w-lg">
                                    <CardRenderer display={item.display} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section 3: Audit Cards */}
                <div className="border-t pt-12">
                    <h2 className="text-xl font-bold tracking-tight mb-1">Balanskontroll & Resultatkontroll</h2>
                    <p className="text-sm text-muted-foreground mb-8">
                        Inline audit checks som Scooby visar i chatten — pass/warning/fail.
                    </p>

                    <div className="space-y-8">
                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Balanskontroll</h3>
                                <span className="text-xs text-muted-foreground">Rimlighetskontroll av balansräkningen</span>
                            </div>
                            <div className="max-w-lg">
                                <BalanceAuditCard
                                    audit={{
                                        date: "2026-03-28",
                                        checks: [
                                            { name: "Debet = Kredit", status: "pass", description: "Alla verifikationer balanserar", details: "Totalt 47 verifikationer kontrollerade" },
                                            { name: "Bank stämmer", status: "pass", description: "Konto 1930 matchar kontoutdrag" },
                                            { name: "Momsavstämning", status: "warning", description: "Ingående moms avviker med 340 kr", details: "Konto 2641 visar 23 340 kr, beräknad moms 23 000 kr" },
                                            { name: "Periodiseringar", status: "pass", description: "Inga ouppmärkta periodiseringar" },
                                            { name: "Verifikationsnumrering", status: "pass", description: "Sekventiell numrering A1-A47 utan luckor" },
                                        ],
                                        summary: { total: 5, passed: 4, warnings: 1, failed: 0 },
                                    }}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Balanskontroll — med fel</h3>
                                <span className="text-xs text-muted-foreground">Visar hur det ser ut när kontroller misslyckas</span>
                            </div>
                            <div className="max-w-lg">
                                <BalanceAuditCard
                                    audit={{
                                        date: "2026-03-28",
                                        checks: [
                                            { name: "Debet = Kredit", status: "pass", description: "Alla verifikationer balanserar" },
                                            { name: "Bank stämmer", status: "fail", description: "Konto 1930 avviker med 12 500 kr", details: "Bokfört saldo: 145 200 kr. Kontoutdrag: 157 700 kr." },
                                            { name: "Momsavstämning", status: "warning", description: "Ingående moms avviker med 340 kr" },
                                            { name: "Verifikationsnumrering", status: "fail", description: "Lucka i numreringen: A23 saknas", details: "Serien hoppar från A22 till A24. BFL kräver löpande numrering." },
                                        ],
                                        summary: { total: 4, passed: 1, warnings: 1, failed: 2 },
                                    }}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Resultatkontroll</h3>
                                <span className="text-xs text-muted-foreground">Rimlighetskontroll av resultaträkningen</span>
                            </div>
                            <div className="max-w-lg">
                                <ResultatAuditCard
                                    audit={{
                                        date: "2026-03-28",
                                        checks: [
                                            { name: "Bruttomarginal", status: "pass", description: "33.7% — inom förväntat intervall (25-45%)" },
                                            { name: "Personalkostnader", status: "pass", description: "45.5% av omsättning — rimligt för tjänsteföretag" },
                                            { name: "Övriga kostnader", status: "warning", description: "18.4% av omsättning — något högt", details: "Förväntat intervall: 10-15%. Kontrollera konto 6070 och 6210." },
                                            { name: "Rörelseresultat", status: "pass", description: "Positivt rörelseresultat: 152 000 kr" },
                                        ],
                                        summary: { total: 4, passed: 3, warnings: 1, failed: 0 },
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 4: Billing Cards */}
                <div className="border-t pt-12">
                    <h2 className="text-xl font-bold tracking-tight mb-1">Fakturering & Krediter</h2>
                    <p className="text-sm text-muted-foreground mb-8">
                        AI-användning och kreditköp.
                    </p>

                    <div className="space-y-8">
                        {billingCards.map((item, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-sm font-semibold">{item.label}</h3>
                                    <span className="text-xs text-muted-foreground">{item.description}</span>
                                </div>
                                <div className="max-w-lg">
                                    <CardRenderer display={item.display} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section 4b: Activity cards */}
                <div className="border-t pt-12">
                    <h2 className="text-xl font-bold tracking-tight mb-1">Aktivitetskort</h2>
                    <p className="text-sm text-muted-foreground mb-8">
                        Händelselogg efter en åtgärd. Visas i chatten efter att Scooby genomfört en mutation.
                    </p>

                    <div className="space-y-8">
                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Aktivitetskort — skapad</h3>
                                <span className="text-xs text-muted-foreground">Visar vad som gjordes + detaljändringar</span>
                            </div>
                            <div className="max-w-lg">
                                <ActivityCard
                                    action="created"
                                    entityType="invoice"
                                    title="Faktura #2026-043 skapad"
                                    subtitle="Acme Consulting AB"
                                    changes={[
                                        { label: "Belopp", value: "62 500 kr" },
                                        { label: "Förfallodatum", value: "2026-05-06" },
                                        { label: "Konto", value: "1510 Kundfordringar" },
                                    ]}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Aktivitetskort — bokförd</h3>
                                <span className="text-xs text-muted-foreground">Verifikation skapad efter bokföring</span>
                            </div>
                            <div className="max-w-lg">
                                <ActivityCard
                                    action="booked"
                                    entityType="receipt"
                                    title="Kontorsmaterial bokfört"
                                    subtitle="Kjell & Company — 2 499 kr"
                                    changes={[
                                        { label: "Verifikation", value: "A-47" },
                                        { label: "Konto debet", value: "6110 Kontorsmaterial" },
                                        { label: "Konto kredit", value: "1930 Företagskonto" },
                                        { label: "Moms", value: "500 kr (25%)" },
                                    ]}
                                />
                            </div>
                        </div>

                    </div>
                </div>

                {/* Section 4c: BuyCreditsCheckout */}
                <div className="border-t pt-12">
                    <h2 className="text-xl font-bold tracking-tight mb-1">Krediter — checkout</h2>
                    <p className="text-sm text-muted-foreground mb-8">
                        Visas efter att användaren valt ett paket i BuyCreditsPrompt.
                    </p>
                    <div className="max-w-lg">
                        <BuyCreditsCheckout selectedPackage={{ tokens: 2000000, price: 149, label: "2M tokens" }} tokens={2000000} />
                    </div>
                </div>

                {/* Section 5: Inline Cards */}
                <div className="border-t pt-12">
                    <h2 className="text-xl font-bold tracking-tight mb-1">Inline-kort (kompakta resultatrader)</h2>
                    <p className="text-sm text-muted-foreground mb-8">
                        Klickbara rader som alltid visas i chatten (aldrig i overlay).
                        Navigerar till relevant sida vid klick.
                    </p>

                    <div className="space-y-6">
                        {inlineCards.map((item, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-sm font-semibold">{item.label}</h3>
                                    <span className="text-xs text-muted-foreground">{item.description}</span>
                                </div>
                                <div className="max-w-lg">
                                    <InlineCardRenderer card={item.card} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    )
}
