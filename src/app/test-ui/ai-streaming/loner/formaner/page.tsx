"use client"

import { Gift, Car } from "lucide-react"
import { SimulatedConversation, Scenario, ScenarioPage, type SimScript } from "../../_shared/simulation"
import { ConfirmationCard } from "@/components/ai/confirmations/confirmation-card"
import { InlineCardRenderer } from "@/components/ai/cards/inline"

const tilldelaFriskvard: SimScript = [
    { role: "user", content: "Ge Anna Lindberg friskvårdsbidrag på 5 000 kr per år" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 700 },
            { type: "tool", name: "search_tools", duration: 500, resultLabel: "Sökte bland verktyg" },
            {
                type: "stream",
                text: `Friskvårdsbidrag upp till **5 000 kr** är skattefritt för den anställde. Det bokförs som personalvårdskostnad på konto **7690**.`,
                speed: 12,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <ConfirmationCard
                        confirmation={{
                            title: "Tilldela friskvårdsbidrag",
                            description: "Anna Lindberg — 5 000 kr/år",
                            summary: [
                                { label: "Anställd", value: "Anna Lindberg" },
                                { label: "Förmån", value: "Friskvårdsbidrag" },
                                { label: "Belopp", value: "5 000 kr/år" },
                                { label: "Skatteeffekt", value: "Skattefritt (≤ 5 000 kr)" },
                                { label: "Konto", value: "7690 Personalvård" },
                            ],
                            action: { toolName: "assign_benefit", params: {} },
                        }}
                        confirmLabel="Tilldela"
                        icon={Gift}
                        accent="green"
                        isDone
                        completedAction="created"
                        completedTitle="Förmån tilldelad"
                        onConfirm={() => {}}
                        onCancel={() => {}}
                    />
                ),
            },
            {
                type: "stream",
                text: `Anna kan nu nyttja upp till 5 000 kr per år.`,
                speed: 12,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <InlineCardRenderer card={{ cardType: "benefit", data: { id: "b1", employeeName: "Anna Lindberg", benefitType: "Friskvårdsbidrag", amount: 5000, amountUnit: "år", taxable: false } }} />
                ),
            },
        ],
    },
]

const visaFormaner: SimScript = [
    { role: "user", content: "Vilka förmåner har vi i företaget?" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 600 },
            { type: "tool", name: "search_tools", duration: 500, resultLabel: "Hämtade förmåner" },
            {
                type: "stream",
                text: `Ni har **3 aktiva förmåner** i företaget:

- **Anna Lindberg** — Friskvårdsbidrag 5 000 kr/år · Skattefritt
- **Johan Berg** — Friskvårdsbidrag 5 000 kr/år · Skattefritt
- **Johan Berg** — Tjänstebil (Volvo XC40) · Förmånsvärde **4 200 kr/mån**

Johans tjänstebil beskattas som förmån — **4 200 kr/mån** läggs på hans bruttolön vid lönekörning.

Vill du lägga till eller ändra en förmån?`,
                speed: 11,
            },
        ],
    },
    { role: "user", content: "Ge Sara friskvårdsbidrag också, 5 000 kr", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "tool", name: "assign_benefit", duration: 800, resultLabel: "Friskvård tillagd för Sara" },
            {
                type: "stream",
                text: `Klart! Sara Ek har nu friskvårdsbidrag på **5 000 kr/år**. Skattefritt för henne, bokförs på 7690 Personalvård.`,
                speed: 12,
            },
        ],
    },
]

const tjanstebil: SimScript = [
    { role: "user", content: "Ge Sara en tjänstebil, det är en Tesla Model 3" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 900 },
            { type: "tool", name: "search_tools", duration: 500, resultLabel: "Sökte bland verktyg" },
            { type: "tool", name: "get_knowledge", duration: 1200, resultLabel: "Hämtade förmånsvärde" },
            {
                type: "stream",
                text: `Tesla Model 3 har ett förmånsvärde baserat på Skatteverkets beräkning. Jag behöver nybilspriset och om den är miljöbil (nedsättning).

**Tesla Model 3** (nybilspris ~480 000 kr, miljöbil) ger ett förmånsvärde på ca **3 800 kr/mån** efter miljöbilsnedsättning.

Förmånsvärdet beskattas som lön — Saras nettolön minskar.`,
                speed: 11,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <ConfirmationCard
                        confirmation={{
                            title: "Lägg till tjänstebil",
                            description: "Sara Ek — Tesla Model 3",
                            summary: [
                                { label: "Anställd", value: "Sara Ek" },
                                { label: "Bil", value: "Tesla Model 3" },
                                { label: "Nybilspris", value: "480 000 kr" },
                                { label: "Miljöbil", value: "Ja (nedsättning 40%)" },
                                { label: "Förmånsvärde", value: "3 800 kr/mån" },
                                { label: "Skatteeffekt", value: "Nettolön −1 200 kr/mån" },
                            ],
                            warnings: ["Förmånsvärdet beskattas som inkomst. Saras nettolön påverkas vid nästa lönekörning."],
                            action: { toolName: "assign_benefit", params: {} },
                        }}
                        confirmLabel="Lägg till"
                        icon={Car}
                        accent="blue"
                        isDone
                        completedAction="created"
                        completedTitle="Tjänstebil tillagd"
                        onConfirm={() => {}}
                        onCancel={() => {}}
                    />
                ),
            },
            {
                type: "stream",
                text: `Tesla Model 3 registrerad för Sara Ek. Förmånsvärdet (3 800 kr/mån) räknas in automatiskt vid nästa lönekörning.`,
                speed: 11,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <InlineCardRenderer card={{ cardType: "benefit", data: { id: "b2", employeeName: "Sara Ek", benefitType: "Tjänstebil (Tesla Model 3)", amount: 3800, amountUnit: "mån", taxable: true } }} />
                ),
            },
        ],
    },
]

export default function FormanerStreamingPage() {
    return (
        <ScenarioPage
            title="Förmåner"
            subtitle="Hur Scooby tilldelar och visar förmåner som friskvård och tjänstebil."
            backHref="/test-ui/ai-streaming/loner"
            backLabel="Löner"
        >
            <Scenario title="Tilldela friskvårdsbidrag" description="Skriv-scenario — enkel förmån utan förmånsvärde" badges={["Alla"]}>
                <SimulatedConversation script={tilldelaFriskvard} />
            </Scenario>

            <Scenario title="Visa förmåner" description="Läs-scenario — översikt + lägga till ny" badges={["Alla"]}>
                <SimulatedConversation script={visaFormaner} />
            </Scenario>

            <Scenario title="Lägg till tjänstebil" description="Skriv-scenario — förmån med förmånsvärde och skatteeffekt" badges={["Alla"]}>
                <SimulatedConversation script={tjanstebil} />
            </Scenario>
        </ScenarioPage>
    )
}
