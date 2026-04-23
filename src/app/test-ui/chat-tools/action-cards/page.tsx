"use client"

import { useState } from "react"
import Link from "next/link"
import {
    ArrowLeft, User, Briefcase, Coins, Mail, Building2, Share2,
    Vote, MapPin, ArrowRight, Percent, Calendar, Receipt, FileText,
    Lock, Trash2, Settings, Users, Calculator,
    Gift, Gavel, Landmark, Package, TrendingDown, Send, RefreshCw, XCircle, Check
} from "lucide-react"
import { ActionConfirmCard, completedActionConfig, type ConfirmationAccent, type CompletedAction } from "@/components/ai/chat-tools/action-cards/action-confirm-card"
import { EntityUpdateCard } from "@/components/ai/chat-tools/action-cards/entity-update-card"
import { ChecklistConfirmCard } from "@/components/ai/chat-tools/action-cards/checklist-confirm-card"
import { BatchBookingCard } from "@/components/ai/chat-tools/action-cards/batch-booking-card"
import { Button } from "@/components/ui"
import { formatCurrency } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

// =============================================================================
// Section 1: Generic action cards
// =============================================================================

const genericConfirmations: Array<{
    label: string
    description: string
    companyTypes: string
    confirmLabel: string
    icon: LucideIcon
    accent: ConfirmationAccent
    completedAction: CompletedAction
    completedTitle: string
    title: string
    subtitle: string
    properties: Array<{ label: string; value: string }>
    warnings?: string[]
}> = [
    {
        label: "Bokför kvitto",
        description: "Standard — ingen varning",
        companyTypes: "Alla",
        confirmLabel: "Bokför",
        icon: Receipt,
        accent: "blue",
        completedAction: "booked",
        completedTitle: "Kvitto bokfört",
        title: "Ny verifikation",
        subtitle: "Inköp kontorsmaterial",
        properties: [
            { label: "Leverantör", value: "Kjell & Company" },
            { label: "Belopp", value: "2 499 kr" },
            { label: "Konto", value: "6110 Kontorsmaterial" },
            { label: "Moms", value: "500 kr (25%)" },
            { label: "Datum", value: "2026-03-28" },
        ],
    },
    {
        label: "Skapa faktura",
        description: "Faktura med förfallodatum",
        companyTypes: "Alla",
        confirmLabel: "Skapa faktura",
        icon: FileText,
        accent: "teal",
        completedAction: "created",
        completedTitle: "Faktura skapad",
        title: "Ny faktura",
        subtitle: "Acme Consulting AB",
        properties: [
            { label: "Kund", value: "Acme Consulting AB" },
            { label: "Belopp", value: "37 500 kr" },
            { label: "Moms", value: "7 500 kr (25%)" },
            { label: "Totalt", value: "45 000 kr" },
            { label: "Förfallodatum", value: "2026-04-15" },
        ],
    },
    {
        label: "Registrera betalning",
        description: "Faktura betald — skapar verifikation",
        companyTypes: "Alla",
        confirmLabel: "Bokför betalning",
        icon: FileText,
        accent: "teal",
        completedAction: "booked",
        completedTitle: "Betalning bokförd",
        title: "Registrera betalning",
        subtitle: "Faktura #2026-042 · Acme Consulting AB",
        properties: [
            { label: "Faktura", value: "#2026-042" },
            { label: "Kund", value: "Acme Consulting AB" },
            { label: "Belopp", value: "45 000 kr" },
            { label: "Konto debet", value: "1930 Företagskonto" },
            { label: "Konto kredit", value: "1510 Kundfordringar" },
            { label: "Betalningsdatum", value: "2026-04-10" },
        ],
    },
    {
        label: "Kör lönekörning",
        description: "AB, HB — anställda",
        companyTypes: "AB, HB",
        confirmLabel: "Kör lönekörning",
        icon: Coins,
        accent: "emerald",
        completedAction: "created",
        completedTitle: "Lönekörning klar",
        title: "Lönekörning mars 2026",
        subtitle: "1 anställd",
        properties: [
            { label: "Anställd", value: "Anna Lindberg" },
            { label: "Bruttolön", value: "42 000 kr" },
            { label: "Skatt (30,62%)", value: "12 860 kr" },
            { label: "Nettolön", value: "29 140 kr" },
            { label: "Arbetsgivaravgift", value: "13 196 kr" },
        ],
    },
    {
        label: "Arbetsgivaravgifter",
        description: "AB, HB — bokför avgifter",
        companyTypes: "AB, HB",
        confirmLabel: "Bokför",
        icon: Calculator,
        accent: "emerald",
        completedAction: "booked",
        completedTitle: "Arbetsgivaravgifter bokförda",
        title: "Arbetsgivaravgifter mars 2026",
        subtitle: "3 anställda · LK-2026-03-01",
        properties: [
            { label: "Underlag", value: "137 460 kr" },
            { label: "Avgiftssats", value: "31,42%" },
            { label: "Arbetsgivaravgifter", value: "43 186 kr" },
            { label: "Konto debet", value: "7510 Arbetsgivaravgifter" },
            { label: "Konto kredit", value: "2730 Lagstadgade sociala avgifter" },
        ],
    },
    {
        label: "Tilldela förmån",
        description: "AB, HB — anställd förmån",
        companyTypes: "AB, HB",
        confirmLabel: "Tilldela",
        icon: Gift,
        accent: "emerald",
        completedAction: "created",
        completedTitle: "Förmån tilldelad",
        title: "Tilldela förmån",
        subtitle: "Anna Lindberg",
        properties: [
            { label: "Anställd", value: "Anna Lindberg" },
            { label: "Förmån", value: "Friskvårdsbidrag" },
            { label: "Belopp", value: "5 000 kr / år" },
            { label: "Startdatum", value: "2026-04-01" },
            { label: "Skattepliktig", value: "Nej (under 5 000 kr)" },
        ],
    },
    {
        label: "Egenavgifter",
        description: "EF — enskild firma",
        companyTypes: "EF",
        confirmLabel: "Bokför",
        icon: Calculator,
        accent: "amber",
        completedAction: "booked",
        completedTitle: "Egenavgifter bokförda",
        title: "Egenavgifter 2025",
        subtitle: "Baserat på årsresultat",
        properties: [
            { label: "Överskott", value: "485 000 kr" },
            { label: "Sjukförsäkringsavgift", value: "16 587 kr" },
            { label: "Ålderspensionsavgift", value: "51 865 kr" },
            { label: "Totala egenavgifter", value: "142 303 kr" },
            { label: "Avgiftssats", value: "28,97%" },
        ],
    },
    {
        label: "Registrera inventarie",
        description: "Ny anläggningstillgång",
        companyTypes: "Alla",
        confirmLabel: "Registrera",
        icon: Package,
        accent: "indigo",
        completedAction: "created",
        completedTitle: "Inventarie registrerad",
        title: "Ny inventarie",
        subtitle: "Kontorsmöbler",
        properties: [
            { label: "Benämning", value: "Skrivbord + kontorsstol" },
            { label: "Anskaffningsvärde", value: "18 500 kr" },
            { label: "Datum", value: "2026-03-15" },
            { label: "Avskrivningstid", value: "5 år" },
            { label: "Konto", value: "1220 Inventarier" },
        ],
    },
    {
        label: "Avskrivning",
        description: "Periodisk avskrivning inventarie",
        companyTypes: "Alla",
        confirmLabel: "Bokför avskrivning",
        icon: TrendingDown,
        accent: "indigo",
        completedAction: "booked",
        completedTitle: "Avskrivning bokförd",
        title: "Avskrivning mars 2026",
        subtitle: "3 inventarier",
        properties: [
            { label: "Inventarier", value: "3 st" },
            { label: "Månatlig avskrivning", value: "2 083 kr" },
            { label: "Konto debet", value: "7832 Avskrivningar inventarier" },
            { label: "Konto kredit", value: "1229 Ack. avskrivningar" },
            { label: "Restvärde efter", value: "142 500 kr" },
        ],
    },
    {
        label: "Stäng period",
        description: "Månadsavslut — lås",
        companyTypes: "Alla",
        confirmLabel: "Stäng mars",
        icon: Lock,
        accent: "amber",
        completedAction: "updated",
        completedTitle: "Mars 2026 stängd",
        title: "Stäng mars 2026",
        subtitle: "Månadsavslut",
        properties: [
            { label: "Period", value: "Mars 2026" },
            { label: "Verifikationer", value: "47 st (A1–A47)" },
            { label: "Intäkter", value: "185 000 kr" },
            { label: "Kostnader", value: "132 400 kr" },
            { label: "Resultat", value: "52 600 kr" },
        ],
        warnings: ["En stängd period kan inte öppnas igen utan revisorsgodkännande."],
    },
    {
        label: "Uppdatera företagsinfo",
        description: "Enkel uppdatering",
        companyTypes: "Alla",
        confirmLabel: "Uppdatera",
        icon: Settings,
        accent: "blue",
        completedAction: "updated",
        completedTitle: "Företagsinfo uppdaterad",
        title: "Uppdatera företagsinfo",
        subtitle: "Scope AI AB",
        properties: [
            { label: "Företag", value: "Scope AI AB" },
            { label: "Ny adress", value: "Kungsgatan 12, 111 35 Stockholm" },
            { label: "Nytt telefonnummer", value: "08-123 45 67" },
        ],
    },
    {
        label: "Skicka AGI",
        description: "Arbetsgivardeklaration till Skatteverket",
        companyTypes: "AB, HB",
        confirmLabel: "Skicka AGI",
        icon: Send,
        accent: "blue",
        completedAction: "created",
        completedTitle: "AGI skickad",
        title: "Skicka AGI april 2026",
        subtitle: "Arbetsgivardeklaration till Skatteverket",
        properties: [
            { label: "Period", value: "April 2026" },
            { label: "Anställda", value: "3 st" },
            { label: "Bruttolöner", value: "125 000 kr" },
            { label: "Skatteavdrag", value: "40 250 kr" },
            { label: "Arbetsgivaravgift", value: "39 275 kr" },
            { label: "Deadline", value: "2026-05-12" },
        ],
    },
    {
        label: "Skicka momsdeklaration",
        description: "Momsdeklaration till Skatteverket",
        companyTypes: "Alla",
        confirmLabel: "Skicka till Skatteverket",
        icon: Send,
        accent: "amber",
        completedAction: "created",
        completedTitle: "Momsdeklaration skickad",
        title: "Momsdeklaration Q1 2026",
        subtitle: "Skicka till Skatteverket",
        properties: [
            { label: "Period", value: "Jan–Mar 2026" },
            { label: "Utgående moms 25%", value: "18 750 kr" },
            { label: "Utgående moms 12%", value: "4 500 kr" },
            { label: "Ingående moms", value: "−11 800 kr" },
            { label: "Att betala", value: "11 450 kr" },
            { label: "Deadline", value: "2026-05-12" },
        ],
    },
    {
        label: "Periodisera",
        description: "Periodisering av kostnad/intäkt över tid",
        companyTypes: "Alla",
        confirmLabel: "Periodisera",
        icon: RefreshCw,
        accent: "blue",
        completedAction: "booked",
        completedTitle: "Periodisering bokförd",
        title: "Periodisera försäkring",
        subtitle: "12 månader, 1 000 kr/mån",
        properties: [
            { label: "Kostnad", value: "12 000 kr" },
            { label: "Period", value: "Apr 2026 – Mar 2027" },
            { label: "Månadsbelopp", value: "1 000 kr/mån" },
            { label: "Konto debet", value: "1720 Förutbetalda kostnader" },
            { label: "Konto kredit", value: "6310 Försäkringspremier" },
        ],
    },
    {
        label: "Makulera faktura",
        description: "Skapar kreditnota — ej samma som makulera verifikation",
        companyTypes: "Alla",
        confirmLabel: "Makulera",
        icon: XCircle,
        accent: "amber",
        completedAction: "deleted",
        completedTitle: "Faktura makulerad",
        title: "Makulera faktura",
        subtitle: "Faktura #2026-040 — kreditnota skapas",
        properties: [
            { label: "Faktura", value: "#2026-040 — Nordic Design" },
            { label: "Belopp", value: "25 000 kr" },
            { label: "Kreditnota", value: "#2026-K001" },
            { label: "Rättelsepost", value: "Nollställer verifikation A-38" },
        ],
        warnings: ["Fakturan är redan skickad till kunden. Kreditnotan bör kommuniceras."],
    },
    {
        label: "Uppdatera anställd",
        description: "Ändra uppgifter för befintlig anställd",
        companyTypes: "AB, HB",
        confirmLabel: "Uppdatera",
        icon: User,
        accent: "emerald",
        completedAction: "updated",
        completedTitle: "Anna Lindberg uppdaterad",
        title: "Uppdatera Anna Lindberg",
        subtitle: "Ändrade uppgifter",
        properties: [
            { label: "Anställd", value: "Anna Lindberg" },
            { label: "Ny titel", value: "Senior Frontend-utvecklare" },
            { label: "Ny lön", value: "46 000 kr/mån" },
            { label: "Gäller från", value: "2026-05-01" },
        ],
    },
    {
        label: "Generera stämmoprotokoll",
        description: "Ordinarie bolagsstämma",
        companyTypes: "AB",
        confirmLabel: "Generera protokoll",
        icon: Gavel,
        accent: "indigo",
        completedAction: "prepared",
        completedTitle: "Stämmoprotokoll genererat",
        title: "Generera stämmoprotokoll",
        subtitle: "Ordinarie bolagsstämma 2026",
        properties: [
            { label: "Bolag", value: "Scope Consulting AB (559123-4567)" },
            { label: "Räkenskapsår", value: "2025" },
            { label: "Typ", value: "Ordinarie bolagsstämma" },
            { label: "Punkter", value: "7 st (standard)" },
            { label: "Format", value: "PDF" },
        ],
    },
    {
        label: "Registrera utbetalning av utdelning",
        description: "Dokumenterar utbetalning — ingen banköverföring",
        companyTypes: "AB",
        confirmLabel: "Registrera utbetalning",
        icon: Coins,
        accent: "purple",
        completedAction: "booked",
        completedTitle: "Utbetalning registrerad",
        title: "Registrera utbetalning av utdelning",
        subtitle: "150 000 kr — Anders Richnau",
        properties: [
            { label: "Mottagare", value: "Anders Richnau (80%)" },
            { label: "Bruttobelopp", value: "150 000 kr" },
            { label: "Preliminärskatt (30%)", value: "−45 000 kr" },
            { label: "Netto", value: "105 000 kr" },
            { label: "Konto debet", value: "2898 Outtagen utdelning" },
            { label: "Konto kredit", value: "1930 Företagskonto" },
        ],
    },
    {
        label: "Uppdatera ägarandelar",
        description: "HB/KB — ny resultatfördelning",
        companyTypes: "HB, KB",
        confirmLabel: "Uppdatera",
        icon: Users,
        accent: "purple",
        completedAction: "updated",
        completedTitle: "Ägarandelar uppdaterade",
        title: "Uppdatera ägarandelar",
        subtitle: "Ny fördelning HB",
        properties: [
            { label: "Erik Svensson", value: "60% → 50%" },
            { label: "Maria Johansson", value: "40% → 50%" },
            { label: "Gäller från", value: "2026-04-14" },
            { label: "Påverkar", value: "Resultatfördelning framåt" },
        ],
        warnings: ["Ägarandelar i HB/KB styr hur resultatet beskattas. Säkerställ att ändringen speglar bolagsavtalet."],
    },
    {
        label: "Makulera verifikation",
        description: "Nollställning — rättelsepost",
        companyTypes: "Alla",
        confirmLabel: "Makulera",
        icon: Trash2,
        accent: "amber",
        completedAction: "deleted",
        completedTitle: "Verifikation makulerad",
        title: "Makulera verifikation",
        subtitle: "A43 — Felaktig bokning",
        properties: [
            { label: "Verifikation", value: "A43" },
            { label: "Beskrivning", value: "Felaktig bokning kontorshyra" },
            { label: "Belopp", value: "8 500 kr" },
            { label: "Datum", value: "2026-03-15" },
        ],
        warnings: ["En rättelsepost skapas som nollställer originalet — verifikationskedjan behålls intakt."],
    },
]

