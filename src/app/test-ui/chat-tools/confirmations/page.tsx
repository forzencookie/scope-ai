"use client"

import { useState } from "react"
import Link from "next/link"
import {
    ArrowLeft, Check, User, Briefcase, Coins, Mail, Building2, Share2,
    Vote, MapPin, ArrowRight, Percent, Calendar, Receipt, FileText,
    Lock, Trash2, Settings, Users, Calculator,
    Gift, Gavel, Landmark, Package, TrendingDown, Send, RefreshCw, XCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ConfirmationCard, completedActionConfig, type ConfirmationAccent, type CompletedAction } from "@/components/ai/confirmations/confirmation-card"
import { BatchConfirmationCard } from "@/components/ai/confirmations/batch-confirmation-card"
import { ActionTriggerChip } from "@/components/ai/confirmations/action-trigger-chip"
import { ComparisonTable } from "@/components/ai/confirmations/comparison-table"
import { EmployeeCard } from "@/components/ai/cards/EmployeeCard"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

/**
 * Test page: Confirmation & Interaction UI
 *
 * Complete confirmation catalog across all company types.
 * Every mutation Scooby performs requires user confirmation.
 *
 * Sections:
 * 1. Generic confirmations — ConfirmationCard with icon + accent color
 * 2. Domain-specific — custom layouts (verification table, employee icons, etc.)
 * 3. Batch confirmations — table + checklist after chat discussion
 */

