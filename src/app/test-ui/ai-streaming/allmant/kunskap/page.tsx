"use client"

/**
 * AI Streaming: Allmänt → Kunskapsfrågor
 *
 * Pure text scenarios — no tool calls, no cards, no confirmations.
 * Demonstrates how Scooby SCALES formatting based on question complexity:
 *
 * TINY question   → 1-2 sentences, no formatting beyond bold
 * QUICK question  → short paragraph, maybe one bold term
 * MEDIUM question → numbered list + bold labels + tip
 * BIG question    → headers + table + example + tip
 *
 * Each scenario includes a follow-up exchange to simulate real conversation flow.
 */

import { SimulatedConversation, Scenario, ScenarioPage, type SimScript } from "../../_shared/simulation"

// ─── Scenario 1: Tiny — one-liner answer ───

const vadArMoms: SimScript = [
    { role: "user", content: "Vad är moms?" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 400 },
            {
                type: "stream",
                text: `**Moms** (mervärdesskatt) är en skatt som läggs på varor och tjänster. Ditt företag tar in moms vid försäljning och drar av moms vid inköp — skillnaden betalas till Skatteverket.`,
                speed: 12,
            },
        ],
    },
    { role: "user", content: "Vilka momssatser finns det?", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 500 },
            {
                type: "stream",
                text: `Det finns tre momssatser i Sverige:

- **25%** — standardsatsen, gäller de flesta varor och tjänster
- **12%** — livsmedel, hotell, restaurang
- **6%** — böcker, tidningar, kollektivtrafik, kultur

Vissa verksamheter är helt **momsbefriade** — t.ex. sjukvård, utbildning och bankverksamhet.`,
                speed: 11,
            },
        ],
    },
]

// ─── Scenario 2: Quick — short paragraph ───

const debetKredit: SimScript = [
    { role: "user", content: "Vad är skillnaden mellan debet och kredit?" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 450 },
            {
                type: "stream",
                text: `**Debet** är vänster sida, **kredit** är höger sida i en bokföring. Varje verifikation har alltid lika mycket debet som kredit — de ska balansera.

I praktiken: **debet ökar** tillgångar och kostnader, **kredit ökar** skulder och intäkter. Köper du något för 500 kr debiteras kostnadskontot (kostnad upp) och krediteras bankkontot (pengar ut).`,
                speed: 12,
            },
        ],
    },
    { role: "user", content: "Kan du ge ett konkret exempel?", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 500 },
            {
                type: "stream",
                text: `Säg att du köper kontorsmaterial för **500 kr** inklusive moms:

- **Debet** 6110 Kontorsmaterial — 400 kr (kostnaden)
- **Debet** 2640 Ingående moms — 100 kr (momsen du betalt)
- **Kredit** 1930 Företagskonto — 500 kr (pengarna som lämnar kontot)

Totalt debet = 500 kr, totalt kredit = 500 kr. Balanserar perfekt.`,
                speed: 11,
            },
        ],
    },
]

// ─── Scenario 3: Medium — numbered list + tip ───

const utdelning: SimScript = [
    { role: "user", content: "Hur fungerar utdelning?" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 600 },
            {
                type: "stream",
                text: `**Utdelning** är när ett aktiebolag delar ut vinst till sina ägare. Pengarna går från bolagets kassa till ägarnas privata konton.

Så här fungerar det i praktiken:

1. **Bolagsstämman beslutar** — utdelning kräver ett formellt beslut på ordinarie eller extra bolagsstämma. Styrelsen föreslår, stämman godkänner.

2. **Beloppet begränsas** — du kan bara dela ut det som finns som **fritt eget kapital** i balansräkningen. Bundet eget kapital (aktiekapital) får inte röras.

3. **Skatten beror på K10** — om du äger kvalificerade aktier (de flesta fåmansbolag) beskattas utdelning upp till **gränsbeloppet** med 20% kapitalskatt. Allt över beskattas som **tjänsteinkomst** (~50%).

**I korthet:** Utdelning inom gränsbeloppet = 20% skatt. Över gränsbeloppet = inkomstskatt. Gränsbeloppet beräknas i din K10-blankett.

> 💡 *Tips:* Vill du veta ditt gränsbelopp? Säg "beräkna K10" så räknar jag ut det åt dig.`,
                speed: 12,
            },
        ],
    },
    { role: "user", content: "Vad händer om jag delar ut mer än fritt eget kapital?", delay: 2500 },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 500 },
            {
                type: "stream",
                text: `Det är en **olaglig värdeöverföring** enligt aktiebolagslagen (ABL 17 kap). Konsekvenserna:

- Mottagaren kan bli **återbetalningsskyldig**
- Styrelsen kan bli **personligt skadeståndsskyldig**
- I värsta fall kan det utgöra **trolöshet mot huvudman** (brott)

Jag kontrollerar alltid att fritt eget kapital räcker innan jag föreslår utdelning — du behöver inte oroa dig för det här så länge du går via mig.`,
                speed: 11,
            },
        ],
    },
]

// ─── Scenario 4: Big — headers + table ───

