"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Block } from "@/components/ai/cards/rows/block"
import { AuditCard } from "@/components/ai/cards/information-cards/audit-card"
import { BuyCreditsCheckout } from "@/components/ai/cards/BuyCreditsCard"
import { AIUsageCard } from "@/components/ai/cards/AIUsageCard"

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

                {/* Block / DataRow */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight mb-1">Block / DataRow</h1>
                    <p className="text-sm text-muted-foreground mb-8">
                        Universellt inline-format — en rad per entitet. Scooby returnerar ett Block med varje tool result.
                    </p>

                    <div className="space-y-8">
                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Transaktioner</h3>
                                <span className="text-xs text-muted-foreground">Bokförda / obokförda</span>
                            </div>
                            <div className="max-w-lg">
                                <Block block={{
                                    title: "Transaktioner",
                                    description: "5 transaktioner · 2 obokförda",
                                    rows: [
                                        { icon: "transaction", title: "Kontorshyra april",             amount: 8500, timestamp: "2026-04-01", status: "Bokförd" },
                                        { icon: "transaction", title: "Svea Hosting — webbhotell",     amount: 1499, timestamp: "2026-03-28", status: "Bokförd" },
                                        { icon: "transaction", title: "Kjell & Company",               amount: 2499, timestamp: "2026-03-25", status: "Obokförd" },
                                        { icon: "transaction", title: "Postnord — Porto",              amount: 89,   timestamp: "2026-03-22", status: "Bokförd" },
                                        { icon: "transaction", title: "Clas Ohlson — kontorsmaterial", amount: 349,  timestamp: "2026-03-20", status: "Obokförd" },
                                    ],
                                }} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Fakturor</h3>
                                <span className="text-xs text-muted-foreground">Skickad / förfallen</span>
                            </div>
                            <div className="max-w-lg">
                                <Block block={{
                                    title: "Fakturor",
                                    description: "3 obetalda · totalt 87 500 kr",
                                    rows: [
                                        { icon: "invoice", title: "Acme AB",       description: "#2026-042", amount: 37500, status: "Skickad" },
                                        { icon: "invoice", title: "TechCorp AB",   description: "#2026-041", amount: 25000, status: "Förfallen" },
                                        { icon: "invoice", title: "Nordic Design", description: "#2026-040", amount: 25000, status: "Skickad" },
                                    ],
                                }} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Verifikationer</h3>
                                <span className="text-xs text-muted-foreground">Nyligen skapade</span>
                            </div>
                            <div className="max-w-lg">
                                <Block block={{
                                    title: "Verifikationer",
                                    description: "2 skapade denna vecka",
                                    rows: [
                                        { icon: "verification", title: "Kjell & Company kontorsmaterial", description: "A-49", amount: 2499, timestamp: "2026-03-25" },
                                        { icon: "verification", title: "Clas Ohlson kontorsmaterial",     description: "A-50", amount: 349,  timestamp: "2026-03-20" },
                                    ],
                                }} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Lönebesked</h3>
                                <span className="text-xs text-muted-foreground">Anställda + nettolön</span>
                            </div>
                            <div className="max-w-lg">
                                <Block block={{
                                    title: "Lönekörning april 2026",
                                    rows: [
                                        { icon: "payslip", title: "Anna Lindberg", amount: 28392, status: "Betald", timestamp: "25 apr" },
                                        { icon: "payslip", title: "Johan Berg",    amount: 31250, status: "Betald", timestamp: "25 apr" },
                                        { icon: "payslip", title: "Sara Ek",       amount: 25108, status: "Betald", timestamp: "25 apr" },
                                    ],
                                }} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Beräkningsrader (highlight)</h3>
                                <span className="text-xs text-muted-foreground">Nettolön och summor markerade</span>
                            </div>
                            <div className="max-w-lg">
                                <Block block={{
                                    title: "Löneberäkning — Anna Lindberg, april 2026",
                                    rows: [
                                        { icon: "payslip", title: "Grundlön",                  amount: 42000 },
                                        { icon: "payslip", title: "Kommunalskatt (32.41%)",     amount: -13612 },
                                        { icon: "payslip", title: "Nettolön",                   amount: 28388, highlight: true },
                                        { icon: "payslip", title: "Friskvårdsbidrag",           amount: 5000 },
                                        { icon: "payslip", title: "Arbetsgivaravgift (31.42%)", amount: 13196 },
                                    ],
                                }} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Aktieägare / Delägare</h3>
                                <span className="text-xs text-muted-foreground">Andel som status</span>
                            </div>
                            <div className="max-w-lg">
                                <Block block={{
                                    title: "Aktiebok — Scope Consulting AB",
                                    rows: [
                                        { icon: "shareholder", title: "Anders Richnau",    status: "80%", detail: "800 A-aktier", timestamp: "8 000 röster" },
                                        { icon: "shareholder", title: "Invest Partner AB", status: "20%", detail: "200 B-aktier", timestamp: "200 röster" },
                                    ],
                                }} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Team</h3>
                                <span className="text-xs text-muted-foreground">Anställda med status</span>
                            </div>
                            <div className="max-w-lg">
                                <Block block={{
                                    title: "Teamet",
                                    description: "4 anställda",
                                    rows: [
                                        { icon: "employee", title: "Anna Lindberg", description: "Sedan jan 2024", amount: 28392, status: "Betald" },
                                        { icon: "employee", title: "Johan Berg",    description: "Sedan mar 2024", amount: 31250, status: "Betald" },
                                        { icon: "employee", title: "Sara Ek",       description: "Sedan aug 2025", amount: 25108, status: "Betald" },
                                        { icon: "employee", title: "Lisa Nilsson",  description: "Sedan apr 2026", amount: 26427, status: "Granskning" },
                                    ],
                                }} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Inventarier</h3>
                                <span className="text-xs text-muted-foreground">Anläggningstillgångar</span>
                            </div>
                            <div className="max-w-lg">
                                <Block block={{
                                    title: "Inventarier",
                                    description: "3 st · bokfört värde 142 500 kr",
                                    rows: [
                                        { icon: "asset", title: "MacBook Pro 16\"",   description: "889 kr/mån · 36 mån kvar",  amount: 24000 },
                                        { icon: "asset", title: "Kontorsmöbler",      description: "625 kr/mån · 60 mån kvar",  amount: 37500 },
                                        { icon: "asset", title: "Projektorbild",      description: "500 kr/mån · 24 mån kvar",  amount: 12000 },
                                    ],
                                }} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Kommande möten</h3>
                                <span className="text-xs text-muted-foreground">Schemalagda med status</span>
                            </div>
                            <div className="max-w-lg">
                                <Block block={{
                                    title: "Möten",
                                    description: "2 kommande · 1 signering väntar",
                                    rows: [
                                        { icon: "report", title: "Styrelsemöte",         description: "Anta årsredovisning 2025 · 28 apr", status: "Signering" },
                                        { icon: "report", title: "Ordinarie bolagsstämma", description: "Räkenskapsår 2025 · 2 maj",        status: "Planerad" },
                                    ],
                                }} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Möteshistorik</h3>
                                <span className="text-xs text-muted-foreground">Genomförda möten med protokollstatus</span>
                            </div>
                            <div className="max-w-lg">
                                <Block block={{
                                    title: "Möteshistorik",
                                    description: "3 möten 2025",
                                    rows: [
                                        { icon: "report", title: "Ordinarie bolagsstämma 2025", description: "Räkenskapsår 2024 · 15 maj 2025", status: "Godkänd" },
                                        { icon: "report", title: "Extra bolagsstämma",           description: "Ny firmatecknare · 3 sep 2025",  status: "Godkänd" },
                                        { icon: "report", title: "Styrelsemöte",                 description: "Budgetgenomgång Q3 · 12 okt 2025", status: "Godkänd" },
                                    ],
                                }} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Förmåner — aktiva</h3>
                                <span className="text-xs text-muted-foreground">Skattefria och skattepliktiga</span>
                            </div>
                            <div className="max-w-lg">
                                <Block block={{
                                    title: "Förmåner",
                                    description: "3 registrerade",
                                    rows: [
                                        { icon: "benefit", title: "Anna Lindberg", description: "Friskvårdsbidrag · Skattefritt", amount: 5000,  status: "OK" },
                                        { icon: "benefit", title: "Johan Berg",    description: "Friskvårdsbidrag · Skattefritt", amount: 5000,  status: "OK" },
                                        { icon: "benefit", title: "Johan Berg",    description: "Tjänstebil Volvo XC40",          amount: 4200,  status: "Förmånsvärde" },
                                    ],
                                }} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Förmåner — kvarvarande budget</h3>
                                <span className="text-xs text-muted-foreground">Outnyttjat friskvårdsbidrag per anställd</span>
                            </div>
                            <div className="max-w-lg">
                                <Block block={{
                                    title: "Friskvårdsbudget 2026",
                                    description: "Limit 5 000 kr/person · 3 anställda",
                                    rows: [
                                        { icon: "benefit", title: "Anna Lindberg", description: "Nyttjat 1 800 kr", amount: 3200, status: "Kvar" },
                                        { icon: "benefit", title: "Johan Berg",    description: "Nyttjat 5 000 kr", amount: 0,    status: "Fullt" },
                                        { icon: "benefit", title: "Sara Ek",       description: "Nyttjat 0 kr",     amount: 5000, status: "Kvar" },
                                    ],
                                }} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Förmåner — skatteeffekt</h3>
                                <span className="text-xs text-muted-foreground">Förmånsvärde och kostnadseffekt per anställd</span>
                            </div>
                            <div className="max-w-lg">
                                <Block block={{
                                    title: "Skatteeffekt förmåner — Johan Berg",
                                    rows: [
                                        { icon: "benefit", title: "Bruttolön",           amount: 45000, highlight: false },
                                        { icon: "benefit", title: "Förmånsvärde tjänstebil", amount: 4200, highlight: false },
                                        { icon: "benefit", title: "Beskattningsbar lön", amount: 49200, highlight: true },
                                        { icon: "benefit", title: "Arbetsgivaravgift (31.42%)", amount: 15457, highlight: false },
                                    ],
                                }} />
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
            </div>
        </div>
    )
}
