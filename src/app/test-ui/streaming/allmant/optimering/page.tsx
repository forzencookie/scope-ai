"use client"

/**
 * AI Streaming: Allmänt → Skatteoptimering & Rådgivning
 *
 * Mix of text + tool calls + structured advice.
 * Shows how Scooby uses tools to fetch data, then formats advice
 * as well-structured markdown with comparisons and recommendations.
 *
 * Scenarios:
 * 1. "Lön vs utdelning — vad lönar sig?" — tool calls + comparison table
 * 2. "Ska jag momsregistrera mig?" — knowledge question with tool context
 * 3. "Hur kan jag minska skatten?" — personalized advice based on company data
 */

import { SimulatedConversation, Scenario, ScenarioPage, type SimScript } from "../../_shared/simulation"

// ─── Scenario 1: Lön vs utdelning ───

const lonVsUtdelning: SimScript = [
    { role: "user", content: "Vad lönar sig mest — ta ut lön eller utdelning?" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 800 },
            { type: "tool", name: "get_income_statement", duration: 1200, resultLabel: "Hämtade bolagets resultat" },
            { type: "tool", name: "calculate_tax", duration: 1800, resultLabel: "Beräknade skatteoptimering" },
            {
                type: "stream",
                text: `Bra fråga — svaret beror på **dina siffror**. Jag har räknat på tre scenarier baserat på ditt bolags resultat på **600 000 kr**:

**Jämförelse — 400 000 kr uttag:**

- **Lön** → netto 272 000 kr · skatt 253 680 kr
- **Utdelning** → netto 237 600 kr · skatt 162 400 kr
- **Mix (optimal)** → netto **296 160 kr** · skatt 208 040 kr ✓

**Min rekommendation:**

**Mixstrategin** ger dig mest i fickan — ta ut **lön upp till brytpunkten** (≈614 000 kr för 2026) och resten som **utdelning inom K10-gränsbeloppet**.

Det finns dock en viktig detalj: **lön ger pensionsrätter**, utdelning gör det inte. Om du vill bygga pension bör lönen vara minst **8.07 inkomstbasbelopp** (≈597 000 kr 2026).

> 💡 *Kort svar:* Mix av lön + utdelning slår båda alternativen ensamt. Vill du att jag beräknar den optimala fördelningen för just dig?`,
                speed: 12,
            },
        ],
    },
    { role: "user", content: "Beräkna den optimala fördelningen", delay: 2500 },
    {
        role: "scooby",
        elements: [
            { type: "tool", name: "calculate_tax", duration: 2200, resultLabel: "Optimal fördelning beräknad" },
            {
                type: "stream",
                text: `Resultat **600 000 kr** — K10 **204 325 kr**:

- Lön (inkl. semestertillägg): **396 000 kr**
- Utdelning (inom gränsbelopp): **204 325 kr**
- Arbetsgivaravgift på lön: −124 420 kr
- Inkomstskatt lön (kommunal): −126 720 kr
- Kapitalskatt utdelning (20%): −40 865 kr
- **Totalt netto: 428 740 kr**

Det är **36 740 kr mer** i fickan jämfört med att ta allt som lön. Vill du att jag skapar ett styrelsebeslut för utdelningen?`,
                speed: 11,
            },
        ],
    },
]

// ─── Scenario 2: Should I register for VAT? ───

const momsregistrering: SimScript = [
    { role: "user", content: "Ska jag momsregistrera mitt företag?" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 700 },
            { type: "tool", name: "get_company_info", duration: 800, resultLabel: "Hämtade omsättning" },
            {
                type: "stream",
                text: `Ditt bolag omsätter **485 000 kr** hittills i år — det betyder att du **måste** vara momsregistrerad.

**Reglerna i korthet:**

Momsregistrering är **obligatorisk** om din omsättning överstiger **80 000 kr** per räkenskapsår (gränsen höjdes 2025, var tidigare 30 000 kr).

Det finns tre lägen:

1. **Under 80 000 kr** — frivilligt. Du *kan* registrera dig om du vill dra av moms på inköp, men behöver inte.

2. **Över 80 000 kr** — obligatoriskt. Måste registreras hos Skatteverket och deklarera moms.

3. **Momsfri verksamhet** — viss verksamhet är undantagen oavsett omsättning (sjukvård, utbildning, bank/försäkring).

**I ditt fall:** Du är redan över gränsen med god marginal. Du ska vara momsregistrerad, och det är du redan.

> 💡 *Momsperiod:* Med din omsättning deklarerar du moms **kvartalsvis** (gränsen för månadsvis är 40 miljoner kr/år).`,
                speed: 12,
            },
        ],
    },
    { role: "user", content: "Tack, hur byter jag till månadsvis momsredovisning?", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 500 },
            {
                type: "stream",
                text: `Du kan ansöka hos Skatteverket om att byta till **månadsvis momsredovisning** — men det är bara obligatoriskt vid omsättning över **40 miljoner kr/år**.

Med 485 000 kr i omsättning finns det ingen anledning att byta. Kvartalsvis ger dig:

- **Färre deklarationer** — 4 per år istället för 12
- **Bättre likviditet** — du behåller momspengarna längre
- **Mindre administration** — en gång per kvartal räcker

Min rekommendation: **stanna på kvartalsvis**. Det passar din storlek perfekt.`,
                speed: 11,
            },
        ],
    },
]

