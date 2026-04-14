"use client"

import { Wallet, ArrowUpCircle } from "lucide-react"
import { SimulatedConversation, Scenario, ScenarioPage, type SimScript } from "../../_shared/simulation"
import { ConfirmationCard } from "@/components/ai/confirmations/confirmation-card"
import { InlineCardRenderer } from "@/components/ai/cards/inline"

const registreraUttag: SimScript = [
    { role: "user", content: "Jag vill ta ut 30 000 kr från företagskontot" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 800 },
            { type: "tool", name: "search_tools", duration: 500, resultLabel: "Sökte bland verktyg" },
            { type: "tool", name: "get_company_info", duration: 1100, resultLabel: "Hämtade kontouppgifter" },
            {
                type: "stream",
                text: `Jag registrerar det som ett **privat uttag** — det minskar ditt eget kapital i bolaget. Bokföring sker på konto **2013** (Egna uttag).`,
                speed: 12,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <ConfirmationCard
                        confirmation={{
                            title: "Registrera privat uttag",
                            description: "Från företagskonto till privat",
                            summary: [
                                { label: "Delägare", value: "Erik Svensson" },
                                { label: "Belopp", value: "30 000 kr" },
                                { label: "Konto debet", value: "2013 Egna uttag" },
                                { label: "Konto kredit", value: "1930 Företagskonto" },
                                { label: "Datum", value: "2026-04-06" },
                                { label: "Saldo efter uttag", value: "145 200 kr" },
                            ],
                            action: { toolName: "book_partner_withdrawal", params: {} },
                        }}
                        confirmLabel="Registrera uttag"
                        icon={Wallet}
                        accent="blue"
                        isDone
                        completedAction="booked"
                        completedTitle="Delägaruttag bokfört"
                        onConfirm={() => {}}
                        onCancel={() => {}}
                    />
                ),
            },
            {
                type: "stream",
                text: `Verifikation **A-51** skapad. Ditt eget kapital har minskat med 30 000 kr.\n\n> I ett HB beskattas resultatet oavsett vad du tar ut — uttaget i sig är inte en skattepliktig händelse.`,
                speed: 11,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <InlineCardRenderer card={{ cardType: "verification", data: { id: "v-51", verificationNumber: "A-51", description: "Privat uttag Erik Svensson", date: "2026-04-06", amount: 30000 } }} />
                ),
            },
        ],
    },
]

const visaUttag: SimScript = [
    { role: "user", content: "Visa mina uttag i år" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 700 },
            { type: "tool", name: "search_tools", duration: 400, resultLabel: "Sökte bland verktyg" },
            { type: "tool", name: "get_transactions", duration: 1400, resultLabel: "Hämtade uttag 2026" },
            {
                type: "stream",
                text: `Dina uttag och insättningar under **2026**:

- **15 jan** — Uttag −25 000 kr · saldo 230 000 kr
- **10 feb** — Insättning +50 000 kr · saldo 280 000 kr
- **1 mar** — Uttag −40 000 kr · saldo 240 000 kr
- **20 mar** — Uttag −15 000 kr · saldo 225 000 kr
- **6 apr** — Uttag −30 000 kr · saldo 195 000 kr

Totalt uttag **110 000 kr** · insättningar **50 000 kr** · netto **−60 000 kr**

Ditt eget kapital har minskat med 60 000 kr i år. Vill du se hur det påverkar balansräkningen?`,
                speed: 10,
            },
        ],
    },
    { role: "user", content: "Ja, visa balansräkningen", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "tool", name: "get_balance_sheet", duration: 1200, resultLabel: "Hämtade balansräkning" },
            {
                type: "stream",
                text: `Ditt **eget kapital** i balansräkningen:

- Eget kapital vid årets ingång: **255 000 kr**
- Egna uttag: **−110 000 kr**
- Egna insättningar: **+50 000 kr**
- Årets resultat (hittills): **+142 000 kr**
- **Eget kapital nu: 337 000 kr**

Trots uttagen på 60 000 kr netto har ditt eget kapital ökat tack vare årets resultat. Du har en sund balans.`,
                speed: 10,
            },
        ],
    },
]

const registreraInsattning: SimScript = [
    { role: "user", content: "Jag har satt in 20 000 kr av egna pengar på företagskontot" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 600 },
            { type: "tool", name: "search_tools", duration: 400, resultLabel: "Sökte bland verktyg" },
            {
                type: "stream",
                text: `Jag registrerar det som en **privat insättning** — det ökar ditt eget kapital. Bokföring sker på konto **2018** (Egna insättningar).`,
                speed: 12,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <ConfirmationCard
                        confirmation={{
                            title: "Registrera privat insättning",
                            description: "Från privat till företagskonto",
                            summary: [
                                { label: "Delägare", value: "Erik Svensson" },
                                { label: "Belopp", value: "20 000 kr" },
                                { label: "Konto debet", value: "1930 Företagskonto" },
                                { label: "Konto kredit", value: "2018 Egna insättningar" },
                                { label: "Datum", value: "2026-04-06" },
                            ],
                            action: { toolName: "book_partner_deposit", params: {} },
                        }}
                        confirmLabel="Registrera insättning"
                        icon={ArrowUpCircle}
                        accent="green"
                        isDone
                        completedAction="booked"
                        completedTitle="Delägarinsättning bokförd"
                        onConfirm={() => {}}
                        onCancel={() => {}}
                    />
                ),
            },
            {
                type: "stream",
                text: `Verifikation **A-52** skapad. Ditt eget kapital har ökat med 20 000 kr.`,
                speed: 12,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <InlineCardRenderer card={{ cardType: "verification", data: { id: "v-52", verificationNumber: "A-52", description: "Privat insättning Erik Svensson", date: "2026-04-06", amount: 20000 } }} />
                ),
            },
        ],
    },
]

export default function DelagaruttagStreamingPage() {
    return (
        <ScenarioPage
            title="Delägaruttag"
            subtitle="Hur Scooby registrerar uttag och insättningar i HB/KB."
            backHref="/test-ui/ai-streaming/loner"
            backLabel="Löner"
        >
            <Scenario title="Registrera uttag" description="Skriv-scenario — privat uttag från eget kapital" badges={["HB", "KB"]}>
                <SimulatedConversation script={registreraUttag} />
            </Scenario>

            <Scenario title="Visa uttag" description="Läs-scenario — årsöversikt + balansräkning" badges={["HB", "KB"]}>
                <SimulatedConversation script={visaUttag} />
            </Scenario>

            <Scenario title="Registrera insättning" description="Skriv-scenario — privat insättning (omvänt flöde)" badges={["HB", "KB"]}>
                <SimulatedConversation script={registreraInsattning} />
            </Scenario>
        </ScenarioPage>
    )
}