// =============================================================================
// Section 1: Generic confirmations
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
    confirmation: {
        title: string
        description: string
        summary: Array<{ label: string; value: string }>
        warnings?: string[]
        action: { toolName: string; params: Record<string, unknown> }
    }
}> = [
    // --- Bokföring (blue) ---
    {
        label: "Bokför kvitto",
        description: "Standard — ingen varning",
        companyTypes: "Alla",
        confirmLabel: "Bokför",
        icon: Receipt,
        accent: "blue",
        completedAction: "booked",
        completedTitle: "Kvitto bokfört",
        confirmation: {
            title: "Ny verifikation",
            description: "Inköp kontorsmaterial",
            summary: [
                { label: "Leverantör", value: "Kjell & Company" },
                { label: "Belopp", value: "2 499 kr" },
                { label: "Konto", value: "6110 Kontorsmaterial" },
                { label: "Moms", value: "500 kr (25%)" },
                { label: "Datum", value: "2026-03-28" },
            ],
            action: { toolName: "create_verification", params: {} },
        },
    },
    // --- Faktura (teal) ---
    {
        label: "Skapa faktura",
        description: "Faktura med förfallodatum",
        companyTypes: "Alla",
        confirmLabel: "Skapa faktura",
        icon: FileText,
        accent: "teal",
        completedAction: "created",
        completedTitle: "Faktura skapad",
        confirmation: {
            title: "Ny faktura",
            description: "Acme Consulting AB",
            summary: [
                { label: "Kund", value: "Acme Consulting AB" },
                { label: "Belopp", value: "37 500 kr" },
                { label: "Moms", value: "7 500 kr (25%)" },
                { label: "Totalt", value: "45 000 kr" },
                { label: "Förfallodatum", value: "2026-04-15" },
            ],
            action: { toolName: "create_invoice", params: {} },
        },
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
        confirmation: {
            title: "Registrera betalning",
            description: "Faktura #2026-042 · Acme Consulting AB",
            summary: [
                { label: "Faktura", value: "#2026-042" },
                { label: "Kund", value: "Acme Consulting AB" },
                { label: "Belopp", value: "45 000 kr" },
                { label: "Konto debet", value: "1930 Företagskonto" },
                { label: "Konto kredit", value: "1510 Kundfordringar" },
                { label: "Betalningsdatum", value: "2026-04-10" },
            ],
            action: { toolName: "register_invoice_payment", params: {} },
        },
    },
    // --- Löner (emerald) ---
    {
        label: "Kör lönekörning",
        description: "AB, HB — anställda",
        companyTypes: "AB, HB",
        confirmLabel: "Kör lönekörning",
        icon: Coins,
        accent: "emerald",
        completedAction: "created",
        completedTitle: "Lönekörning klar",
        confirmation: {
            title: "Lönekörning mars 2026",
            description: "1 anställd",
            summary: [
                { label: "Anställd", value: "Anna Lindberg" },
                { label: "Bruttolön", value: "42 000 kr" },
                { label: "Skatt (30,62%)", value: "12 860 kr" },
                { label: "Nettolön", value: "29 140 kr" },
                { label: "Arbetsgivaravgift", value: "13 196 kr" },
            ],
            action: { toolName: "run_payroll", params: {} },
        },
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
        confirmation: {
            title: "Arbetsgivaravgifter mars 2026",
            description: "3 anställda · LK-2026-03-01",
            summary: [
                { label: "Underlag", value: "137 460 kr" },
                { label: "Avgiftssats", value: "31,42%" },
                { label: "Arbetsgivaravgifter", value: "43 186 kr" },
                { label: "Konto debet", value: "7510 Arbetsgivaravgifter" },
                { label: "Konto kredit", value: "2730 Lagstadgade sociala avgifter" },
            ],
            action: { toolName: "create_verification", params: {} },
        },
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
        confirmation: {
            title: "Tilldela förmån",
            description: "Anna Lindberg",
            summary: [
                { label: "Anställd", value: "Anna Lindberg" },
                { label: "Förmån", value: "Friskvårdsbidrag" },
                { label: "Belopp", value: "5 000 kr / år" },
                { label: "Startdatum", value: "2026-04-01" },
                { label: "Skattepliktig", value: "Nej (under 5 000 kr)" },
            ],
            action: { toolName: "assign_benefit", params: {} },
        },
    },
    // --- Egenavgifter (amber) ---
    {
        label: "Egenavgifter",
        description: "EF — enskild firma",
        companyTypes: "EF",
        confirmLabel: "Bokför",
        icon: Calculator,
        accent: "amber",
        completedAction: "booked",
        completedTitle: "Egenavgifter bokförda",
        confirmation: {
            title: "Egenavgifter 2025",
            description: "Baserat på årsresultat",
            summary: [
                { label: "Överskott", value: "485 000 kr" },
                { label: "Sjukförsäkringsavgift", value: "16 587 kr" },
                { label: "Ålderspensionsavgift", value: "51 865 kr" },
                { label: "Totala egenavgifter", value: "142 303 kr" },
                { label: "Avgiftssats", value: "28,97%" },
            ],
            action: { toolName: "book_egenavgifter", params: {} },
        },
    },
    // --- Inventarier (indigo) ---
    {
        label: "Registrera inventarie",
        description: "Ny anläggningstillgång",
        companyTypes: "Alla",
        confirmLabel: "Registrera",
        icon: Package,
        accent: "indigo",
        completedAction: "created",
        completedTitle: "Inventarie registrerad",
        confirmation: {
            title: "Ny inventarie",
            description: "Kontorsmöbler",
            summary: [
                { label: "Benämning", value: "Skrivbord + kontorsstol" },
                { label: "Anskaffningsvärde", value: "18 500 kr" },
                { label: "Datum", value: "2026-03-15" },
                { label: "Avskrivningstid", value: "5 år" },
                { label: "Konto", value: "1220 Inventarier" },
            ],
            action: { toolName: "register_asset", params: {} },
        },
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
        confirmation: {
            title: "Avskrivning mars 2026",
            description: "3 inventarier",
            summary: [
                { label: "Inventarier", value: "3 st" },
                { label: "Månatlig avskrivning", value: "2 083 kr" },
                { label: "Konto debet", value: "7832 Avskrivningar inventarier" },
                { label: "Konto kredit", value: "1229 Ack. avskrivningar" },
                { label: "Restvärde efter", value: "142 500 kr" },
            ],
            action: { toolName: "book_depreciation", params: {} },
        },
    },
    // --- Period (amber) ---
    {
        label: "Stäng period",
        description: "Månadsavslut — lås",
        companyTypes: "Alla",
        confirmLabel: "Stäng mars",
        icon: Lock,
        accent: "amber",
        completedAction: "updated",
        completedTitle: "Mars 2026 stängd",
        confirmation: {
            title: "Stäng mars 2026",
            description: "Månadsavslut",
            summary: [
                { label: "Period", value: "Mars 2026" },
                { label: "Verifikationer", value: "47 st (A1–A47)" },
                { label: "Intäkter", value: "185 000 kr" },
                { label: "Kostnader", value: "132 400 kr" },
                { label: "Resultat", value: "52 600 kr" },
            ],
            warnings: [
                "En stängd period kan inte öppnas igen utan revisorsgodkännande.",
            ],
            action: { toolName: "close_period", params: {} },
        },
    },
    // --- Uppdatera (blue) ---
    {
        label: "Uppdatera företagsinfo",
        description: "Enkel uppdatering",
        companyTypes: "Alla",
        confirmLabel: "Uppdatera",
        icon: Settings,
        accent: "blue",
        completedAction: "updated",
        completedTitle: "Företagsinfo uppdaterad",
        confirmation: {
            title: "Uppdatera företagsinfo",
            description: "Scope AI AB",
            summary: [
                { label: "Företag", value: "Scope AI AB" },
                { label: "Ny adress", value: "Kungsgatan 12, 111 35 Stockholm" },
                { label: "Nytt telefonnummer", value: "08-123 45 67" },
            ],
            action: { toolName: "update_company_info", params: {} },
        },
    },
    // --- Rapporter / Deklarationer (blue/amber) ---
    {
        label: "Skicka AGI",
        description: "Arbetsgivardeklaration till Skatteverket",
        companyTypes: "AB, HB",
        confirmLabel: "Skicka AGI",
        icon: Send,
        accent: "blue",
        completedAction: "created",
        completedTitle: "AGI skickad",
        confirmation: {
            title: "Skicka AGI april 2026",
            description: "Arbetsgivardeklaration till Skatteverket",
            summary: [
                { label: "Period", value: "April 2026" },
                { label: "Anställda", value: "3 st" },
                { label: "Bruttolöner", value: "125 000 kr" },
                { label: "Skatteavdrag", value: "40 250 kr" },
                { label: "Arbetsgivaravgift", value: "39 275 kr" },
                { label: "Deadline", value: "2026-05-12" },
            ],
            action: { toolName: "submit_agi", params: {} },
        },
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
        confirmation: {
            title: "Momsdeklaration Q1 2026",
            description: "Skicka till Skatteverket",
            summary: [
                { label: "Period", value: "Jan–Mar 2026" },
                { label: "Utgående moms 25%", value: "18 750 kr" },
                { label: "Utgående moms 12%", value: "4 500 kr" },
                { label: "Ingående moms", value: "−11 800 kr" },
                { label: "Att betala", value: "11 450 kr" },
                { label: "Deadline", value: "2026-05-12" },
            ],
            action: { toolName: "submit_vat_declaration", params: {} },
        },
    },
    // --- Händelser (blue) ---
    {
        label: "Periodisera",
        description: "Periodisering av kostnad/intäkt över tid",
        companyTypes: "Alla",
        confirmLabel: "Periodisera",
        icon: RefreshCw,
        accent: "blue",
        completedAction: "booked",
        completedTitle: "Periodisering bokförd",
        confirmation: {
            title: "Periodisera försäkring",
            description: "12 månader, 1 000 kr/mån",
            summary: [
                { label: "Kostnad", value: "12 000 kr" },
                { label: "Period", value: "Apr 2026 – Mar 2027" },
                { label: "Månadsbelopp", value: "1 000 kr/mån" },
                { label: "Konto debet", value: "1720 Förutbetalda kostnader" },
                { label: "Konto kredit", value: "6310 Försäkringspremier" },
            ],
            action: { toolName: "create_verification", params: {} },
        },
    },
    // --- Fakturor (teal) ---
    {
        label: "Makulera faktura",
        description: "Skapar kreditnota — ej samma som makulera verifikation",
        companyTypes: "Alla",
        confirmLabel: "Makulera",
        icon: XCircle,
        accent: "amber",
        completedAction: "deleted",
        completedTitle: "Faktura makulerad",
        confirmation: {
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
        },
    },
    // --- Löner / Anställda (emerald) ---
    {
        label: "Uppdatera anställd",
        description: "Ändra uppgifter för befintlig anställd",
        companyTypes: "AB, HB",
        confirmLabel: "Uppdatera",
        icon: User,
        accent: "emerald",
        completedAction: "updated",
        completedTitle: "Anna Lindberg uppdaterad",
        confirmation: {
            title: "Uppdatera Anna Lindberg",
            description: "Ändrade uppgifter",
            summary: [
                { label: "Anställd", value: "Anna Lindberg" },
                { label: "Ny titel", value: "Senior Frontend-utvecklare" },
                { label: "Ny lön", value: "46 000 kr/mån" },
                { label: "Gäller från", value: "2026-05-01" },
            ],
            action: { toolName: "update_employee", params: {} },
        },
    },
    // --- Ägare (purple) ---
    {
        label: "Generera stämmoprotokoll",
        description: "Ordinarie bolagsstämma",
        companyTypes: "AB",
        confirmLabel: "Generera protokoll",
        icon: Gavel,
        accent: "indigo",
        completedAction: "prepared",
        completedTitle: "Stämmoprotokoll genererat",
        confirmation: {
            title: "Generera stämmoprotokoll",
            description: "Ordinarie bolagsstämma 2026",
            summary: [
                { label: "Bolag", value: "Scope Consulting AB (559123-4567)" },
                { label: "Räkenskapsår", value: "2025" },
                { label: "Typ", value: "Ordinarie bolagsstämma" },
                { label: "Punkter", value: "7 st (standard)" },
                { label: "Format", value: "PDF" },
            ],
            action: { toolName: "generate_agm_protocol", params: {} },
        },
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
        confirmation: {
            title: "Registrera utbetalning av utdelning",
            description: "150 000 kr — Anders Richnau",
            summary: [
                { label: "Mottagare", value: "Anders Richnau (80%)" },
                { label: "Bruttobelopp", value: "150 000 kr" },
                { label: "Preliminärskatt (30%)", value: "−45 000 kr" },
                { label: "Netto", value: "105 000 kr" },
                { label: "Konto debet", value: "2898 Outtagen utdelning" },
                { label: "Konto kredit", value: "1930 Företagskonto" },
            ],
            action: { toolName: "register_dividend_payout", params: {} },
        },
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
        confirmation: {
            title: "Uppdatera ägarandelar",
            description: "Ny fördelning HB",
            summary: [
                { label: "Erik Svensson", value: "60% → 50%" },
                { label: "Maria Johansson", value: "40% → 50%" },
                { label: "Gäller från", value: "2026-04-14" },
                { label: "Påverkar", value: "Resultatfördelning framåt" },
            ],
            warnings: ["Ägarandelar i HB/KB styr hur resultatet beskattas. Säkerställ att ändringen speglar bolagsavtalet."],
            action: { toolName: "update_ownership", params: {} },
        },
    },
    // --- Makulera (amber) ---
    {
        label: "Makulera verifikation",
        description: "Nollställning — rättelsepost",
        companyTypes: "Alla",
        confirmLabel: "Makulera",
        icon: Trash2,
        accent: "amber",
        completedAction: "deleted",
        completedTitle: "Verifikation makulerad",
        confirmation: {
            title: "Makulera verifikation",
            description: "A43 — Felaktig bokning",
            summary: [
                { label: "Verifikation", value: "A43" },
                { label: "Beskrivning", value: "Felaktig bokning kontorshyra" },
                { label: "Belopp", value: "8 500 kr" },
                { label: "Datum", value: "2026-03-15" },
            ],
            warnings: [
                "En rättelsepost skapas som nollställer originalet — verifikationskedjan behålls intakt.",
            ],
            action: { toolName: "nullify_verification", params: {} },
        },
    },
]

