"use client"

import { useState, type ComponentProps } from "react"
import { Landmark, FileText, Gavel } from "lucide-react"
import { SimulatedConversation, Scenario, ScenarioPage, useSimEvent, type SimScript } from "../../_shared/simulation"
import { ActionConfirmCard } from "@/components/ai/cards/action-cards/action-confirm-card"
import { Block } from "@/components/ai/cards/rows/block"
import { WalkthroughOpenerCard } from "@/components/ai/cards/link-cards/walkthrough-opener-card"
import { WalkthroughOverlay, type WalkthroughType } from "@/components/ai/overlays/walkthroughs/walkthrough-overlay"

function InteractiveActionConfirmCard(
    props: Omit<ComponentProps<typeof ActionConfirmCard>, "isDone" | "onConfirm"> & { triggerEvent?: string }
) {
    const { triggerEvent, ...rest } = props
    const [clickedDone, setClickedDone] = useState(false)
    const eventTriggered = useSimEvent(triggerEvent)
    const isDone = clickedDone || eventTriggered
    return (
        <ActionConfirmCard
            {...rest}
            isDone={isDone}
            completedAction={isDone ? rest.completedAction : undefined}
            completedTitle={isDone ? rest.completedTitle : undefined}
            onConfirm={() => setClickedDone(true)}
        />
    )
}

// ─── Scenario 1: Generate AGM protocol ───────────────────────────────────────

function buildForberedProtokollScript(onOpen: (type: WalkthroughType) => void): SimScript { return [
    { role: "user", content: "Förbered bolagsstämmoprotokoll för ordinarie stämma 2026" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 900 },
            { type: "tool", name: "get_company_info", duration: 1100, resultLabel: "Hämtade företagsuppgifter" },
            { type: "tool", name: "get_income_statement", duration: 1400, resultLabel: "Hämtade årsredovisning 2025" },
            {
                type: "stream",
                text: `Jag förbereder ett stämmoprotokoll för **ordinarie bolagsstämma 2026**. Baserat på årsredovisningen 2025 inkluderar jag standardpunkterna:

1. Val av ordförande och justerare
2. Godkännande av dagordning
3. Framläggande av årsredovisning
4. Fastställande av resultat- och balansräkning
5. Resultatdisposition
6. Ansvarsfrihet för styrelsen
7. Val av styrelse och revisor

Vill du lägga till ett **utdelningsbeslut** i punkt 5?`,
                speed: 10,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <InteractiveActionConfirmCard
                        title="Generera stämmoprotokoll"
                        description="Ordinarie bolagsstämma 2026"
                        properties={[
                            { label: "Bolag", value: "Scope Consulting AB (559123-4567)" },
                            { label: "Räkenskapsår", value: "2025" },
                            { label: "Typ", value: "Ordinarie bolagsstämma" },
                            { label: "Punkter", value: "7 st (standard)" },
                            { label: "Format", value: "PDF + digital signering" },
                        ]}
                        confirmLabel="Generera protokoll"
                        icon={FileText}
                        accent="indigo"
                        completedAction="prepared"
                        completedTitle="Stämmoprotokoll genererat"
                        onCancel={() => {}}
                        triggerEvent="sim:forbered-protokoll-confirm"
                    />
                ),
            },
        ],
    },
    { role: "user", content: "Ja, generera protokollet", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "fire-event", eventName: "sim:forbered-protokoll-confirm" },
            {
                type: "stream",
                text: `PDF klar att granska. Behöver signeras av ordförande + justerare.`,
                speed: 12,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <Block block={{ rows: [{ icon: "report", title: "Ordinarie bolagsstämma 2026", description: "Räkenskapsår 2025 · PDF genererad", status: "Signering" }] }} />
                ),
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <WalkthroughOpenerCard
                        title="Bolagsstämmoprotokoll 2026"
                        subtitle="Ordinarie stämma · PDF genererad · Signering återstår"
                        icon={FileText}
                        iconBg="bg-indigo-500/10"
                        iconColor="text-indigo-600 dark:text-indigo-500"
                        onOpen={() => onOpen("moten")}
                    />
                ),
            },
        ],
    },
]}

// ─── Scenario 2: Dividend decision ───────────────────────────────────────────

