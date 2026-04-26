"use client"

/**
 * AI Streaming: Rapporter → Rapporter & Deklarationer
 *
 * Complete conversations with simulated streaming:
 * 1. READ: "Generera resultaträkning" — tool calls + summary + walkthrough opener
 * 2. READ: "Kör balanskontroll" — audit card inline
 * 3. WRITE: "Förbered momsdeklaration" — tool calls + walkthrough opener + confirmation to submit
 * 4. READ: "Generera K10" — tool calls + walkthrough opener (AB only)
 */

import { useState } from "react"
import { TrendingUp, Scale, Receipt, PieChart, Send } from "lucide-react"
import { SimulatedConversation, Scenario, ScenarioPage, type SimScript } from "../../_shared/simulation"
import { ActionConfirmCard } from "@/components/ai/cards/action-cards/action-confirm-card"
import { AuditCard } from "@/components/ai/cards/information-cards/audit-card"
import { WalkthroughOpenerCard } from "@/components/ai/cards/link-cards/walkthrough-opener-card"
import { WalkthroughOverlay, type WalkthroughType } from "@/components/ai/overlays/walkthroughs/walkthrough-overlay"

// ─── Script builders ─────────────────────────────────────────────────────────

function buildResultatrakningScript(onOpen: (type: WalkthroughType) => void): SimScript {
    return [
        { role: "user", content: "Generera resultaträkning för Q1" },
        {
            role: "scooby",
            elements: [
                { type: "thinking", duration: 900 },
                { type: "tool", name: "get_income_statement", duration: 1400, resultLabel: "Hämtade resultaträkning" },
                { type: "tool", name: "generate_report", duration: 2200, resultLabel: "Rapporten klar" },
                {
                    type: "stream",
                    text: `Resultaträkning **Q1 2026** (jan–mar):

- Nettoomsättning: **485 000 kr**
- Övriga rörelseintäkter: **12 000 kr**
- Rörelsens kostnader: −312 000 kr
- Personalkostnader: −220 500 kr
- Avskrivningar: −6 249 kr
- **Rörelseresultat: 173 000 kr**`,
                    speed: 11,
                },
                {
                    type: "card",
                    delay: 300,
                    content: (
                        <WalkthroughOpenerCard
                            title="Resultaträkning Q1 2026"
                            subtitle="Intäkter 485 000 kr · Kostnader 312 000 kr · Resultat 173 000 kr"
                            icon={TrendingUp}
                            iconBg="bg-emerald-500/10"
                            iconColor="text-emerald-600 dark:text-emerald-500"
                            onOpen={() => onOpen("resultatrakning")}
                        />
                    ),
                },
            ],
        },
    ]
}