export default function ActionCardsPage() {
    const [genericStates, setGenericStates] = useState<Record<string, "idle" | "loading" | "confirmed" | "cancelled">>({})
    const [domainStates, setDomainStates] = useState<Record<string, "idle" | "loading" | "confirmed">>({})
    const [batchBookingDone, setBatchBookingDone] = useState(false)
    const [batchBookingLoading, setBatchBookingLoading] = useState(false)
    const [batchEmployeeDone, setBatchEmployeeDone] = useState(false)
    const [batchEmployeeLoading, setBatchEmployeeLoading] = useState(false)

    const getGeneric = (key: string) => genericStates[key] || "idle"
    const setGeneric = (key: string, state: "idle" | "loading" | "confirmed" | "cancelled") =>
        setGenericStates(s => ({ ...s, [key]: state }))

    const getDomain = (key: string) => domainStates[key] || "idle"
    const setDomain = (key: string, state: "idle" | "loading" | "confirmed") =>
        setDomainStates(s => ({ ...s, [key]: state }))

    const handleDomainConfirm = (key: string) => {
        setDomain(key, "loading")
        setTimeout(() => setDomain(key, "confirmed"), 1200)
    }

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

                {/* === SECTION 1: Generic action cards === */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight mb-1">Action Cards</h1>
                    <p className="text-sm text-muted-foreground mb-8">
                        Kort som ändrar data — bokföring, lön, fakturor, ägare. Alla kräver bekräftelse i fas 1, visar kvitto i fas 2.
                    </p>

                    <div className="space-y-8">
                        {genericConfirmations.map((item, i) => {
                            const key = `generic-${i}`
                            const state = getGeneric(key)
                            return (
                                <div key={i} className="space-y-2">
                                    <div className="flex items-baseline gap-2">
                                        <h3 className="text-sm font-semibold">{item.label}</h3>
                                        <span className="text-xs text-muted-foreground">{item.description}</span>
                                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{item.companyTypes}</span>
                                    </div>
                                    {state === "cancelled" ? (
                                        <div className="max-w-md py-2">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <span>Avbruten</span>
                                                <button className="text-xs underline ml-auto" onClick={() => setGeneric(key, "idle")}>Återställ</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="max-w-lg">
                                            <ActionConfirmCard
                                                title={item.title}
                                                description={item.subtitle}
                                                icon={item.icon}
                                                accent={item.accent}
                                                properties={item.properties}
                                                confirmLabel={item.confirmLabel}
                                                isDone={state === "confirmed"}
                                                isLoading={state === "loading"}
                                                completedAction={item.completedAction}
                                                completedTitle={item.completedTitle}
                                                onConfirm={() => { setGeneric(key, "loading"); setTimeout(() => setGeneric(key, "confirmed"), 1200) }}
                                                onCancel={() => setGeneric(key, "cancelled")}
                                                onReset={() => setGeneric(key, "idle")}
                                            />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* === SECTION 2: Entity registration cards === */}
                <div className="border-t pt-12">
                    <h2 className="text-xl font-bold tracking-tight mb-1">Entitetsregistrering</h2>
                    <p className="text-sm text-muted-foreground mb-8">
                        Anställda, ägare, partners, kunder, möten — ikonrader med bekräftelse.
                    </p>

                    <div className="space-y-8">

                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Anställd</h3>
                                <span className="text-xs text-muted-foreground">Ny anställd</span>
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">AB, HB</span>
                            </div>
                            <div className="max-w-lg">
                                <EntityUpdateCard
                                    title="Ny anställd"
                                    subtitle="Registrera i systemet"
                                    headerIcon={User}
                                    accent="green"
                                    items={[
                                        { icon: User, text: "Anna Lindberg", bold: true },
                                        { icon: Briefcase, text: "Frontend-utvecklare" },
                                        { icon: Coins, text: `${formatCurrency(45000)} / mån` },
                                        { icon: Mail, text: "anna.lindberg@example.com" },
                                        { icon: MapPin, text: "Stockholm (skattesats 30,62%)" },
                                    ]}
                                    confirmLabel="Registrera"
                                    isDone={getDomain("employee") === "confirmed"}
                                    isLoading={getDomain("employee") === "loading"}
                                    completedAction="created"
                                    completedTitle="Anna Lindberg registrerad"
                                    onConfirm={() => handleDomainConfirm("employee")}
                                    onCancel={() => {}}
                                    onReset={() => setDomain("employee", "idle")}
                                />
                            </div>
                        </div>

                        {/* Removed legacy EmployeeCard section */}

                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Ägare / Aktieägare</h3>
                                <span className="text-xs text-muted-foreground">Aktieinnehav</span>
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">AB</span>
                            </div>
                            <div className="max-w-lg">
                                <EntityUpdateCard
                                    title="Ny ägare"
                                    subtitle="Registrera i aktiebok"
                                    headerIcon={Landmark}
                                    accent="purple"
                                    items={[
                                        { icon: User, text: "Erik Svensson", bold: true },
                                        { icon: Briefcase, text: "VD & Styrelseordförande" },
                                        { icon: Share2, text: "600 aktier (60%) · Stamaktier A" },
                                        { icon: Vote, text: "600 röster" },
                                        { icon: MapPin, text: "Stockholm (skattesats 30,62%)" },
                                    ]}
                                    confirmLabel="Registrera"
                                    isDone={getDomain("owner-ab") === "confirmed"}
                                    isLoading={getDomain("owner-ab") === "loading"}
                                    completedAction="created"
                                    completedTitle="Erik Svensson registrerad"
                                    onConfirm={() => handleDomainConfirm("owner-ab")}
                                    onCancel={() => {}}
                                    onReset={() => setDomain("owner-ab", "idle")}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Delägare (HB/KB)</h3>
                                <span className="text-xs text-muted-foreground">Vinstandel</span>
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">HB, KB</span>
                            </div>
                            <div className="max-w-lg">
                                <EntityUpdateCard
                                    title="Ny delägare"
                                    subtitle="Registrera i bolagsavtal"
                                    headerIcon={Users}
                                    accent="purple"
                                    items={[
                                        { icon: User, text: "Maria Johansson", bold: true },
                                        { icon: Briefcase, text: "Delägare" },
                                        { icon: Percent, text: "40% vinstandel" },
                                        { icon: Coins, text: `Kapitalinsats: ${formatCurrency(100000)}` },
                                        { icon: MapPin, text: "Göteborg (skattesats 32,89%)" },
                                    ]}
                                    confirmLabel="Registrera"
                                    isDone={getDomain("partner-hb") === "confirmed"}
                                    isLoading={getDomain("partner-hb") === "loading"}
                                    completedAction="created"
                                    completedTitle="Maria Johansson registrerad"
                                    onConfirm={() => handleDomainConfirm("partner-hb")}
                                    onCancel={() => {}}
                                    onReset={() => setDomain("partner-hb", "idle")}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Medlem</h3>
                                <span className="text-xs text-muted-foreground">Ny föreningsmedlem</span>
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Förening</span>
                            </div>
                            <div className="max-w-lg">
                                <EntityUpdateCard
                                    title="Ny medlem"
                                    subtitle="Registrera i medlemsregister"
                                    headerIcon={Users}
                                    accent="green"
                                    items={[
                                        { icon: User, text: "Lars Eriksson", bold: true },
                                        { icon: Mail, text: "lars.eriksson@example.com" },
                                        { icon: Coins, text: `Årsavgift: ${formatCurrency(500)}` },
                                        { icon: Calendar, text: "Startdatum: 2026-04-01" },
                                    ]}
                                    confirmLabel="Registrera"
                                    isDone={getDomain("member") === "confirmed"}
                                    isLoading={getDomain("member") === "loading"}
                                    completedAction="created"
                                    completedTitle="Lars Eriksson registrerad"
                                    onConfirm={() => handleDomainConfirm("member")}
                                    onCancel={() => {}}
                                    onReset={() => setDomain("member", "idle")}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Kund</h3>
                                <span className="text-xs text-muted-foreground">Fakturering</span>
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Alla</span>
                            </div>
                            <div className="max-w-lg">
                                <EntityUpdateCard
                                    title="Ny kund"
                                    subtitle="Lägg till i kundregister"
                                    headerIcon={Building2}
                                    accent="teal"
                                    items={[
                                        { icon: Building2, text: "Acme Consulting AB", bold: true },
                                        { icon: Briefcase, text: "559876-5432" },
                                        { icon: Mail, text: "faktura@acmeconsulting.se" },
                                        { icon: MapPin, text: "Sveavägen 44, 111 34 Stockholm" },
                                    ]}
                                    confirmLabel="Lägg till"
                                    isDone={getDomain("customer") === "confirmed"}
                                    isLoading={getDomain("customer") === "loading"}
                                    completedAction="created"
                                    completedTitle="Acme Consulting AB tillagd"
                                    onConfirm={() => handleDomainConfirm("customer")}
                                    onCancel={() => {}}
                                    onReset={() => setDomain("customer", "idle")}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Utdelningsbeslut</h3>
                                <span className="text-xs text-muted-foreground">Equity check</span>
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">AB</span>
                            </div>
                            <div className="max-w-lg">
                                <ActionConfirmCard
                                    title="Utdelningsbeslut 2025"
                                    description="Scope AI AB"
                                    icon={Coins}
                                    accent="amber"
                                    properties={[
                                        { label: "Fritt eget kapital", value: "820 000 kr" },
                                        { label: "Antal aktier", value: "1 000 st" },
                                        { label: "Utdelning / aktie", value: "150 kr" },
                                        { label: "Total utdelning", value: formatCurrency(150000) },
                                        { label: "Kvarvarande kapital", value: formatCurrency(670000) },
                                    ]}
                                    confirmLabel="Besluta utdelning"
                                    isDone={getDomain("dividend-decision") === "confirmed"}
                                    isLoading={getDomain("dividend-decision") === "loading"}
                                    completedAction="prepared"
                                    completedTitle="Utdelningsbeslut fattat"
                                    onConfirm={() => handleDomainConfirm("dividend-decision")}
                                    onCancel={() => {}}
                                    onReset={() => setDomain("dividend-decision", "idle")}
                                />
                                {getDomain("dividend-decision") !== "confirmed" && (
                                    <div className="flex items-start gap-2 text-xs text-emerald-600 dark:text-emerald-500 pt-2 max-w-md">
                                        <Check className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                        <span>Försiktighetsregeln uppfylld — fritt eget kapital täcker utdelningen.</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Bokför utdelning</h3>
                                <span className="text-xs text-muted-foreground">Beslutad → Bokförd</span>
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">AB</span>
                            </div>
                            <div className="max-w-lg">
                                <ActionConfirmCard
                                    title="Bokför utdelning 2025"
                                    description="Scope AI AB"
                                    icon={Coins}
                                    accent="amber"
                                    properties={[
                                        { label: "Total utdelning", value: formatCurrency(150000) },
                                        { label: "Antal aktieägare", value: "2 st" },
                                        { label: "Konto debet", value: "2098 Utdelning" },
                                        { label: "Konto kredit", value: "2898 Skuld utdelning" },
                                        { label: "Beslutsdatum", value: "2026-03-15" },
                                    ]}
                                    confirmLabel="Bokför utdelning"
                                    isDone={getDomain("dividend-book") === "confirmed"}
                                    isLoading={getDomain("dividend-book") === "loading"}
                                    completedAction="booked"
                                    completedTitle="Utdelning bokförd"
                                    onConfirm={() => handleDomainConfirm("dividend-book")}
                                    onCancel={() => {}}
                                    onReset={() => setDomain("dividend-book", "idle")}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Aktieöverlåtelse</h3>
                                <span className="text-xs text-muted-foreground">Överlåtelse</span>
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">AB</span>
                            </div>
                            <div className="max-w-lg">
                                <EntityUpdateCard
                                    title="Aktieöverlåtelse"
                                    subtitle="Scope AI AB"
                                    headerIcon={ArrowRight}
                                    accent="purple"
                                    items={[
                                        { icon: User, text: "Från: Erik Svensson (600 → 500)" },
                                        { icon: ArrowRight, text: "Till: Tech Invest AB (150 → 250)" },
                                        { icon: Share2, text: "100 aktier · Stamaktier A · Nr 501–600" },
                                        { icon: Coins, text: `Köpeskilling: ${formatCurrency(250000)}` },
                                        { icon: Calendar, text: "Tillträde: 2026-04-01" },
                                    ]}
                                    confirmLabel="Genomför överlåtelse"
                                    isDone={getDomain("share-transfer") === "confirmed"}
                                    isLoading={getDomain("share-transfer") === "loading"}
                                    completedAction="updated"
                                    completedTitle="Överlåtelse genomförd"
                                    onConfirm={() => handleDomainConfirm("share-transfer")}
                                    onCancel={() => {}}
                                    onReset={() => setDomain("share-transfer", "idle")}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Delägarinsättning</h3>
                                <span className="text-xs text-muted-foreground">Kapitalinsättning i HB/KB</span>
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">HB, KB</span>
                            </div>
                            <div className="max-w-lg">
                                <ActionConfirmCard
                                    title="Registrera insättning"
                                    description="Erik Svensson"
                                    icon={Coins}
                                    accent="purple"
                                    properties={[
                                        { label: "Delägare", value: "Erik Svensson (60%)" },
                                        { label: "Belopp", value: formatCurrency(50000) },
                                        { label: "Konto debet", value: "1930 Företagskonto" },
                                        { label: "Konto kredit", value: "2010 Eget kapital" },
                                        { label: "Datum", value: "2026-04-14" },
                                    ]}
                                    confirmLabel="Registrera insättning"
                                    isDone={getDomain("partner-deposit") === "confirmed"}
                                    isLoading={getDomain("partner-deposit") === "loading"}
                                    completedAction="booked"
                                    completedTitle="Insättning registrerad"
                                    onConfirm={() => handleDomainConfirm("partner-deposit")}
                                    onCancel={() => {}}
                                    onReset={() => setDomain("partner-deposit", "idle")}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Delägaruttag</h3>
                                <span className="text-xs text-muted-foreground">Uttag ur HB/KB</span>
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">HB, KB</span>
                            </div>
                            <div className="max-w-lg">
                                <ActionConfirmCard
                                    title="Registrera uttag"
                                    description="Maria Johansson"
                                    icon={Coins}
                                    accent="purple"
                                    properties={[
                                        { label: "Delägare", value: "Maria Johansson (40%)" },
                                        { label: "Belopp", value: formatCurrency(25000) },
                                        { label: "Konto debet", value: "2010 Eget kapital" },
                                        { label: "Konto kredit", value: "1930 Företagskonto" },
                                        { label: "Datum", value: "2026-04-14" },
                                    ]}
                                    confirmLabel="Registrera uttag"
                                    isDone={getDomain("partner-withdrawal") === "confirmed"}
                                    isLoading={getDomain("partner-withdrawal") === "loading"}
                                    completedAction="booked"
                                    completedTitle="Uttag registrerat"
                                    onConfirm={() => handleDomainConfirm("partner-withdrawal")}
                                    onCancel={() => {}}
                                    onReset={() => setDomain("partner-withdrawal", "idle")}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Ägaruttag</h3>
                                <span className="text-xs text-muted-foreground">Eget uttag</span>
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">EF</span>
                            </div>
                            <div className="max-w-lg">
                                <ActionConfirmCard
                                    title="Eget uttag"
                                    description="2026-03-28"
                                    icon={Coins}
                                    accent="amber"
                                    properties={[
                                        { label: "Ägare", value: "Johan Berg" },
                                        { label: "Belopp", value: formatCurrency(25000) },
                                        { label: "Konto debet", value: "2013 Eget uttag" },
                                        { label: "Konto kredit", value: "1930 Företagskonto" },
                                    ]}
                                    confirmLabel="Bokför"
                                    isDone={getDomain("owner-withdrawal") === "confirmed"}
                                    isLoading={getDomain("owner-withdrawal") === "loading"}
                                    completedAction="booked"
                                    completedTitle="Uttag bokfört"
                                    onConfirm={() => handleDomainConfirm("owner-withdrawal")}
                                    onCancel={() => {}}
                                    onReset={() => setDomain("owner-withdrawal", "idle")}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Tilldela roll</h3>
                                <span className="text-xs text-muted-foreground">Styrelsepost</span>
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">AB, Förening</span>
                            </div>
                            <div className="max-w-lg">
                                <EntityUpdateCard
                                    title="Tilldela roll"
                                    subtitle="Styrelsepost"
                                    headerIcon={Gavel}
                                    accent="indigo"
                                    items={[
                                        { icon: User, text: "Maria Johansson", bold: true },
                                        { icon: Briefcase, text: "Styrelseledamot" },
                                        { icon: Calendar, text: "Tillträde: 2026-04-15" },
                                        { icon: Gavel, text: "Registreras hos Bolagsverket" },
                                    ]}
                                    confirmLabel="Tilldela"
                                    isDone={getDomain("assign-role") === "confirmed"}
                                    isLoading={getDomain("assign-role") === "loading"}
                                    completedAction="updated"
                                    completedTitle="Roll tilldelad"
                                    onConfirm={() => handleDomainConfirm("assign-role")}
                                    onCancel={() => {}}
                                    onReset={() => setDomain("assign-role", "idle")}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Planera möte</h3>
                                <span className="text-xs text-muted-foreground">Stämma / styrelsemöte</span>
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">AB, Förening</span>
                            </div>
                            <div className="max-w-lg">
                                <EntityUpdateCard
                                    title="Nytt styrelsemöte"
                                    subtitle="Möte 4/2026"
                                    headerIcon={Calendar}
                                    accent="indigo"
                                    items={[
                                        { icon: Calendar, text: "2026-05-15 kl. 14:00" },
                                        { icon: MapPin, text: "Kungsgatan 12, Stockholm" },
                                        { icon: Users, text: "4 ledamöter kallade" },
                                        { icon: FileText, text: "Dagordning: 7 punkter" },
                                    ]}
                                    confirmLabel="Skapa möte"
                                    isDone={getDomain("meeting") === "confirmed"}
                                    isLoading={getDomain("meeting") === "loading"}
                                    completedAction="created"
                                    completedTitle="Möte skapat"
                                    onConfirm={() => handleDomainConfirm("meeting")}
                                    onCancel={() => {}}
                                    onReset={() => setDomain("meeting", "idle")}
                                />
                            </div>
                        </div>

                    </div>
                </div>

                {/* === SECTION 3: Batch action cards === */}
                <div className="border-t pt-12">
                    <h2 className="text-xl font-bold tracking-tight mb-1">Batchåtgärder</h2>
                    <p className="text-sm text-muted-foreground mb-8">
                        Scooby och användaren diskuterar först i chatten. När allt är klart
                        skickar Scooby en slutgiltig lista — användaren bekräftar, sedan utförs ändringarna.
                    </p>

                    <div className="space-y-12">

                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Batchbokföring</h3>
                                <span className="text-xs text-muted-foreground">Alla, t.ex. efter kvittouppladdning</span>
                            </div>
                            <div className="max-w-lg">
                                <BatchBookingCard
                                    title="Bokför 4 kvitton"
                                    description="Granska innan bokföring"
                                    icon={Receipt}
                                    accent="blue"
                                    items={[
                                        { id: "1", title: "Postnord — Porto", subtitle: "6250 Porto · Moms 18 kr · 2026-03-22", rightValue: "89 kr" },
                                        { id: "2", title: "Kjell & Co — Kontorsmaterial", subtitle: "6110 Kontorsmaterial · Moms 500 kr · 2026-03-25", rightValue: "2 499 kr" },
                                        { id: "3", title: "AWS — Serverhosting", subtitle: "6540 IT-tjänster · Moms 840 kr · 2026-03-01", rightValue: "4 200 kr" },
                                        { id: "4", title: "Webhallen — Datorutrustning", subtitle: "1250 Datorer · Moms 2 580 kr · 2026-03-18", rightValue: "12 900 kr" },
                                    ]}
                                    totalAmount="19 688 kr"
                                    confirmLabel="Bokför alla"
                                    isDone={batchBookingDone}
                                    isLoading={batchBookingLoading}
                                    completedAction="booked"
                                    completedTitle="4 kvitton bokförda"
                                    onConfirm={() => { setBatchBookingLoading(true); setTimeout(() => { setBatchBookingLoading(false); setBatchBookingDone(true) }, 1400) }}
                                    onCancel={() => {}}
                                    onReset={() => setBatchBookingDone(false)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Statusändring — anställda</h3>
                                <span className="text-xs text-muted-foreground">Alla, efter diskussion i chatten</span>
                            </div>
                            <div className="max-w-lg">
                                <ChecklistConfirmCard
                                    title="Uppdatera 3 anställda"
                                    description="Ändra status enligt vad vi diskuterade"
                                    icon={Users}
                                    accent="emerald"
                                    items={[
                                        { id: "a", label: "Anna Lindberg", description: "Kommun: Stockholm. Skattetabell kolumn 1 inlagd.", fromBadge: { label: "Ny", className: "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400" }, badge: { label: "Aktiv", className: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" } },
                                        { id: "b", label: "Johan Berg", description: "Kommun: Göteborg. Skattetabell kolumn 1 inlagd.", fromBadge: { label: "Ny", className: "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400" }, badge: { label: "Aktiv", className: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" } },
                                        { id: "c", label: "Maria Svensson", description: "Startdatum 2026-04-15. Ersättning via FK.", fromBadge: { label: "Aktiv", className: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" }, badge: { label: "Föräldraledig", className: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400" } },
                                    ]}
                                    confirmLabel="Uppdatera valda"
                                    isDone={batchEmployeeDone}
                                    isLoading={batchEmployeeLoading}
                                    completedAction="updated"
                                    completedTitle="3 anställda uppdaterade"
                                    onConfirm={() => { setBatchEmployeeLoading(true); setTimeout(() => { setBatchEmployeeLoading(false); setBatchEmployeeDone(true) }, 1200) }}
                                    onCancel={() => {}}
                                    onReset={() => setBatchEmployeeDone(false)}
                                />
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    )
}