const utdelningsbeslut: SimScript = [
    { role: "user", content: "Vi vill besluta om utdelning på 150 000 kr" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 800 },
            { type: "tool", name: "calculate_tax", duration: 1800, resultLabel: "K10 beräknad" },
            {
                type: "stream",
                text: `K10-gränsbelopp: **187 550 kr** — 150 000 kr ryms, beskattas som kapital (20%).

- Beslutad utdelning: **150 000 kr**
- K10-gränsbelopp: **187 550 kr** — inom gräns ✓
- Skatt (20%): **30 000 kr**
- **Netto efter skatt: 120 000 kr**

Du har **37 550 kr kvar** av gränsbeloppet som kan sparas till nästa år.`,
                speed: 10,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <InteractiveActionConfirmCard
                        title="Registrera utdelningsbeslut"
                        description="150 000 kr — inom K10-gränsbelopp"
                        properties={[
                            { label: "Utdelning", value: "150 000 kr" },
                            { label: "Skatt", value: "30 000 kr (20% kapital)" },
                            { label: "Netto", value: "120 000 kr" },
                            { label: "Typ", value: "Stämmobeslut" },
                            { label: "Bokföring", value: "Konto 2091 → 2898" },
                        ]}
                        confirmLabel="Registrera beslut"
                        icon={Landmark}
                        accent="purple"
                        completedAction="booked"
                        completedTitle="Utdelningsbeslut registrerat"
                        onCancel={() => {}}
                        triggerEvent="sim:utdelningsbeslut-confirm"
                    />
                ),
            },
        ],
    },
    { role: "user", content: "Ja, registrera beslutet", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "fire-event", eventName: "sim:utdelningsbeslut-confirm" },
            {
                type: "stream",
                text: `**150 000 kr** beslutad utdelning bokförd — 2091 → 2898. Utbetalning sker när du bekräftar separat.`,
                speed: 11,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <Block block={{ rows: [{ icon: "shareholder", title: "Anders Richnau", description: "Utdelning 2025 · Konto 2091 → 2898", amount: 150000, status: "Beslutad" }] }} />
                ),
            },
        ],
    },
]

// ─── Scenario 3: Beginner — "when do I file government docs?" ────────────────

