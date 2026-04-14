"use client"

/**
 * AI Streaming: Bokföring → Fakturor
 *
 * Complete conversations with simulated streaming:
 * 1. READ: "Visa mina fakturor" → tool call + inline cards
 * 2. WRITE: "Skapa faktura till Acme" → tool calls + confirmation + done
 * 3. WRITE: "Registrera betalning" → tool calls + confirmation → done
 * 4. WRITE: "Makulera faktura" → tool calls + confirmation (amber) → done
 */

import { FileText, CreditCard, XCircle, Receipt } from "lucide-react"
import { SimulatedConversation, Scenario, ScenarioPage, type SimScript } from "../../_shared/simulation"
import { ConfirmationCard } from "@/components/ai/confirmations/confirmation-card"
import { InlineCardRenderer } from "@/components/ai/cards/inline"

// ─── Scenario 1: READ — visa obetalda fakturor, then user asks to send reminder ───

const visaFakturor: SimScript = [
    { role: "user", content: "Visa mina obetalda fakturor" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 800 },
            { type: "tool", name: "search_tools", duration: 500, resultLabel: "Sökte bland verktyg" },
            { type: "tool", name: "get_invoices", duration: 1400, resultLabel: "Hämtade 3 obetalda fakturor" },
            {
                type: "stream",
                text: `**3 obetalda** — totalt **87 500 kr**.\nEn har passerat förfallodatum.`,
                speed: 12,
            },
            {
                type: "card-list",
                delay: 200,
                items: [
                    <InlineCardRenderer card={{ cardType: "invoice", data: { id: "i1", invoiceNumber: "2026-042", customer: "Acme AB", amount: 37500, status: "sent" } }} />,
                    <InlineCardRenderer card={{ cardType: "invoice", data: { id: "i2", invoiceNumber: "2026-041", customer: "TechCorp AB", amount: 25000, status: "overdue" } }} />,
                    <InlineCardRenderer card={{ cardType: "invoice", data: { id: "i3", invoiceNumber: "2026-040", customer: "Nordic Design", amount: 25000, status: "sent" } }} />,
                ],
            },
            {
                type: "stream",
                text: `**#2026-041** TechCorp — förföll 28 mars.\nSka jag skicka en påminnelse?`,
                speed: 14,
            },
        ],
    },
    { role: "user", content: "Ja, skicka en påminnelse till TechCorp", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "tool", name: "send_invoice_reminder", duration: 1200, resultLabel: "Påminnelse skickad" },
            {
                type: "stream",
                text: `Klart!\n\n- **#2026-041** — TechCorp AB\n- Belopp: **25 000 kr**\n- Förföll: 28 mars\n- Betalning begärd inom 10 dagar`,
                speed: 11,
            },
        ],
    },
]

// ─── Scenario 2: WRITE — skapa faktura med bekräftelse, user confirms ───

const skapaFaktura: SimScript = [
    { role: "user", content: "Skapa en faktura till Acme AB på 50 000 kr för konsultarbete i mars" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 900 },
            { type: "tool", name: "search_tools", duration: 500, resultLabel: "Sökte bland verktyg" },
            { type: "tool", name: "get_company_info", duration: 1100, resultLabel: "Hämtade företagsuppgifter" },
            {
                type: "stream",
                text: `Hämtade dina uppgifter och Acme AB:s kunddata.\nKontrollera:`,
                speed: 12,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <ConfirmationCard
                        confirmation={{
                            title: "Skapa faktura",
                            description: "Kundfaktura till Acme AB",
                            summary: [
                                { label: "Kund", value: "Acme Consulting AB (559123-4567)" },
                                { label: "Beskrivning", value: "Konsultarbete mars 2026" },
                                { label: "Belopp exkl. moms", value: "50 000 kr" },
                                { label: "Moms 25%", value: "12 500 kr" },
                                { label: "Totalbelopp", value: "62 500 kr" },
                                { label: "Förfallodatum", value: "2026-05-06 (30 dagar)" },
                                { label: "Fakturanummer", value: "#2026-043" },
                            ],
                            action: { toolName: "create_invoice", params: {} },
                        }}
                        confirmLabel="Skapa faktura"
                        icon={FileText}
                        accent="teal"
                        isDone
                        completedAction="created"
                        completedTitle="Faktura #2026-043 skapad"
                        onConfirm={() => {}}
                        onCancel={() => {}}
                    />
                ),
            },
            {
                type: "stream",
                text: `Fakturan är skapad och verifikation **A-52** bokförd automatiskt.\n\nSkicka via e-post nu, eller granska PDF:en först?`,
                speed: 12,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <InlineCardRenderer card={{ cardType: "invoice", data: { id: "i-new", invoiceNumber: "2026-043", customer: "Acme Consulting AB", amount: 62500, status: "draft" } }} />
                ),
            },
        ],
    },
    { role: "user", content: "Skicka via e-post direkt", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "tool", name: "send_invoice_email", duration: 1600, resultLabel: "E-post skickad" },
            {
                type: "stream",
                text: `Skickad!\n- **#2026-043** → fakturor@acme.se\n- Notis när de öppnar den`,
                speed: 11,
            },
        ],
    },
]