// ─── Scenario 3: Reduce tax ───

const minskaSkatten: SimScript = [
    { role: "user", content: "Hur kan jag minska skatten?" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 1000 },
            { type: "tool", name: "get_income_statement", duration: 1400, resultLabel: "Hämtade bolagets resultat" },
            { type: "tool", name: "calculate_tax", duration: 1800, resultLabel: "Beräknade skatteåtgärder" },
            {
                type: "stream",
                text: `Baserat på ditt bolags resultat (**600 000 kr**) och din nuvarande lön (**42 000 kr/mån**) ser jag tre konkreta åtgärder:

**1. Maximera pensionsavsättning**

Du kan avsätta upp till **35% av lönen** i tjänstepension — avdragsgill för bolaget, skattefritt för dig tills uttag. Pensionsavsättning 15 000 kr/mån sänker bolagsskatten med **~37 000 kr/år**.

**2. Använda hela K10-gränsbeloppet**

Ditt gränsbelopp är **187 550 kr**. Utdelning upp till det beskattas med **20%** istället för ~50% som lön. Du har inte tagit ut någon utdelning i år. Besparing: **ca 56 000 kr** jämfört med lön.

**3. Periodisera intäkter**

Om du kan fakturera i januari istället för december skjuts resultat till nästa räkenskapsår. Ger **likviditetsvinst** — inte permanent skattebesparing.

Pensionsavsättning + utdelning inom K10 kan spara dig uppemot **93 000 kr** i skatt. Ska jag räkna på den optimala fördelningen?`,
                speed: 12,
            },
        ],
    },
    { role: "user", content: "Tack, gör det", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "tool", name: "calculate_tax", duration: 2500, resultLabel: "Optimerad plan klar" },
            {
                type: "stream",
                text: `Din optimerade plan:

- Tjänstepension: **180 000 kr/år** → skattebespar 37 080 kr
- Utdelning (inom K10): **187 550 kr** → skattebespar 56 265 kr
- **Total besparing: 93 345 kr**

Jag rekommenderar att du:
1. **Höjer pensionsavsättningen** från nästa månad — jag kan bokföra det
2. **Beslutar utdelning** på nästa stämma — jag skapar protokollet

Vill du att jag börjar med pensionsavsättningen?`,
                speed: 10,
            },
        ],
    },
]

// ─── Page ───

export default function OptimeringStreamingPage() {
    return (
        <ScenarioPage
            title="Skatteoptimering & Rådgivning"
            subtitle="Hur Scooby ger råd — hämtar data, analyserar och presenterar strukturerade rekommendationer."
            backHref="/test-ui/streaming/allmant"
            backLabel="Allmänt"
        >
            <Scenario title="Lön vs utdelning" description="Rådgivning — tool calls + jämförelsetabell + rekommendation" badges={["AB"]}>
                <SimulatedConversation script={lonVsUtdelning} />
            </Scenario>

            <Scenario title="Ska jag momsregistrera mig?" description="Kunskapsfråga med kontextberoende svar" badges={["Alla"]}>
                <SimulatedConversation script={momsregistrering} />
            </Scenario>

            <Scenario title="Minska skatten" description="Personlig rådgivning — baserat på företagets data" badges={["AB"]}>
                <SimulatedConversation script={minskaSkatten} />
            </Scenario>
        </ScenarioPage>
    )
}