const basKontoplan: SimScript = [
    { role: "user", content: "Förklara BAS-kontoplanen för mig" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 700 },
            {
                type: "stream",
                text: `**BAS-kontoplanen** är det standardiserade systemet som svenska företag använder för att organisera sin bokföring. Varje konto har ett **nummer** och en **beskrivning** som anger vad det representerar.

### Kontoklass-översikt

| Klass | Namn | Exempel |
|---|---|---|
| **1xxx** | Tillgångar | 1930 Företagskonto, 1510 Kundfordringar |
| **2xxx** | Skulder & eget kapital | 2440 Leverantörsskulder, 2610 Utgående moms |
| **3xxx** | Intäkter | 3010 Försäljning tjänster |
| **4xxx** | Material/varor | 4010 Inköp varor |
| **5–6xxx** | Övriga kostnader | 5010 Lokalhyra, 6110 Kontorsmaterial |
| **7xxx** | Personal | 7010 Löner, 7510 Arbetsgivaravgifter |
| **8xxx** | Finansiellt | 8310 Ränteintäkter |

**Grundprincipen:** Varje bokföring har minst två rader — en **debet** och en **kredit** — som alltid ska balansera. Köper du kontorsmaterial för 500 kr bokförs det:
- **Debet** 6110 (kostnad ökar) — 500 kr
- **Kredit** 1930 (bankkontot minskar) — 500 kr

Du behöver inte kunna kontoplanen utantill — jag matchar automatiskt mot rätt konto när du bokför.`,
                speed: 12,
            },
        ],
    },
    { role: "user", content: "Vilka konton använder jag mest som konsultbolag?", delay: 2500 },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 600 },
            {
                type: "stream",
                text: `Som konsultbolag är dessa dina vanligaste konton:

| Konto | Namn | Används för |
|---|---|---|
| **1930** | Företagskonto | Alla in- och utbetalningar |
| **2610** | Utgående moms | Moms på dina fakturor |
| **2640** | Ingående moms | Moms på dina inköp |
| **3010** | Försäljning tjänster | Dina konsultintäkter |
| **5010** | Lokalhyra | Kontorshyra |
| **6110** | Kontorsmaterial | Småinköp |
| **6230** | Datakommunikation | Internet, mobil |
| **7010** | Löner | Din lön |
| **7510** | Arbetsgivaravgifter | Sociala avgifter |

De flesta konsultbolag klarar sig med 15-20 konton i praktiken. Jag väljer rätt konto automatiskt när du bokför.`,
                speed: 10,
            },
        ],
    },
]

// ─── Scenario 5: Big — headers + table + calculation example ───

const k10: SimScript = [
    { role: "user", content: "Vad är K10?" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 800 },
            {
                type: "stream",
                text: `**K10** är en bilaga till din inkomstdeklaration som beräknar hur mycket utdelning du kan ta ut med **låg skatt** (20%) istället för hög skatt (~50%).

### Varför det spelar roll

Som ägare av ett **fåmansbolag** (de flesta småbolag) har du *kvalificerade aktier*. Skatteverket vill förhindra att du tar ut lön som utdelning för att spara skatt — därför finns K10 som en gräns.

### Hur gränsbeloppet beräknas

Det finns två metoder — du väljer den som ger **högst** belopp:

1. **Förenklingsregeln** — fast belopp, ca 204 325 kr (2026). Kräver inga anställda.
2. **Huvudregeln** — baseras på utbetalda löner i bolaget. Ju mer löner, desto högre gränsbelopp.

### Praktiskt exempel

Säg att ditt bolag betalade **800 000 kr** i löner under 2025:

| Post | Belopp |
|---|---|
| Omkostnadsbelopp (anskaffning) | 50 000 kr |
| Uppräkning (9%) | 4 500 kr |
| Lönebaserat utrymme (50% av 800k) | 400 000 kr |
| **Gränsbelopp** | **454 500 kr** |

Du kan alltså ta ut **454 500 kr** i utdelning med bara 20% skatt.

> 💡 Vill du beräkna ditt eget gränsbelopp? Säg "beräkna K10" — jag har alla siffror.`,
                speed: 12,
            },
        ],
    },
    { role: "user", content: "Vilken metod passar mig bäst om jag inte har anställda?", delay: 2500 },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 500 },
            {
                type: "stream",
                text: `Utan anställda är **förenklingsregeln** nästan alltid bäst. Huvudregeln kräver att bolaget betalar ut löner på minst **6 inkomstbasbelopp** (≈ 469 800 kr för 2026) — annars ger den inget lönebaserat utrymme alls.

Med förenklingsregeln får du ett fast gränsbelopp på **204 325 kr** utan krav på löneuttag. Enkelt och förutsägbart.

**En viktig detalj:** Du kan bara använda förenklingsregeln i *ett* bolag. Äger du aktier i flera fåmansbolag måste du välja.`,
                speed: 11,
            },
        ],
    },
]

// ─── Page ───

export default function KunskapStreamingPage() {
    return (
        <ScenarioPage
            title="Kunskapsfrågor"
            subtitle="Hur Scooby skalar svarslängd efter frågans komplexitet — från en mening till fullständig förklaring."
            backHref="/test-ui/ai-streaming/allmant"
            backLabel="Allmänt"
        >
            <Scenario title="Tiny — enkel definition" description="1-2 meningar, ingen formatering" badges={["Alla"]}>
                <SimulatedConversation script={vadArMoms} />
            </Scenario>

            <Scenario title="Quick — kort förklaring" description="Ett stycke + bold nyckelord" badges={["Alla"]}>
                <SimulatedConversation script={debetKredit} />
            </Scenario>

            <Scenario title="Medium — strukturerad förklaring" description="Intro + numrerad lista + sammanfattning + tips" badges={["Alla"]}>
                <SimulatedConversation script={utdelning} />
            </Scenario>

            <Scenario title="Big — systemöversikt" description="Intro + rubriker + tabell + konkret exempel" badges={["Alla"]}>
                <SimulatedConversation script={basKontoplan} />
            </Scenario>

            <Scenario title="Big — koncept med räkneexempel" description="Kontext + rubriker + tabell + beräkning + tips" badges={["AB"]}>
                <SimulatedConversation script={k10} />
            </Scenario>
        </ScenarioPage>
    )
}