function buildNyborjareMoteScript(onOpen: (type: WalkthroughType) => void): SimScript { return [
    { role: "user", content: "Hmm när måste man skicka in dokument till Bolagsverket?" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 700 },
            {
                type: "stream",
                text: `Bra fråga. Det viktigaste dokumentet är **årsredovisningen** — den ska lämnas in till Bolagsverket senast **7 månader** efter räkenskapsårets slut.

Men innan du kan lämna in den måste du hålla **två möten** i rätt ordning:

1. **Styrelsemöte** — styrelsen antar årsredovisningen
2. **Ordinarie bolagsstämma** — ägarna fastställer den och fattar beslut (t.ex. om utdelning)

Först efter stämman kan du lämna in till Bolagsverket. Vill du veta hur man håller ett sådant möte?`,
                speed: 10,
            },
        ],
    },
    { role: "user", content: "Ja, hur håller man ett möte? Vad krävs?", delay: 1800 },
    {
        role: "scooby",
        elements: [
            {
                type: "stream",
                text: `För **ordinarie bolagsstämma** i ett AB gäller:

- **Kallelse** ska skickas ut minst **4 veckor** innan (per post eller e-post om alla ägare godkänt det)
- **Dagordning** — en lista över vad som ska beslutas
- **Årsredovisningen** ska vara klar och bifogas kallelsen
- Mötet kan hållas digitalt om alla ägare är överens
- Protokollet ska signeras av **ordförande + en justerare**

Du behöver inte ett fysiskt rum — ni kan ha det på ett videosamtal. Ska jag boka ett möte åt dig?`,
                speed: 10,
            },
        ],
    },
    { role: "user", content: "Ja, kan du boka ett möte på fredag?", delay: 1800 },
    {
        role: "scooby",
        elements: [
            {
                type: "stream",
                text: `Självklart. Vad ska mötet handla om?`,
                speed: 14,
            },
        ],
    },
    { role: "user", content: "Jag vet inte riktigt, jag hörde bara att man måste ha ett sånt möte för att kunna lämna in till Bolagsverket sen", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 800 },
            { type: "tool", name: "get_income_statement", duration: 1200, resultLabel: "Hämtade bokslutsdata 2025" },
            {
                type: "stream",
                text: `Inga problem — jag vet precis vad du behöver. Jag sätter ihop en standardagenda för **ordinarie bolagsstämma 2025**:

1. Val av ordförande och justerare
2. Godkännande av dagordning
3. Framläggande av årsredovisning 2025
4. Fastställande av resultat- och balansräkning
5. Resultatdisposition — årets vinst på **284 500 kr** förs i ny räkning
6. Ansvarsfrihet för styrelsen
7. Inga övriga ärenden

Det är allt som krävs. Protokollet genereras automatiskt och du skriver ut det, signerar, och kan sen lämna in årsredovisningen.`,
                speed: 10,
            },
            {
                type: "card",
                delay: 400,
                content: (
                    <InteractiveActionConfirmCard
                        title="Schemalägg bolagsstämma"
                        description="Fredag 2 maj 2026 · Ordinarie stämma"
                        properties={[
                            { label: "Typ", value: "Ordinarie bolagsstämma" },
                            { label: "Datum", value: "Fredag 2 maj 2026" },
                            { label: "Plats", value: "Digitalt (valfritt)" },
                            { label: "Dagordning", value: "7 punkter (standard)" },
                            { label: "Dokument", value: "Protokoll genereras automatiskt" },
                        ]}
                        confirmLabel="Boka mötet"
                        icon={Gavel}
                        accent="indigo"
                        completedAction="created"
                        completedTitle="Bolagsstämma schemalagd"
                        onCancel={() => {}}
                        triggerEvent="sim:nybörjare-mote-confirm"
                    />
                ),
            },
        ],
    },
    { role: "user", content: "Perfekt, boka det", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "fire-event", eventName: "sim:nybörjare-mote-confirm" },
            { type: "tool", name: "schedule_meeting", duration: 1000, resultLabel: "Möte schemalagt" },
            {
                type: "stream",
                text: `Klart. Protokollet är förberett — håll mötet på fredag, gå igenom punkterna, signera dokumentet, och sen är du redo att lämna in årsredovisningen till Bolagsverket.`,
                speed: 11,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <WalkthroughOpenerCard
                        title="Bolagsstämmoprotokoll 2025"
                        subtitle="Ordinarie stämma · 2 maj 2026 · Redo att signera"
                        icon={FileText}
                        iconBg="bg-indigo-500/10"
                        iconColor="text-indigo-600 dark:text-indigo-500"
                        onOpen={() => onOpen("moten")}
                    />
                ),
            },
        ],
    },
]}

// ─── Scenario 4: "I want utdelning, as much as I'm allowed" ──────────────────