// =============================================================================
// Section 4: Comparison tables
// =============================================================================

// =============================================================================
// Helper: icon row for domain-specific cards
// =============================================================================

function IconRow({ icon: Icon, children, bold }: { icon: LucideIcon; children: React.ReactNode; bold?: boolean }) {
    return (
        <div className="flex items-center gap-3">
            <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            {bold ? <p className="font-medium">{children}</p> : <span className="text-muted-foreground">{children}</span>}
        </div>
    )
}

const domainIconStyles: Record<ConfirmationAccent, { iconColor: string; iconBg: string }> = {
    blue:    { iconColor: "text-blue-600 dark:text-blue-500",       iconBg: "bg-blue-500/10" },
    green:   { iconColor: "text-green-600 dark:text-green-500",     iconBg: "bg-green-500/10" },
    emerald: { iconColor: "text-emerald-600 dark:text-emerald-500", iconBg: "bg-emerald-500/10" },
    purple:  { iconColor: "text-purple-600 dark:text-purple-500",   iconBg: "bg-purple-500/10" },
    amber:   { iconColor: "text-amber-600 dark:text-amber-500",     iconBg: "bg-amber-500/10" },
    red:     { iconColor: "text-red-600 dark:text-red-500",         iconBg: "bg-red-500/10" },
    indigo:  { iconColor: "text-indigo-600 dark:text-indigo-500",   iconBg: "bg-indigo-500/10" },
    teal:    { iconColor: "text-teal-600 dark:text-teal-500",       iconBg: "bg-teal-500/10" },
}