function buildBalanskontrollScript(onOpen: (type: WalkthroughType) => void): SimScript {
    return [
        { role: "user", content: "Kör en balanskontroll" },
        {
            role: "scooby",
            elements: [
                { type: "thinking", duration: 800 },
                { type: "tool", name: "get_balance_sheet", duration: 1500, resultLabel: "Hämtade balansräkning" },
                { type: "tool", name: "get_verifications", duration: 1200, resultLabel: "Kontrollerade 51 verifikationer" },
                {
                    type: "stream",
                    text: `**4 av 5** kontroller godkända — en varning.`,
                    speed: 12,
                },
                {
                    type: "card",
                    delay: 200,
                    content: (
                        <div className="max-w-lg">
                            <AuditCard
                                audit={{
                                    date: "2026-04-06",
                                    checks: [
                                        { name: "Debet = Kredit", status: "pass", description: "Alla verifikationer balanserar", details: "51 verifikationer kontrollerade" },
                                        { name: "Bank stämmer", status: "pass", description: "Konto 1930 matchar kontoutdrag" },
                                        { name: "Momsavstämning", status: "warning", description: "Ingående moms avviker med 340 kr", details: "Konto 2641 visar 23 340 kr, beräknad moms 23 000 kr" },
                                        { name: "Periodiseringar", status: "pass", description: "Inga ouppmärkta periodiseringar" },
                                        { name: "Verifikationsnumrering", status: "pass", description: "Sekventiell numrering A1-A51 utan luckor" },
                                    ],
                                    summary: { total: 5, passed: 4, warnings: 1, failed: 0 },
                                }}
                            />
                        </div>
                    ),
                },
                {
                    type: "stream",
                    text: `Momsavstämning — differens **340 kr**.\nKan vara avrundning eller missbokad post. Ska jag utreda?`,
                    speed: 12,
                },
                {
                    type: "card",
                    delay: 250,
                    content: (
                        <WalkthroughOpenerCard
                            title="Balansräkning 2026-04-06"
                            subtitle="Tillgångar 1 245 000 kr · Skulder 892 000 kr · EK 353 000 kr"
                            icon={Scale}
                            iconBg="bg-blue-500/10"
                            iconColor="text-blue-600 dark:text-blue-500"
                            onOpen={() => onOpen("balansrakning")}
                        />
                    ),
                },
            ],
        },
        { role: "user", content: "Ja, kolla vad differensen beror på", delay: 2000 },
        {
            role: "scooby",
            elements: [
                { type: "tool", name: "get_verifications", duration: 1400, resultLabel: "Sökte i verifikationer" },
                { type: "tool", name: "search_account_entries", duration: 1100, resultLabel: "Hittade felpost" },
                {
                    type: "stream",
                    text: `Hittade orsaken — **A-37** (14 mars).\n\n- Momsrad: **340 kr**\n- Bokförd på: 2645 (fel)\n- Ska vara: 2641\n\nKan ombokas med kreditering + ny verifikation. Vill du det?`,
                    speed: 11,
                },
            ],
        },
        { role: "user", content: "Ja, fixa det", delay: 1800 },
        {
            role: "scooby",
            elements: [
                { type: "tool", name: "create_verification", duration: 1800, resultLabel: "Skapade A-52" },
                {
                    type: "stream",
                    text: `Klart!\n- **A-52** skapad — 340 kr: 2645 → 2641\n- Momsavstämningen ska nu stämma`,
                    speed: 12,
                },
            ],
        },
    ]
}

function buildMomsdeklarationScript(onOpen: (type: WalkthroughType) => void): SimScript {
    return [
        { role: "user", content: "Förbered momsdeklaration för Q1" },
        {
            role: "scooby",
            elements: [
                { type: "thinking", duration: 1000 },
                { type: "tool", name: "calculate_vat", duration: 1800, resultLabel: "Beräknade moms" },
                { type: "tool", name: "get_vat_report", duration: 2200, resultLabel: "Momsdeklaration förberedd" },
                {
                    type: "stream",
                    text: `Momsdeklaration för **Q1 2026** förberedd:

- Utgående moms 25%: **24 500 kr**
- Utgående moms 12%: **3 600 kr**
- Ingående moms: −12 050 kr
- **Moms att betala: 16 050 kr**

Klicka nedan för fullständig deklaration med alla momsrutor.`,
                    speed: 12,
                },
                {
                    type: "card",
                    delay: 300,
                    content: (
                        <WalkthroughOpenerCard
                            title="Momsdeklaration Q1 2026"
                            subtitle="Utgående 28 100 kr · Ingående 12 050 kr · Att betala 16 050 kr"
                            icon={Receipt}
                            iconBg="bg-amber-500/10"
                            iconColor="text-amber-600 dark:text-amber-500"
                            onOpen={() => onOpen("momsdeklaration")}
                        />
                    ),
                },
                {
                    type: "stream",
                    text: `Vill du skicka den till Skatteverket? Deadline är **12 maj**.`,
                    speed: 14,
                },
                {
                    type: "card",
                    delay: 300,
                    content: (
                        <ActionConfirmCard
                            title="Skicka momsdeklaration"
                            description="Q1 2026 till Skatteverket"
                            properties={[
                                { label: "Period", value: "Januari–Mars 2026" },
                                { label: "Moms att betala", value: "16 050 kr" },
                                { label: "Deadline", value: "12 maj 2026" },
                                { label: "Betalningsdag", value: "12 maj 2026" },
                            ]}
                            confirmLabel="Skicka till Skatteverket"
                            icon={Send}
                            accent="blue"
                            isDone={false}
                            onConfirm={() => {}}
                            onCancel={() => {}}
                        />
                    ),
                },
            ],
        },
        { role: "user", content: "Skicka den", delay: 2500 },
        {
            role: "scooby",
            elements: [
                { type: "tool", name: "submit_vat_declaration", duration: 2500, resultLabel: "Skickad till Skatteverket" },
                {
                    type: "stream",
                    text: `Inskickad!\n\n- Ref: **SKV-2026-04-Q1-4871**\n- Belopp: **16 050 kr** — betala senast 12 maj\n- Påminnelse inlagd 5 dagar innan`,
                    speed: 11,
                },
            ],
        },
    ]
}

