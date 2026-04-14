"use client"

import Link from "next/link"
import { Calculator, ChevronRight } from "lucide-react"
import { SimulatedConversation, Scenario, ScenarioPage, type SimScript } from "../../_shared/simulation"
import { CardRenderer } from "@/components/ai/card-renderer"

function WalkthroughOpenerCard({ title, subtitle }: { title: string; subtitle: string }) {
    return (
        <Link
            href="/test-ui/walkthroughs/egenavgifter"
            className="w-full max-w-md flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted/50 transition-colors group border border-border/60"
        >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0 bg-amber-500/10">
                <Calculator className="h-4 w-4 text-amber-600 dark:text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground shrink-0 transition-colors" />
        </Link>
    )
}

const visaEgenavgifter: SimScript = [
    { role: "user", content: "Visa mina egenavgifter" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 800 },
            { type: "tool", name: "search_tools", duration: 500, resultLabel: "Sökte bland verktyg" },
            { type: "tool", name: "get_income_statement", duration: 1200, resultLabel: "Hämtade resultat" },
            { type: "tool", name: "calculate_tax", duration: 1800, resultLabel: "Egenavgifter beräknade" },
            {
                type: "stream",
                text: `**Preliminär beräkning** baserat på årets resultat:`,
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
                                title: "Egenavgifter 2026 (preliminärt)",
                                items: [
                                    { label: "Årsresultat (prognos)", value: 485000 },
                                    { label: "Sjukpenninggrundande ink.", value: 485000 },
                                    { label: "Egenavgifter (31.42%)", value: 152363, highlight: true },
                                    { label: "Resultat efter avgifter", value: 332637 },
                                ],
                            },
                        }} />
                    </div>
                ),
            },
            {
                type: "stream",
                text: `Klicka på kortet nedan för att se den fullständiga uppdelningen med alla delposter.`,
                speed: 13,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <WalkthroughOpenerCard
                        title="Egenavgifter 2026"
                        subtitle="Årsresultat 485 000 kr · Avgifter 152 363 kr · Sats 31.42%"
                    />
                ),
            },
        ],
    },
    { role: "user", content: "Kan jag sänka egenavgifterna på något sätt?", delay: 2500 },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 600 },
            {
                type: "stream",
                text: `De flesta egenavgifter är fasta, men det finns några sätt att påverka:

- **Sjukpenninggrundande inkomst** — om du sänker ditt resultat genom avdragsgilla kostnader minskar underlaget
- **Nedsättning under 26 år** — reducerade satser om du är under 26
- **Nedsättning över 65 år** — reducerad ålderspensionsavgift
- **Schablonavdrag** — om du driver verksamhet från hemmet kan du ta schablonavdrag

I ditt fall är den mest effektiva strategin att **maximera avdragsgilla kostnader** som pensionsavsättning och inventarieinköp. Det sänker resultatet och därmed egenavgifterna.`,
                speed: 10,
            },
        ],
    },
]

const beraknaEgenavgifter: SimScript = [
    { role: "user", content: "Beräkna mina egenavgifter för 2026 baserat på nuvarande resultat" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 900 },
            { type: "tool", name: "get_income_statement", duration: 1400, resultLabel: "Hämtade resultat" },
            { type: "tool", name: "calculate_tax", duration: 2200, resultLabel: "Egenavgifter beräknade" },
            { type: "tool", name: "get_knowledge", duration: 600, resultLabel: "Läste avgiftsregler" },
            {
                type: "stream",
                text: `Egenavgifter baserat på resultat **485 000 kr** 2026.

**Uppdelning:**

- Sjukförsäkring: **3.64%** — 17 654 kr
- Ålderspensionsavgift: **10.21%** — 49 519 kr
- Efterlevandepensionsavgift: **0.60%** — 2 910 kr
- Arbetsmarknadsavgift: **2.64%** — 12 804 kr
- Arbetsskadeavgift: **0.20%** — 970 kr
- Allmän löneavgift: **11.62%** — 56 367 kr
- **Totalt: 28.97% — 140 224 kr**

> 💡 *Nedsättning:* Om du är under 26 eller över 65 gäller reducerade satser. Din fulla sats är **31.42%** inklusive alla tillägg.

Ska jag lägga av preliminärskatt baserat på detta, eller vill du justera resultatet?`,
                speed: 10,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <WalkthroughOpenerCard
                        title="Egenavgifter 2026 — fullständig beräkning"
                        subtitle="7 delposter · Total sats 31.42% · 152 363 kr"
                    />
                ),
            },
        ],
    },
]

export default function EgenavgifterStreamingPage() {
    return (
        <ScenarioPage
            title="Egenavgifter"
            subtitle="Hur Scooby beräknar och visar egenavgifter för enskild firma."
            backHref="/test-ui/ai-streaming/loner"
            backLabel="Löner"
        >
            <Scenario title="Visa egenavgifter" description="Läs-scenario — aktuell beräkning med summakort" badges={["EF"]}>
                <SimulatedConversation script={visaEgenavgifter} />
            </Scenario>

            <Scenario title="Beräkna egenavgifter" description="Skriv-scenario — detaljerad beräkning med delpostförklaring" badges={["EF"]}>
                <SimulatedConversation script={beraknaEgenavgifter} />
            </Scenario>
        </ScenarioPage>
    )
}