function DomainCard({
    title,
    subtitle,
    icon: Icon,
    accent,
    buttonLabel,
    completedAction,
    completedTitle,
    children,
}: {
    title: string
    subtitle: string
    icon: LucideIcon
    accent: ConfirmationAccent
    buttonLabel: string
    completedAction: CompletedAction
    completedTitle: string
    children: React.ReactNode
}) {
    const [isDone, setIsDone] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleConfirm = () => {
        setIsLoading(true)
        setTimeout(() => { setIsLoading(false); setIsDone(true) }, 1200)
    }

    const styles = domainIconStyles[accent]
    const actionConfig = completedActionConfig[completedAction]
    const ActionIcon = actionConfig.icon

    return (
        <div className="w-full max-w-sm space-y-1 py-1">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                    <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg shrink-0", styles.iconBg)}>
                        <Icon className={cn("h-3.5 w-3.5", styles.iconColor)} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold">{isDone ? completedTitle : title}</p>
                        <p className="text-xs text-muted-foreground">{subtitle}</p>
                    </div>
                </div>
                {isDone && (
                    <span className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0 animate-in fade-in slide-in-from-right-2 duration-300",
                        actionConfig.bg, actionConfig.color,
                    )}>
                        <ActionIcon className="h-3 w-3" />
                        {actionConfig.label}
                    </span>
                )}
            </div>
            <div className="space-y-2.5 text-sm">
                {children}
            </div>
            {isDone ? (
                <button className="text-xs text-muted-foreground underline pt-2 block" onClick={() => setIsDone(false)}>
                    Återställ
                </button>
            ) : (
                <div className="flex gap-2 pt-3">
                    <Button size="sm" disabled={isLoading} onClick={handleConfirm}>
                        {isLoading ? "Sparar..." : buttonLabel}
                    </Button>
                    <Button variant="ghost" size="sm" disabled={isLoading}>Avbryt</Button>
                </div>
            )}
        </div>
    )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center py-0.5">
            <span className="text-muted-foreground w-2/5 text-xs">{label}</span>
            <span className="flex-1 font-medium text-sm">{value}</span>
        </div>
    )
}

// Shared action badge used in raw-JSX stateful cards
function ActionBadge({ action }: { action: CompletedAction }) {
    const config = completedActionConfig[action]
    const Icon = config.icon
    return (
        <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0 animate-in fade-in slide-in-from-right-2 duration-300",
            config.bg, config.color,
        )}>
            <Icon className="h-3 w-3" />
            {config.label}
        </span>
    )
}

function UtdelningsbeslutsCard() {
    const [isDone, setIsDone] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const handleConfirm = () => { setIsLoading(true); setTimeout(() => { setIsLoading(false); setIsDone(true) }, 1200) }
    return (
        <div className="w-full max-w-md space-y-1 py-1">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0 bg-amber-500/10">
                        <Coins className="h-3.5 w-3.5 text-amber-600 dark:text-amber-500" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold">{isDone ? "Utdelningsbeslut fattat" : "Utdelningsbeslut 2025"}</p>
                        <p className="text-xs text-muted-foreground">Scope AI AB</p>
                    </div>
                </div>
                {isDone && <ActionBadge action="prepared" />}
            </div>
            <div className="space-y-1.5 text-sm">
                <SummaryRow label="Fritt eget kapital" value="820 000 kr" />
                <SummaryRow label="Antal aktier" value="1 000 st" />
                <SummaryRow label="Utdelning / aktie" value="150 kr" />
                <SummaryRow label="Total utdelning" value={formatCurrency(150000)} />
                <SummaryRow label="Kvarvarande kapital" value={formatCurrency(670000)} />
            </div>
            <div className="flex items-start gap-2 text-xs text-emerald-600 dark:text-emerald-500 pt-2">
                <Check className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>Försiktighetsregeln uppfylld — fritt eget kapital täcker utdelningen.</span>
            </div>
            {isDone ? (
                <button className="text-xs text-muted-foreground underline pt-2 block" onClick={() => setIsDone(false)}>Återställ</button>
            ) : (
                <div className="flex gap-2 pt-3">
                    <Button size="sm" disabled={isLoading} onClick={handleConfirm}>{isLoading ? "Sparar..." : "Besluta utdelning"}</Button>
                    <Button variant="ghost" size="sm" disabled={isLoading}>Avbryt</Button>
                </div>
            )}
        </div>
    )
}