function buildMaxUtdelningScript(onOpen: (type: WalkthroughType) => void): SimScript { return [
    { role: "user", content: "Jag hörde att man måste ha ett möte för att ta utdelning. Jag vill ha så mycket utdelning som möjligt i år" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 900 },
            { type: "tool", name: "calculate_tax", duration: 2000, resultLabel: "K10 beräknad — gränsbelopp 187 550 kr" },
            { type: "tool", name: "get_income_statement", duration: 1200, resultLabel: "Kontrollerade fritt eget kapital" },
            {
                type: "stream",
                text: `Rätt — utdelning måste beslutas på **ordinarie bolagsstämma**. Jag har räknat ut din situation:

**K10-gränsbelopp 2025: 187 550 kr**
Det är max du kan ta ut till 20% skatt (kapitalskatt).

**Fritt eget kapital: 284 500 kr** — täcker utdelningen ✓

Rekommendation: ta ut **187 550 kr** — maxar årets gränsbelopp, lägre skatt än om du tar ut mer.

- Skatt (20%): **37 510 kr**
- **Netto: 150 040 kr** i fickan

Jag förbereder en bolagsstämma med utdelningsbeslutet på dagordningen. Vilket datum passar?`,
                speed: 10,
            },
        ],
    },
    { role: "user", content: "Gör det på fredag, whatever som funkar", delay: 1800 },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 600 },
            {
                type: "stream",
                text: `Sätter upp mötet med utdelning inlagt som beslutspunkt.`,
                speed: 14,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <InteractiveActionConfirmCard
                        title="Schemalägg bolagsstämma + utdelning"
                        description="Fredag 2 maj 2026 · Utdelningsbeslut 187 550 kr"
                        properties={[
                            { label: "Typ", value: "Ordinarie bolagsstämma" },
                            { label: "Datum", value: "Fredag 2 maj 2026" },
                            { label: "Utdelning", value: "187 550 kr (max K10)" },
                            { label: "Skatt", value: "37 510 kr (20% kapital)" },
                            { label: "Netto", value: "150 040 kr" },
                            { label: "Dokument", value: "Protokoll + bokföring genereras" },
                        ]}
                        confirmLabel="Boka + förbered beslut"
                        icon={Landmark}
                        accent="purple"
                        completedAction="created"
                        completedTitle="Möte och utdelningsbeslut klart"
                        onCancel={() => {}}
                        triggerEvent="sim:max-utdelning-confirm"
                    />
                ),
            },
        ],
    },
    { role: "user", content: "Ja, kör", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "fire-event", eventName: "sim:max-utdelning-confirm" },
            { type: "tool", name: "schedule_meeting", duration: 900, resultLabel: "Bolagsstämma schemalagd" },
            { type: "tool", name: "book_dividend", duration: 1100, resultLabel: "Utdelningsbeslut bokfört" },
            {
                type: "stream",
                text: `Klart. Protokollet har utdelningsbeslutet på 187 550 kr inlagt. Håll mötet på fredag, signera protokollet — sen bokar jag utbetalningen när du är redo.`,
                speed: 11,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <Block block={{
                        rows: [
                            { icon: "report",       title: "Bolagsstämmoprotokoll 2025", description: "Fredag 2 maj · Redo att signera", status: "Signering" },
                            { icon: "shareholder",  title: "Utdelningsbeslut",           description: "187 550 kr · Konto 2091 → 2898",  amount: 187550, status: "Beslutad" },
                        ],
                    }} />
                ),
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <WalkthroughOpenerCard
                        title="Bolagsstämmoprotokoll 2025"
                        subtitle="Utdelning 187 550 kr inlagd · Redo för signering"
                        icon={FileText}
                        iconBg="bg-indigo-500/10"
                        iconColor="text-indigo-600 dark:text-indigo-500"
                        onOpen={() => onOpen("moten")}
                    />
                ),
            },
        ],
    },
]}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BolagsstammaStreamingPage() {
    const [openWalkthrough, setOpenWalkthrough] = useState<WalkthroughType | null>(null)
    const forberedProtokollScript = buildForberedProtokollScript(setOpenWalkthrough)
    const nybörjareScript = buildNyborjareMoteScript(setOpenWalkthrough)
    const maxUtdelningScript = buildMaxUtdelningScript(setOpenWalkthrough)

    return (
        <ScenarioPage
            title="Bolagsstämma"
            subtitle="Hur Scooby guidar genom möten, protokoll och utdelningsbeslut — från nybörjare till max-utdelning."
            backHref="/test-ui/streaming/agare"
            backLabel="Ägare"
        >
            <Scenario title="Nybörjare — när lämnar jag in till Bolagsverket?" description="Läs + skriv-scenario — från fråga till schemalagt möte och dokument" badges={["AB"]}>
                <SimulatedConversation script={nybörjareScript} />
            </Scenario>

            <Scenario title="Utdelning — så mycket som möjligt" description="Skriv-scenario — K10-beräkning, möte och beslut i ett flöde" badges={["AB"]}>
                <SimulatedConversation script={maxUtdelningScript} />
            </Scenario>

            <Scenario title="Förbered stämmoprotokoll" description="Skriv-scenario — generera dokument direkt" badges={["AB"]}>
                <SimulatedConversation script={forberedProtokollScript} />
            </Scenario>

            <Scenario title="Utdelningsbeslut på stämman" description="Skriv-scenario — beslut kopplat till K10-gränsbelopp" badges={["AB"]}>
                <SimulatedConversation script={utdelningsbeslut} />
            </Scenario>

            <WalkthroughOverlay type={openWalkthrough} onClose={() => setOpenWalkthrough(null)} />
        </ScenarioPage>
    )
}
