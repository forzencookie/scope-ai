"use client"

import { useRouter } from "next/navigation"
import {
    FileText, Receipt, BookOpen, Users, PieChart,
    ArrowRight, CheckCircle2, Clock, AlertCircle,
    Package, Gift, Percent
} from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"

// Shared card shell — subtle border, compact layout
function CardShell({
    children,
    onClick,
    icon: Icon,
    iconColor = "text-muted-foreground",
    iconBg = "bg-muted",
    isNew = false,
}: {
    children: React.ReactNode
    onClick?: () => void
    icon: React.ElementType
    iconColor?: string
    iconBg?: string
    isNew?: boolean
}) {
    return (
        <div className="relative">
            {isNew && (
                <span className="absolute -top-2 right-3 z-10 bg-background px-1.5 py-0.5 rounded-full text-[10px] font-medium text-blue-600 dark:text-blue-400">
                    Ny
                </span>
            )}
            <button
                onClick={onClick}
                className={cn(
                    "w-full flex items-center gap-3 rounded-lg border bg-card/50 px-3 py-2.5 text-left text-sm transition-colors",
                    onClick && "hover:bg-accent/50 cursor-pointer",
                )}
            >
                <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", iconBg)}>
                    <Icon className={cn("h-4 w-4", iconColor)} />
                </div>
                <div className="flex-1 min-w-0">{children}</div>
                {onClick && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
            </button>
        </div>
    )
}

// Status badge helper
function StatusBadge({ status, variant }: { status: string; variant: "success" | "warning" | "error" | "neutral" }) {
    const colors = {
        success: "bg-green-500/10 text-green-600 dark:text-green-400",
        warning: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
        error: "bg-red-500/10 text-red-600 dark:text-red-400",
        neutral: "bg-muted text-muted-foreground",
    }
    return (
        <span className={cn("text-[11px] px-1.5 py-0.5 rounded-full font-medium", colors[variant])}>
            {status}
        </span>
    )
}

// --- Invoice Card ---
export interface InlineInvoiceData {
    id?: string
    invoiceNumber?: string
    customer?: string
    amount?: number
    status?: string
}

export function InlineInvoiceCard({ data, isNew }: { data: InlineInvoiceData; isNew?: boolean }) {
    const router = useRouter()
    const statusVariant = data.status === "Betald" ? "success" : data.status === "Förfallen" ? "error" : data.status === "Skickad" ? "warning" : "neutral"
    const statusLabel = data.status || "Utkast"

    return (
        <CardShell
            icon={FileText}
            iconColor="text-blue-600 dark:text-blue-400"
            iconBg="bg-blue-500/10"
            isNew={isNew}
            onClick={() => router.push(`/dashboard/bokforing?tab=fakturor&highlight=${data.id}`)}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                    <p className="font-medium truncate">{data.customer || "Faktura"}</p>
                    <p className="text-xs text-muted-foreground">
                        {data.invoiceNumber && `#${data.invoiceNumber}`}
                        {data.amount != null && ` · ${formatCurrency(data.amount)}`}
                    </p>
                </div>
                <StatusBadge status={statusLabel} variant={statusVariant} />
            </div>
        </CardShell>
    )
}

// --- Transaction Card ---
export interface InlineTransactionData {
    id?: string
    description?: string
    amount?: number
    date?: string
    status?: string
}

export function InlineTransactionCard({ data, isNew }: { data: InlineTransactionData; isNew?: boolean }) {
    const router = useRouter()
    const isBooked = data.status === "Bokförd"

    return (
        <CardShell
            icon={Receipt}
            iconColor="text-emerald-600 dark:text-emerald-400"
            iconBg="bg-emerald-500/10"
            isNew={isNew}
            onClick={() => router.push(`/dashboard/bokforing?tab=transaktioner&highlight=${data.id}`)}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                    <p className="font-medium truncate">{data.description || "Transaktion"}</p>
                    <p className="text-xs text-muted-foreground">
                        {data.date}
                        {data.amount != null && ` · ${formatCurrency(data.amount)}`}
                    </p>
                </div>
                <StatusBadge
                    status={isBooked ? "Bokförd" : "Obokförd"}
                    variant={isBooked ? "success" : "warning"}
                />
            </div>
        </CardShell>
    )
}

// --- Verification Card ---
export interface InlineVerificationData {
    id?: string
    verificationNumber?: string
    date?: string
    description?: string
    amount?: number
    status?: string
}

export function InlineVerificationCard({ data, isNew }: { data: InlineVerificationData; isNew?: boolean }) {
    const router = useRouter()

    return (
        <CardShell
            icon={BookOpen}
            iconColor="text-violet-600 dark:text-violet-400"
            iconBg="bg-violet-500/10"
            isNew={isNew}
            onClick={() => router.push(`/dashboard/bokforing?tab=verifikationer&highlight=${data.id}`)}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                    <p className="font-medium truncate">
                        {data.verificationNumber && <span className="font-mono text-xs mr-1.5">{data.verificationNumber}</span>}
                        {data.description || "Verifikation"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {data.date}
                        {data.amount != null && ` · ${formatCurrency(data.amount)}`}
                    </p>
                </div>
                <StatusBadge status={data.status || "Bokförd"} variant="success" />
            </div>
        </CardShell>
    )
}

// --- Payroll Card ---
export interface InlinePayrollData {
    id?: string
    employeeName?: string
    period?: string
    netAmount?: number
    status?: string
}

export function InlinePayrollCard({ data, isNew }: { data: InlinePayrollData; isNew?: boolean }) {
    const router = useRouter()
    const statusVariant = data.status === "Skickad" ? "success" : data.status === "Godkänd" ? "warning" : "neutral"
    const statusLabel = data.status || "Utkast"

    return (
        <CardShell
            icon={Users}
            iconColor="text-green-600 dark:text-green-400"
            iconBg="bg-green-500/10"
            isNew={isNew}
            onClick={() => router.push(`/dashboard/loner?tab=lonebesked&highlight=${data.id}`)}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                    <p className="font-medium truncate">{data.employeeName || "Lönebesked"}</p>
                    <p className="text-xs text-muted-foreground">
                        {data.period}
                        {data.netAmount != null && ` · Netto ${formatCurrency(data.netAmount)}`}
                    </p>
                </div>
                <StatusBadge status={statusLabel} variant={statusVariant} />
            </div>
        </CardShell>
    )
}

// --- Report Card ---
export interface InlineReportData {
    id?: string
    reportType?: string
    period?: string
    title?: string
}

export function InlineReportCard({ data, isNew }: { data: InlineReportData; isNew?: boolean }) {
    const router = useRouter()

    return (
        <CardShell
            icon={PieChart}
            iconColor="text-amber-600 dark:text-amber-400"
            iconBg="bg-amber-500/10"
            isNew={isNew}
            onClick={() => router.push(`/dashboard/rapporter`)}
        >
            <div className="min-w-0">
                <p className="font-medium truncate">{data.title || data.reportType || "Rapport"}</p>
                <p className="text-xs text-muted-foreground">
                    {data.period && `Period: ${data.period}`}
                </p>
            </div>
        </CardShell>
    )
}

// --- Receipt Card ---
export interface InlineReceiptData {
    id?: string
    supplier?: string
    amount?: number
    date?: string
    status?: string
}

export function InlineReceiptCard({ data, isNew }: { data: InlineReceiptData; isNew?: boolean }) {
    const router = useRouter()

    return (
        <CardShell
            icon={Receipt}
            iconColor="text-rose-600 dark:text-rose-400"
            iconBg="bg-rose-500/10"
            isNew={isNew}
            onClick={() => router.push(`/dashboard/bokforing?tab=kvitton&highlight=${data.id}`)}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                    <p className="font-medium truncate">{data.supplier || "Kvitto"}</p>
                    <p className="text-xs text-muted-foreground">
                        {data.date}
                        {data.amount != null && ` · ${formatCurrency(data.amount)}`}
                    </p>
                </div>
                <StatusBadge status={data.status || "Mottaget"} variant={data.status === "Bokförd" ? "success" : data.status === "Avvisad" ? "error" : "warning"} />
            </div>
        </CardShell>
    )
}

// --- VAT Card ---
export interface InlineVATData {
    id?: string
    period?: string
    amount?: number
    status?: string
}

export function InlineVATCard({ data, isNew }: { data: InlineVATData; isNew?: boolean }) {
    const router = useRouter()

    return (
        <CardShell
            icon={PieChart}
            iconColor="text-purple-600 dark:text-purple-400"
            iconBg="bg-purple-500/10"
            isNew={isNew}
            onClick={() => router.push(`/dashboard/rapporter`)}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                    <p className="font-medium truncate">Momsdeklaration {data.period}</p>
                    <p className="text-xs text-muted-foreground">
                        {data.amount != null && `${data.amount > 0 ? 'Att få tillbaka: ' : 'Att betala: '}${formatCurrency(Math.abs(data.amount))}`}
                    </p>
                </div>
                <StatusBadge status={data.status || "Utkast"} variant="warning" />
            </div>
        </CardShell>
    )
}

// --- Dividend Card ---
export interface InlineDividendData {
    id?: string
    name?: string
    amount?: number
    year?: number
}

export function InlineDividendCard({ data, isNew }: { data: InlineDividendData; isNew?: boolean }) {
    const router = useRouter()

    return (
        <CardShell
            icon={Users}
            iconColor="text-indigo-600 dark:text-indigo-400"
            iconBg="bg-indigo-500/10"
            isNew={isNew}
            onClick={() => router.push(`/dashboard/agare?tab=utdelning`)}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                    <p className="font-medium truncate">Utdelning {data.name}</p>
                    <p className="text-xs text-muted-foreground">
                        {data.year && `För räkenskapsår ${data.year}`}
                        {data.amount != null && ` · ${formatCurrency(data.amount)}`}
                    </p>
                </div>
                <StatusBadge status="Planerad" variant="neutral" />
            </div>
        </CardShell>
    )
}

// --- Asset Card (inventarie) ---
export interface InlineAssetData {
    id?: string
    name?: string
    acquisitionValue?: number
    bookValue?: number
    depreciationPerMonth?: number
}

export function InlineAssetCard({ data, isNew }: { data: InlineAssetData; isNew?: boolean }) {
    return (
        <CardShell
            icon={Package}
            iconColor="text-indigo-600 dark:text-indigo-400"
            iconBg="bg-indigo-500/10"
            isNew={isNew}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                    <p className="font-medium truncate">{data.name || "Inventarie"}</p>
                    <p className="text-xs text-muted-foreground">
                        {data.bookValue != null && `Bokfört ${formatCurrency(data.bookValue)}`}
                        {data.depreciationPerMonth != null && ` · ${formatCurrency(data.depreciationPerMonth)}/mån`}
                    </p>
                </div>
                {data.acquisitionValue != null && (
                    <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                        {formatCurrency(data.acquisitionValue)}
                    </span>
                )}
            </div>
        </CardShell>
    )
}

// --- Benefit Card (förmån) ---
export interface InlineBenefitData {
    id?: string
    employeeName?: string
    benefitType?: string
    amount?: number
    amountUnit?: string
    taxable?: boolean
}

export function InlineBenefitCard({ data, isNew }: { data: InlineBenefitData; isNew?: boolean }) {
    const taxLabel = data.taxable === false ? "Skattefritt" : data.taxable === true ? "Förmånsvärde" : undefined
    const taxVariant: "success" | "warning" = data.taxable === false ? "success" : "warning"

    return (
        <CardShell
            icon={Gift}
            iconColor="text-green-600 dark:text-green-400"
            iconBg="bg-green-500/10"
            isNew={isNew}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                    <p className="font-medium truncate">{data.employeeName || "Anställd"}</p>
                    <p className="text-xs text-muted-foreground">
                        {data.benefitType}
                        {data.amount != null && ` · ${formatCurrency(data.amount)}${data.amountUnit ? `/${data.amountUnit}` : ""}`}
                    </p>
                </div>
                {taxLabel && <StatusBadge status={taxLabel} variant={taxVariant} />}
            </div>
        </CardShell>
    )
}

// --- Partner Card (delägare HB/KB) ---
export interface InlinePartnerData {
    id?: string
    name?: string
    sharePercent?: number
    equity?: number
    withdrawals?: number
}

export function InlinePartnerCard({ data, isNew }: { data: InlinePartnerData; isNew?: boolean }) {
    return (
        <CardShell
            icon={Percent}
            iconColor="text-purple-600 dark:text-purple-400"
            iconBg="bg-purple-500/10"
            isNew={isNew}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                    <p className="font-medium truncate">{data.name || "Delägare"}</p>
                    <p className="text-xs text-muted-foreground">
                        {data.equity != null && `EK ${formatCurrency(data.equity)}`}
                        {data.withdrawals != null && ` · Uttag ${formatCurrency(data.withdrawals)}`}
                    </p>
                </div>
                {data.sharePercent != null && (
                    <span className="text-sm font-semibold tabular-nums shrink-0 text-purple-600 dark:text-purple-400">
                        {data.sharePercent}%
                    </span>
                )}
            </div>
        </CardShell>
    )
}

// --- Card type map for dynamic rendering ---
export type InfoCardType =
    | "invoice"
    | "transaction"
    | "verification"
    | "payroll"
    | "report"
    | "receipt"
    | "vat"
    | "dividend"
    | "asset"
    | "benefit"
    | "partner"
    | "task_completed"
    | "BuyCreditsPrompt"
    | "budget_limit"

export interface InfoCardData {
    cardType: InfoCardType
    data: Record<string, unknown>
    isNew?: boolean
}

export function InfoCardRenderer({ card }: { card: InfoCardData }) {
    switch (card.cardType) {
        case "invoice":
            return <InlineInvoiceCard data={card.data as InlineInvoiceData} isNew={card.isNew} />
        case "transaction":
            return <InlineTransactionCard data={card.data as InlineTransactionData} isNew={card.isNew} />
        case "verification":
            return <InlineVerificationCard data={card.data as InlineVerificationData} isNew={card.isNew} />
        case "payroll":
            return <InlinePayrollCard data={card.data as InlinePayrollData} isNew={card.isNew} />
        case "report":
            return <InlineReportCard data={card.data as InlineReportData} isNew={card.isNew} />
        case "receipt":
            return <InlineReceiptCard data={card.data as InlineReceiptData} isNew={card.isNew} />
        case "vat":
            return <InlineVATCard data={card.data as InlineVATData} isNew={card.isNew} />
        case "dividend":
            return <InlineDividendCard data={card.data as InlineDividendData} isNew={card.isNew} />
        case "asset":
            return <InlineAssetCard data={card.data as InlineAssetData} isNew={card.isNew} />
        case "benefit":
            return <InlineBenefitCard data={card.data as InlineBenefitData} isNew={card.isNew} />
        case "partner":
            return <InlinePartnerCard data={card.data as InlinePartnerData} isNew={card.isNew} />
        default:
            return null
    }
}