// ─── Scenario 3: WRITE — registrera betalning ───

const registreraBetalning: SimScript = [
    { role: "user", content: "Faktura 2026-042 till Acme är betald" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 700 },
            { type: "tool", name: "get_invoices", duration: 1200, resultLabel: "Hämtade #2026-042" },
            {
                type: "stream",
                text: `Hittade **#2026-042** — Acme AB, **37 500 kr**.\n\nBokför:\n- Debet: **1930** Företagskonto\n- Kredit: **1510** Kundfordringar`,
                speed: 12,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <ConfirmationCard
                        confirmation={{
                            title: "Registrera betalning",
                            description: "Faktura #2026-042 → Betald",
                            summary: [
                                { label: "Faktura", value: "#2026-042 — Acme AB" },
                                { label: "Belopp", value: "37 500 kr" },
                                { label: "Konto debet", value: "1930 Företagskonto" },
                                { label: "Konto kredit", value: "1510 Kundfordringar" },
                                { label: "Betaldatum", value: "2026-04-06" },
                            ],
                            action: { toolName: "book_invoice_payment", params: {} },
                        }}
                        confirmLabel="Registrera betalning"
                        icon={CreditCard}
                        accent="teal"
                        isDone
                        completedAction="booked"
                        completedTitle="Betalning registrerad"
                        onConfirm={() => {}}
                        onCancel={() => {}}
                    />
                ),
            },
            {
                type: "stream",
                text: `**#2026-042** markerad som betald — verifikation **A-53** skapad.`,
                speed: 11,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <InlineCardRenderer card={{ cardType: "verification", data: { id: "v-53", verificationNumber: "A-53", date: "2026-04-06", description: "Betalning faktura #2026-042", amount: 37500 } }} />
                ),
            },
        ],
    },
]

// ─── Scenario 4: WRITE — makulera faktura (amber) ───

const makuleraFaktura: SimScript = [
    { role: "user", content: "Jag behöver makulera faktura 2026-040 till Nordic Design, den var felaktig" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 800 },
            { type: "tool", name: "get_invoices", duration: 1100, resultLabel: "Hämtade #2026-040" },
            {
                type: "stream",
                text: `Hittade **#2026-040** — Nordic Design, **25 000 kr** (Skickad).\n\nSkapar kreditnota som nollställer fakturan + bokför rättelsepost.`,
                speed: 12,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <ConfirmationCard
                        confirmation={{
                            title: "Makulera faktura",
                            description: "Faktura #2026-040 — kreditnota skapas",
                            summary: [
                                { label: "Faktura", value: "#2026-040 — Nordic Design" },
                                { label: "Belopp", value: "25 000 kr" },
                                { label: "Kreditnota", value: "#2026-K001" },
                                { label: "Rättelsepost", value: "Nollställer verifikation A-38" },
                            ],
                            warnings: ["Fakturan är redan skickad till kunden. Kreditnotan bör kommuniceras."],
                            action: { toolName: "void_invoice", params: {} },
                        }}
                        confirmLabel="Makulera"
                        icon={XCircle}
                        accent="amber"
                        isDone
                        completedAction="deleted"
                        completedTitle="Faktura #2026-040 makulerad"
                        onConfirm={() => {}}
                        onCancel={() => {}}
                    />
                ),
            },
            {
                type: "stream",
                text: `Kreditnota **#2026-K001** skapad och rättelsepost bokförd. Verifikation A-38 nollställd.\n\nInformera Nordic Design — kreditnotan ersätter den makulerade fakturan.`,
                speed: 12,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <InlineCardRenderer card={{ cardType: "invoice", data: { id: "i-k001", invoiceNumber: "2026-K001", customer: "Nordic Design", amount: -25000, status: "paid" } }} />
                ),
            },
        ],
    },
]

// ─── Page ───

export default function FakturorStreamingPage() {
    return (
        <ScenarioPage
            title="Fakturor"
            subtitle="Hur Scooby skapar, visar och hanterar fakturor."
            backHref="/test-ui/ai-streaming/bokforing"
            backLabel="Bokföring"
        >
            <Scenario title="Visa fakturor" description="Läs-scenario — lista över fakturor + påminnelse" badges={["Alla"]}>
                <SimulatedConversation script={visaFakturor} />
            </Scenario>

            <Scenario title="Skapa faktura" description="Skriv-scenario — ny kundfaktura med bekräftelse" badges={["Alla"]}>
                <SimulatedConversation script={skapaFaktura} />
            </Scenario>

            <Scenario title="Registrera betalning" description="Skriv-scenario — markera faktura som betald" badges={["Alla"]}>
                <SimulatedConversation script={registreraBetalning} />
            </Scenario>

            <Scenario title="Makulera faktura" description="Skriv-scenario — kreditera och makulera" badges={["Alla"]}>
                <SimulatedConversation script={makuleraFaktura} />
            </Scenario>
        </ScenarioPage>
    )
}