function AgaruttagCard() {
    const [isDone, setIsDone] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const handleConfirm = () => { setIsLoading(true); setTimeout(() => { setIsLoading(false); setIsDone(true) }, 1200) }
    return (
        <div className="w-full max-w-md space-y-1 py-1">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0 bg-amber-500/10">
                        <Coins className="h-3.5 w-3.5 text-amber-600 dark:text-amber-500" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold">{isDone ? "Uttag bokfört" : "Eget uttag"}</p>
                        <p className="text-xs text-muted-foreground">2026-03-28</p>
                    </div>
                </div>
                {isDone && <ActionBadge action="booked" />}
            </div>
            <div className="space-y-1.5 text-sm">
                <SummaryRow label="Ägare" value="Johan Berg" />
                <SummaryRow label="Belopp" value={formatCurrency(25000)} />
                <SummaryRow label="Konto debet" value="2013 Eget uttag" />
                <SummaryRow label="Konto kredit" value="1930 Företagskonto" />
            </div>
            {isDone ? (
                <button className="text-xs text-muted-foreground underline pt-2 block" onClick={() => setIsDone(false)}>Återställ</button>
            ) : (
                <div className="flex gap-2 pt-3">
                    <Button size="sm" disabled={isLoading} onClick={handleConfirm}>{isLoading ? "Sparar..." : "Bokför"}</Button>
                    <Button variant="ghost" size="sm" disabled={isLoading}>Avbryt</Button>
                </div>
            )}
        </div>
    )
}

