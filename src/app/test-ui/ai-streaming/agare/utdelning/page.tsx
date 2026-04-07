"use client"

/**
 * AI Streaming: Agare -> Utdelning (AB only)
 *
 * Complete conversations with simulated streaming:
 * 1. READ: "Hur mycket kan jag ta ut i utdelning?" -> K10 reference + calculation
 * 2. WRITE: "Betala ut utdelning" -> confirmation with tax breakdown + booking
 */

import Link from "next/link"
import { Banknote, ChevronRight, PieChart } from "lucide-react"
import { SimulatedConversation, Scenario, ScenarioPage, type SimScript } from "../../_shared/simulation"
import { ConfirmationCard } from "@/components/ai/confirmations/confirmation-card"
import { CardRenderer } from "@/components/ai/card-renderer"

// --- Local component: walkthrough opener for K10 ---

function WalkthroughOpenerCard({ title, subtitle }: { title: string; subtitle: string }) {
    return (
        <Link
            href="/test-ui/walkthroughs/k10"
            className="w-full max-w-md flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted/50 transition-colors group border border-border/60"
        >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0 bg-purple-500/10">
                <PieChart className="h-4 w-4 text-purple-600 dark:text-purple-500" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground shrink-0 transition-colors" />
        </Link>
    )
}

// --- Scenario 1: Read -> K10 calculation ---

const beraknaUtdelning: SimScript = [
    { role: "user", content: "Hur mycket kan jag ta ut i utdelning?" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 1000 },
            { type: "tool", name: "search_tools", duration: 500 },
            { type: "tool", name: "calculate_tax", duration: 2200 },
            { type: "tool", name: "get_income_statement", duration: 1400 },
            {
                type: "stream",
                text: `Baserat pa din K10-berakning for 2025 och bolagets finansiella stallning:`,
                speed: 12,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <div className="max-w-lg">
                        <CardRenderer display={{
                            type: "summary",
                            data: {
                                title: "Utdelningsberakning 2025",
                                items: [
                                    { label: "K10-gransbelopp", value: 187550 },
                                    { label: "Redan uttagen utdelning", value: 0 },
                                    { label: "Tillgangligt utrymme", value: 187550, highlight: true },
                                    { label: "Skatt vid max (20%)", value: 37510 },
                                    { label: "Netto vid max", value: 150040 },
                                ],
                            },
                        }} />
                    </div>
                ),
            },
            {
                type: "stream",
                text: `Du kan ta ut upp till **187 550 kr** med 20% kapitalskatt. Allt over beskattas som **tjanstenkomst** (~50% marginalskatt).

### Scenariojamforelse:

| Utdelning | Skatt | Netto | Typ |
|---|---|---|---|
| 100 000 kr | 20 000 kr | 80 000 kr | 100% kapital |
| 150 000 kr | 30 000 kr | 120 000 kr | 100% kapital |
| 187 550 kr | 37 510 kr | 150 040 kr | 100% kapital |
| 250 000 kr | 68 735 kr | 181 265 kr | Blandad |

Jag rekommenderar **187 550 kr** — det maximerar kapitalinkomst. Vill du registrera ett beslut?`,
                speed: 11,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <WalkthroughOpenerCard
                        title="K10-berakning 2025"
                        subtitle="Gransbelopp 187 550 kr - Utdelningsutrymme 187 550 kr"
                    />
                ),
            },
        ],
    },
    { role: "user", content: "Ja, registrera beslut pa 187 550 kr", delay: 2500 },
    {
        role: "scooby",
        elements: [
            { type: "tool", name: "register_dividend_decision", duration: 1600 },
            { type: "tool", name: "book_transaction", duration: 1200 },
            {
                type: "stream",
                text: `Utdelningsbeslut registrerat! **187 550 kr** beslutad utdelning. Bokfort pa konto 2091 (Balanserad vinst) till 2898 (Outtagen utdelning). Verifikation **A-55** skapad.

Sag till nar du vill gora sjalva utbetalningen — da hanterar jag skatteavdraget ocksa.`,
                speed: 11,
            },
        ],
    },
]

// --- Scenario 2: Write -> pay dividend ---

const betalaUtdelning: SimScript = [
    { role: "user", content: "Betala ut utdelning pa 150 000 kr" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 800 },
            { type: "tool", name: "search_tools", duration: 500 },
            { type: "tool", name: "calculate_tax", duration: 1800 },
            {
                type: "stream",
                text: `Utdelningen ar **150 000 kr** — helt inom K10-gransbeloppet. Skatt dras automatiskt (30% for utbetalaren, men den anstallde betalar 20% vid deklaration).

Jag bokfor utbetalningen och hanterar skatteavdraget.`,
                speed: 12,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <ConfirmationCard
                        confirmation={{
                            title: "Betala ut utdelning",
                            description: "150 000 kr till Anders Richnau",
                            summary: [
                                { label: "Mottagare", value: "Anders Richnau (80%)" },
                                { label: "Bruttobelopp", value: "150 000 kr" },
                                { label: "Preliminarskatt (30%)", value: "-45 000 kr" },
                                { label: "Utbetalning", value: "105 000 kr" },
                                { label: "Konto debet", value: "2898 Outtagen utdelning" },
                                { label: "Konto kredit", value: "1930 Foretagskonto" },
                            ],
                            action: { toolName: "pay_dividend", params: {} },
                        }}
                        confirmLabel="Betala ut"
                        icon={Banknote}
                        accent="green"
                        isDone
                        onConfirm={() => {}}
                        onCancel={() => {}}
                    />
                ),
            },
        ],
    },
    { role: "user", content: "Betala ut", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "tool", name: "pay_dividend", duration: 2000 },
            { type: "tool", name: "book_transaction", duration: 1400 },
            {
                type: "stream",
                text: `Utdelning utbetald! **105 000 kr** till Anders Richnau. Verifikation **A-54** skapad.

Preliminarskatt pa 45 000 kr bokford pa konto 2710 (Personalskatt). Den slutliga skatten ar 20% = 30 000 kr — mellanskillnaden (15 000 kr) aterfas vid deklaration.`,
                speed: 11,
            },
        ],
    },
]

// --- Page ---

export default function UtdelningStreamingPage() {
    return (
        <ScenarioPage
            title="Utdelning"
            subtitle="Hur Scooby beraknar och betalar ut utdelning med K10-koppling."
            backHref="/test-ui/ai-streaming/agare"
            backLabel="Agare"
        >
            <Scenario title="Berakna maximal utdelning" description="Las-scenario -> K10-gransbelopp + skatteoptimering" badges={["AB"]}>
                <SimulatedConversation script={beraknaUtdelning} />
            </Scenario>

            <Scenario title="Betala ut utdelning" description="Skriv-scenario -> utbetalning med bokforing + skatteavdrag" badges={["AB"]}>
                <SimulatedConversation script={betalaUtdelning} autoPlayDelay={2000} />
            </Scenario>
        </ScenarioPage>
    )
}