function buildK10Script(onOpen: (type: WalkthroughType) => void): SimScript {
    return [
        { role: "user", content: "Beräkna K10 för 2025" },
        {
            role: "scooby",
            elements: [
                { type: "thinking", duration: 1100 },
                { type: "tool", name: "calculate_tax", duration: 2000, resultLabel: "K10 beräknad" },
                {
                    type: "stream",
                    text: `K10 **2025** klar — gränsbelopp **187 550 kr**.\nUtdelning upp till det: **20% skatt**. Över det: ~50% som lön.\n\n- Omkostnadsbelopp: **50 000 kr**\n- Uppräkning (9%): **4 500 kr**\n- Lönebaserat utrymme: **133 050 kr**\n- **Gränsbelopp: 187 550 kr**`,
                    speed: 11,
                },
                {
                    type: "card",
                    delay: 300,
                    content: (
                        <WalkthroughOpenerCard
                            title="K10-beräkning 2025"
                            subtitle="Gränsbelopp 187 550 kr · Utdelningsutrymme 187 550 kr"
                            icon={PieChart}
                            iconBg="bg-purple-500/10"
                            iconColor="text-purple-600 dark:text-purple-500"
                            onOpen={() => onOpen("k10")}
                        />
                    ),
                },
            ],
        },
    ]
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RapporterStreamingPage() {
    const [openWalkthrough, setOpenWalkthrough] = useState<WalkthroughType | null>(null)

    const resultatrakningScript = buildResultatrakningScript(setOpenWalkthrough)
    const balanskontrollScript = buildBalanskontrollScript(setOpenWalkthrough)
    const momsdeklarationScript = buildMomsdeklarationScript(setOpenWalkthrough)
    const k10Script = buildK10Script(setOpenWalkthrough)

    return (
        <ScenarioPage
            title="Rapporter & Deklarationer"
            subtitle="Hur Scooby genererar rapporter — tool calls, summakort, klickbar walkthrough."
            backHref="/test-ui/streaming/rapporter"
            backLabel="Rapporter"
        >
            <Scenario title="Generera resultaträkning" description="Läs-scenario — rapport med summakort + walkthrough" badges={["Alla"]}>
                <SimulatedConversation script={resultatrakningScript} />
            </Scenario>

            <Scenario title="Kör balanskontroll" description="Läs-scenario — rimlighetskontroll med audit-kort" badges={["Alla"]}>
                <SimulatedConversation script={balanskontrollScript} />
            </Scenario>

            <Scenario title="Förbered momsdeklaration" description="Skriv-scenario — rapport + walkthrough + bekräftelse att skicka" badges={["Alla"]}>
                <SimulatedConversation script={momsdeklarationScript} />
            </Scenario>

            <Scenario title="Generera K10" description="Läs-scenario — kvalificerad utdelning + walkthrough" badges={["AB"]}>
                <SimulatedConversation script={k10Script} />
            </Scenario>

            <WalkthroughOverlay type={openWalkthrough} onClose={() => setOpenWalkthrough(null)} />
        </ScenarioPage>
    )
}