function BatchbokforingCard() {
    const [isDone, setIsDone] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const handleConfirm = () => { setIsLoading(true); setTimeout(() => { setIsLoading(false); setIsDone(true) }, 1400) }
    
    return (
        <div className="w-full max-w-md space-y-1 py-1">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0 bg-blue-500/10">
                        <Receipt className="h-3.5 w-3.5 text-blue-600 dark:text-blue-500" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold">{isDone ? "4 kvitton bokförda" : "Bokför 4 kvitton"}</p>
                        <p className="text-xs text-muted-foreground">{isDone ? "Verifikation A-49 till A-52" : "Granska innan bokföring"}</p>
                    </div>
                </div>
                {isDone && <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center gap-1 shrink-0"><Check className="h-3 w-3" /> bokförd</span>}
            </div>
            <div className="divide-y divide-border/60">
                {[
                    { vendor: "Postnord",    desc: "Porto",            amount: "89 kr",     account: "6250 Porto",          moms: "18 kr (25%)",    date: "2026-03-22" },
                    { vendor: "Kjell & Co",  desc: "Kontorsmaterial",  amount: "2 499 kr",  account: "6110 Kontorsmaterial", moms: "500 kr (25%)",   date: "2026-03-25" },
                    { vendor: "AWS",         desc: "Serverhosting",    amount: "4 200 kr",  account: "6540 IT-tjänster",     moms: "840 kr (25%)",   date: "2026-03-01" },
                    { vendor: "Webhallen",   desc: "Datorutrustning",  amount: "12 900 kr", account: "1250 Datorer",          moms: "2 580 kr (25%)", date: "2026-03-18" },
                ].map((item, i) => (
                    <div key={i} className="py-2.5 first:pt-0">
                        <div className="flex items-baseline justify-between mb-1">
                            <p className="text-sm font-medium">{item.vendor} — {item.desc}</p>
                            <p className="text-sm font-semibold tabular-nums ml-4 shrink-0">{item.amount}</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{item.account}</span><span>·</span>
                            <span>Moms {item.moms}</span><span>·</span>
                            <span>{item.date}</span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">Totalt: <span className="font-semibold text-foreground">19 688 kr</span></p>
            </div>
            {isDone ? (
                <button className="text-xs text-muted-foreground underline pt-2 block" onClick={() => setIsDone(false)}>Återställ</button>
            ) : (
                <div className="flex gap-2 pt-2">
                    <Button size="sm" disabled={isLoading} onClick={handleConfirm}>{isLoading ? "Bokför..." : "Bokför alla (4)"}</Button>
                    <Button variant="ghost" size="sm" disabled={isLoading}>Avbryt</Button>
                </div>
            )}
        </div>
    )
}


// =============================================================================
// Page
// =============================================================================

export default function TestConfirmationPage() {
    const [activeStates, setActiveStates] = useState<Record<string, "idle" | "loading" | "confirmed" | "cancelled">>({})
    const [batchEmployeeDone, setBatchEmployeeDone] = useState(false)

    const getState = (key: string) => activeStates[key] || "idle"
    const setState = (key: string, state: "idle" | "loading" | "confirmed" | "cancelled") =>
        setActiveStates(s => ({ ...s, [key]: state }))

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="max-w-3xl mx-auto px-6 pt-6">
                <Link
                    href="/test-ui/chat-tools"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Walkthroughs & Overlays
                </Link>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-8 space-y-12">
                {/* === SECTION 1: Generic confirmations === */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight mb-1">Bekräftelse-UI</h1>
                    <p className="text-sm text-muted-foreground mb-8">
                        Varje mutation som Scooby gör kräver bekräftelse.
                        Färgkodade ikoner och knappar per domän.
                    </p>

                    <div className="space-y-8">
                        {genericConfirmations.map((item, i) => {
                            const key = `generic-${i}`
                            const state = getState(key)
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
                                                <button className="text-xs underline ml-auto" onClick={() => setState(key, "idle")}>Återställ</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="max-w-lg">
                                            <ConfirmationCard
                                                confirmation={item.confirmation}
                                                confirmLabel={item.confirmLabel}
                                                icon={item.icon}
                                                accent={item.accent}
                                                isDone={state === "confirmed"}
                                                isLoading={state === "loading"}
                                                completedAction={item.completedAction}
                                                completedTitle={item.completedTitle}
                                                onConfirm={() => { setState(key, "loading"); setTimeout(() => setState(key, "confirmed"), 1200) }}
                                                onCancel={() => setState(key, "cancelled")}
                                            />
                                            {state === "confirmed" && (
                                                <button className="text-xs text-muted-foreground underline mt-2" onClick={() => setState(key, "idle")}>Återställ</button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>


                {/* === SECTION 2: Domain-specific confirmations === */}
                <div className="border-t pt-12">
                    <h2 className="text-xl font-bold tracking-tight mb-1">Domänspecifika bekräftelser</h2>
                    <p className="text-sm text-muted-foreground mb-8">
                        Mutationer med egna UI-format — debet/kredit-tabell,
                        ikonrader, aktieinnehav, vinstandelar.
                    </p>

                    <div className="space-y-8">
                        {/* Employee */}
                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Anställd</h3>
                                <span className="text-xs text-muted-foreground">Ny anställd</span>
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">AB, HB</span>
                            </div>
                            <div className="max-w-lg">
                                <DomainCard title="Ny anställd" subtitle="Registrera i systemet" icon={User} accent="green" buttonLabel="Registrera" completedAction="created" completedTitle="Anna Lindberg registrerad">
                                    <IconRow icon={User} bold>Anna Lindberg</IconRow>
                                    <IconRow icon={Briefcase}>Frontend-utvecklare</IconRow>
                                    <IconRow icon={Coins}>{formatCurrency(45000)} / mån</IconRow>
                                    <IconRow icon={Mail}>anna.lindberg@example.com</IconRow>
                                    <IconRow icon={MapPin}>Stockholm (skattesats 30,62%)</IconRow>
                                </DomainCard>
                            </div>
                        </div>

                        {/* EmployeeCard — card-registry version of the above */}
                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Anställd (EmployeeCard)</h3>
                                <span className="text-xs text-muted-foreground">Chat-kortregistrets version — levereras av Scooby</span>
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">AB, HB</span>
                            </div>
                            <div className="max-w-sm">
                                <EmployeeCard
                                    name="Anna Lindberg"
                                    role="Frontend-utvecklare"
                                    email="anna.lindberg@example.com"
                                    salary={42000}
                                />
                            </div>
                        </div>

                        {/* Owner / Shareholder (AB) */}
                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Ägare / Aktieägare</h3>
                                <span className="text-xs text-muted-foreground">Aktieinnehav</span>
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">AB</span>
                            </div>
                            <div className="max-w-lg">
                                <DomainCard title="Ny ägare" subtitle="Registrera i aktiebok" icon={Landmark} accent="purple" buttonLabel="Registrera" completedAction="created" completedTitle="Erik Svensson registrerad">
                                    <IconRow icon={User} bold>Erik Svensson</IconRow>
                                    <IconRow icon={Briefcase}>VD & Styrelseordförande</IconRow>
                                    <IconRow icon={Share2}>600 aktier (60%) · Stamaktier A</IconRow>
                                    <IconRow icon={Vote}>600 röster</IconRow>
                                    <IconRow icon={MapPin}>Stockholm (skattesats 30,62%)</IconRow>
                                </DomainCard>
                            </div>
                        </div>

                        {/* Partner / Delägare (HB, KB) */}
                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Delägare (HB/KB)</h3>
                                <span className="text-xs text-muted-foreground">Vinstandel</span>
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">HB, KB</span>
                            </div>
                            <div className="max-w-lg">
                                <DomainCard title="Ny delägare" subtitle="Registrera i bolagsavtal" icon={Users} accent="purple" buttonLabel="Registrera" completedAction="created" completedTitle="Maria Johansson registrerad">
                                    <IconRow icon={User} bold>Maria Johansson</IconRow>
                                    <IconRow icon={Briefcase}>Delägare</IconRow>
                                    <IconRow icon={Percent}>40% vinstandel</IconRow>
                                    <IconRow icon={Coins}>Kapitalinsats: {formatCurrency(100000)}</IconRow>
                                    <IconRow icon={MapPin}>Göteborg (skattesats 32,89%)</IconRow>
                                </DomainCard>
                            </div>
                        </div>

                        {/* Medlem (Förening) */}
                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Medlem</h3>
                                <span className="text-xs text-muted-foreground">Ny föreningsmedlem</span>
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Förening</span>
                            </div>
                            <div className="max-w-lg">
                                <DomainCard title="Ny medlem" subtitle="Registrera i medlemsregister" icon={Users} accent="green" buttonLabel="Registrera" completedAction="created" completedTitle="Lars Eriksson registrerad">
                                    <IconRow icon={User} bold>Lars Eriksson</IconRow>
                                    <IconRow icon={Mail}>lars.eriksson@example.com</IconRow>
                                    <IconRow icon={Coins}>Årsavgift: {formatCurrency(500)}</IconRow>
                                    <IconRow icon={Calendar}>Startdatum: 2026-04-01</IconRow>
                                </DomainCard>
                            </div>
                        </div>

                        {/* Customer */}
                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Kund</h3>
                                <span className="text-xs text-muted-foreground">Fakturering</span>
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Alla</span>
                            </div>
                            <div className="max-w-lg">
                                <DomainCard title="Ny kund" subtitle="Lägg till i kundregister" icon={Building2} accent="teal" buttonLabel="Lägg till" completedAction="created" completedTitle="Acme Consulting AB tillagd">
                                    <IconRow icon={Building2} bold>Acme Consulting AB</IconRow>
                                    <IconRow icon={Briefcase}>559876-5432</IconRow>
                                    <IconRow icon={Mail}>faktura@acmeconsulting.se</IconRow>
                                    <IconRow icon={MapPin}>Sveavägen 44, 111 34 Stockholm</IconRow>
                                </DomainCard>
                            </div>
                        </div>

                        {/* Utdelningsbeslut (AB) */}
                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Utdelningsbeslut</h3>
                                <span className="text-xs text-muted-foreground">Equity check</span>
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">AB</span>
                            </div>
                            <div className="max-w-lg">
                                <UtdelningsbeslutsCard />
                            </div>
                        </div>

                        {/* Bokför utdelning (AB) */}
                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Bokför utdelning</h3>
                                <span className="text-xs text-muted-foreground">Beslutad → Bokförd</span>
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">AB</span>
                            </div>
                            <div className="max-w-lg">
                                <DomainCard title="Bokför utdelning 2025" subtitle="Scope AI AB" icon={Coins} accent="amber" buttonLabel="Bokför utdelning" completedAction="booked" completedTitle="Utdelning bokförd">
                                    <SummaryRow label="Total utdelning" value={formatCurrency(150000)} />
                                    <SummaryRow label="Antal aktieägare" value="2 st" />
                                    <SummaryRow label="Konto debet" value="2098 Utdelning" />
                                    <SummaryRow label="Konto kredit" value="2898 Skuld utdelning" />
                                    <SummaryRow label="Beslutsdatum" value="2026-03-15" />
                                </DomainCard>
                            </div>
                        </div>

                        {/* Aktieöverlåtelse (AB) */}
                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Aktieöverlåtelse</h3>
                                <span className="text-xs text-muted-foreground">Överlåtelse</span>
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">AB</span>
                            </div>
                            <div className="max-w-lg">
                                <DomainCard title="Aktieöverlåtelse" subtitle="Scope AI AB" icon={ArrowRight} accent="purple" buttonLabel="Genomför överlåtelse" completedAction="updated" completedTitle="Överlåtelse genomförd">
                                    <IconRow icon={User}>Från: Erik Svensson (600 → 500)</IconRow>
                                    <IconRow icon={ArrowRight}>Till: Tech Invest AB (150 → 250)</IconRow>
                                    <IconRow icon={Share2}>100 aktier · Stamaktier A · Nr 501–600</IconRow>
                                    <IconRow icon={Coins}>Köpeskilling: {formatCurrency(250000)}</IconRow>
                                    <IconRow icon={Calendar}>Tillträde: 2026-04-01</IconRow>
                                </DomainCard>
                            </div>
                        </div>

                        {/* Delägarinsättning (HB, KB) */}
                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Delägarinsättning</h3>
                                <span className="text-xs text-muted-foreground">Kapitalinsättning i HB/KB</span>
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">HB, KB</span>
                            </div>
                            <div className="max-w-lg">
                                <DomainCard title="Registrera insättning" subtitle="Erik Svensson" icon={Coins} accent="purple" buttonLabel="Registrera insättning" completedAction="booked" completedTitle="Insättning registrerad">
                                    <SummaryRow label="Delägare" value="Erik Svensson (60%)" />
                                    <SummaryRow label="Belopp" value={formatCurrency(50000)} />
                                    <SummaryRow label="Konto debet" value="1930 Företagskonto" />
                                    <SummaryRow label="Konto kredit" value="2010 Eget kapital" />
                                    <SummaryRow label="Datum" value="2026-04-14" />
                                </DomainCard>
                            </div>
                        </div>

                        {/* Delägaruttag (HB, KB) */}
                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Delägaruttag</h3>
                                <span className="text-xs text-muted-foreground">Uttag ur HB/KB</span>
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">HB, KB</span>
                            </div>
                            <div className="max-w-lg">
                                <DomainCard title="Registrera uttag" subtitle="Maria Johansson" icon={Coins} accent="purple" buttonLabel="Registrera uttag" completedAction="booked" completedTitle="Uttag registrerat">
                                    <SummaryRow label="Delägare" value="Maria Johansson (40%)" />
                                    <SummaryRow label="Belopp" value={formatCurrency(25000)} />
                                    <SummaryRow label="Konto debet" value="2010 Eget kapital" />
                                    <SummaryRow label="Konto kredit" value="1930 Företagskonto" />
                                    <SummaryRow label="Datum" value="2026-04-14" />
                                </DomainCard>
                            </div>
                        </div>

                        {/* Ägaruttag (EF) */}
                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Ägaruttag</h3>
                                <span className="text-xs text-muted-foreground">Eget uttag</span>
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">EF</span>
                            </div>
                            <div className="max-w-lg">
                                <AgaruttagCard />
                            </div>
                        </div>

                        {/* Tilldela roll (AB, Förening) */}
                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Tilldela roll</h3>
                                <span className="text-xs text-muted-foreground">Styrelsepost</span>
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">AB, Förening</span>
                            </div>
                            <div className="max-w-lg">
                                <DomainCard title="Tilldela roll" subtitle="Styrelsepost" icon={Gavel} accent="indigo" buttonLabel="Tilldela" completedAction="updated" completedTitle="Roll tilldelad">
                                    <IconRow icon={User} bold>Maria Johansson</IconRow>
                                    <IconRow icon={Briefcase}>Styrelseledamot</IconRow>
                                    <IconRow icon={Calendar}>Tillträde: 2026-04-15</IconRow>
                                    <IconRow icon={Gavel}>Registreras hos Bolagsverket</IconRow>
                                </DomainCard>
                            </div>
                        </div>

                        {/* Planera möte (AB, Förening) */}
                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Planera möte</h3>
                                <span className="text-xs text-muted-foreground">Stämma / styrelsemöte</span>
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">AB, Förening</span>
                            </div>
                            <div className="max-w-lg">
                                <DomainCard title="Nytt styrelsemöte" subtitle="Möte 4/2026" icon={Calendar} accent="indigo" buttonLabel="Skapa möte" completedAction="created" completedTitle="Möte skapat">
                                    <IconRow icon={Calendar}>2026-05-15 kl. 14:00</IconRow>
                                    <IconRow icon={MapPin}>Kungsgatan 12, Stockholm</IconRow>
                                    <IconRow icon={Users}>4 ledamöter kallade</IconRow>
                                    <IconRow icon={FileText}>Dagordning: 7 punkter</IconRow>
                                </DomainCard>
                            </div>
                        </div>
                    </div>
                </div>

                {/* === SECTION 3: Batch confirmations === */}
                <div className="border-t pt-12">
                    <h2 className="text-xl font-bold tracking-tight mb-1">Batchbekräftelse</h2>
                    <p className="text-sm text-muted-foreground mb-8">
                        Scooby och användaren diskuterar först i chatten. När allt är klart
                        skickar Scooby en slutgiltig lista — användaren bekräftar, sedan utförs ändringarna.
                    </p>

                    <div className="space-y-12">
                        {/* --- Batch booking: compact list --- */}
                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Batchbokföring</h3>
                                <span className="text-xs text-muted-foreground">Alla, t.ex. efter kvittouppladdning</span>
                            </div>
                            <div className="max-w-lg">
                                <BatchbokforingCard />
                            </div>
                        </div>

                        {/* --- Simple status change: checklist with badges --- */}
                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">Statusändring — anställda</h3>
                                <span className="text-xs text-muted-foreground">Alla, efter diskussion i chatten</span>
                            </div>
                            <div className="max-w-lg">
                                <BatchConfirmationCard
                                    title="Uppdatera 3 anställda"
                                    description="Ändra status enligt vad vi diskuterade"
                                    icon={Users}
                                    accent="emerald"
                                    items={[
                                        { id: "a", label: "Anna Lindberg", description: "Kommun: Stockholm. Skattetabell kolumn 1 inlagd.", status: "pending", checked: true, fromBadge: { label: "Ny", className: "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400" }, badge: { label: "Aktiv", className: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" } },
                                        { id: "b", label: "Johan Berg", description: "Kommun: Göteborg. Skattetabell kolumn 1 inlagd.", status: "pending", checked: true, fromBadge: { label: "Ny", className: "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400" }, badge: { label: "Aktiv", className: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" } },
                                        { id: "c", label: "Maria Svensson", description: "Startdatum 2026-04-15. Ersättning via FK.", status: "pending", checked: true, fromBadge: { label: "Aktiv", className: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" }, badge: { label: "Föräldraledig", className: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400" } },
                                    ]}
                                    confirmLabel="Uppdatera valda"
                                    onConfirm={() => setBatchEmployeeDone(true)}
                                    onCancel={() => {}}
                                    isDone={batchEmployeeDone}
                                    completedAction="updated"
                                    completedTitle="3 anställda uppdaterade"
                                    onReset={() => setBatchEmployeeDone(false)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* === SECTION 4: Supporting UI components === */}
                <div className="border-t pt-12">
                    <h2 className="text-xl font-bold tracking-tight mb-1">Stödjande UI-komponenter</h2>
                    <p className="text-sm text-muted-foreground mb-8">
                        Hjälpkomponenter som används i och kring bekräftelseflöden.
                    </p>

                    <div className="space-y-8">
                        {/* ActionTriggerChip */}
                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">ActionTriggerChip</h3>
                                <span className="text-xs text-muted-foreground">Visar användarens AI-åtgärd som stiliserat chip istället för råtext</span>
                            </div>
                            <div className="space-y-3">
                                <ActionTriggerChip display={{ type: "action-trigger", icon: "invoice", title: "Skapa faktura", subtitle: "Acme Consulting AB · 50 000 kr", meta: "Konsultarbete mars 2026" }} />
                                <ActionTriggerChip display={{ type: "action-trigger", icon: "meeting", title: "Förbered bolagsstämma", subtitle: "Ordinarie stämma 2026" }} />
                                <ActionTriggerChip display={{ type: "action-trigger", icon: "decision", title: "Registrera utdelningsbeslut", subtitle: "187 550 kr · K10-gränsbelopp" }} />
                                <ActionTriggerChip display={{ type: "action-trigger", icon: "audit", title: "Kör balanskontroll", subtitle: "Mars 2026" }} />
                            </div>
                        </div>

                        {/* ComparisonTable */}
                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-sm font-semibold">ComparisonTable</h3>
                                <span className="text-xs text-muted-foreground">Före/efter-tabell — används när Scooby ändrar befintliga uppgifter</span>
                            </div>
                            <div className="max-w-md space-y-4">
                                <ComparisonTable
                                    title="Ägarandelar — uppdaterade"
                                    rows={[
                                        { label: "Erik Svensson", before: "60%", after: "50%" },
                                        { label: "Maria Johansson", before: "40%", after: "50%" },
                                        { label: "Gäller från", before: "—", after: "2026-04-14" },
                                    ]}
                                />
                                <ComparisonTable
                                    title="Anställd — uppdaterad"
                                    rows={[
                                        { label: "Titel", before: "Frontend-utvecklare", after: "Senior Frontend-utvecklare" },
                                        { label: "Lön", before: "42 000 kr/mån", after: "46 000 kr/mån" },
                                        { label: "Gäller från", before: "—", after: "2026-05-01" },
                                    ]}
                                />
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
