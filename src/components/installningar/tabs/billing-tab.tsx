"use client"

import { useState, useEffect, useCallback } from "react"
import { CreditCard, Sparkles, Zap, AlertCircle, TrendingUp, Loader2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { useTextMode } from "@/providers/text-mode-provider"
import { useSubscription } from "@/hooks/use-subscription"
import { useAIUsage, formatTokens } from "@/hooks/use-ai-usage"
import { CREDIT_PACKAGES, TIER_TOKEN_LIMITS } from "@/lib/subscription"
import {
    SettingsPageHeader,
    SettingsSection,
    BillingHistoryRow,
} from "@/components/ui/settings-items"
import { cn } from "@/lib/utils"

function UsageBar() {
    const { tier, tierName, isDemo } = useSubscription()
    const { usage, loading } = useAIUsage()

    if (loading) {
        return (
            <div className="rounded-lg border p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-3" />
                <div className="h-2 bg-muted rounded w-full mb-2" />
                <div className="h-3 bg-muted rounded w-1/4" />
            </div>
        )
    }

    if (isDemo) {
        return (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                        <p className="font-medium text-amber-700 dark:text-amber-400">
                            Demo-läge – Simulerad AI
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Du använder simulerade AI-svar. Uppgradera till Pro för att få tillgång till
                            riktig AI med {formatTokens(TIER_TOKEN_LIMITS.pro)} tokens per månad.
                        </p>
                        <Button size="sm" className="mt-3" onClick={() => handleUpgrade()}>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Uppgradera till Pro
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    if (!usage) return null

    const isLow = usage.usagePercent >= 80
    const isOver = usage.isOverLimit

    return (
        <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">AI-användning denna månad</span>
                </div>
                <span className="text-sm text-muted-foreground">
                    {tierName}-plan
                </span>
            </div>

            <div className="space-y-2">
                <Progress
                    value={usage.usagePercent}
                    className={cn(
                        "h-3",
                        isOver && "[&>div]:bg-red-500",
                        isLow && !isOver && "[&>div]:bg-amber-500"
                    )}
                />
                <div className="flex justify-between text-sm">
                    <span className={cn(
                        "font-medium",
                        isOver && "text-red-600 dark:text-red-400",
                        isLow && !isOver && "text-amber-600 dark:text-amber-400"
                    )}>
                        {formatTokens(usage.tokensUsed)} av {formatTokens(usage.totalAvailable)} tokens
                    </span>
                    <span className="text-muted-foreground">
                        {usage.requestsCount} anrop
                    </span>
                </div>
            </div>

            {isOver && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <span>Du har förbrukat din månadskvot. Köp fler credits för att fortsätta.</span>
                </div>
            )}

            {isLow && !isOver && (
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                    <TrendingUp className="h-4 w-4" />
                    <span>Du närmar dig din gräns. Överväg att köpa extra credits.</span>
                </div>
            )}

            <div className="text-xs text-muted-foreground">
                Perioden återställs {usage.periodEnd.toLocaleDateString("sv-SE", {
                    day: "numeric",
                    month: "long"
                })}
            </div>
        </div>
    )
}

async function handleUpgrade() {
    try {
        const response = await fetch("/api/stripe/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tier: "pro" }),
        })
        const data = await response.json()
        if (data.url) {
            window.location.href = data.url
        }
    } catch (error) {
        console.error("[Billing] Failed to create checkout:", error)
    }
}

function BuyCreditsSection() {
    const { isDemo } = useSubscription()
    const [loadingPackage, setLoadingPackage] = useState<number | null>(null)

    if (isDemo) return null

    const handleBuyCredits = async (tokens: number) => {
        setLoadingPackage(tokens)
        try {
            const response = await fetch("/api/stripe/credits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tokens }),
            })
            const data = await response.json()
            if (data.url) {
                window.location.href = data.url
            }
        } catch (error) {
            console.error("[Billing] Failed to create credit checkout:", error)
        } finally {
            setLoadingPackage(null)
        }
    }

    return (
        <SettingsSection
            title="Köp extra credits"
            description="Om du förbrukar din månadskvot kan du köpa extra tokens"
        >
            <div className="grid gap-3 sm:grid-cols-3">
                {CREDIT_PACKAGES.map((pkg) => (
                    <button
                        key={pkg.tokens}
                        disabled={loadingPackage !== null}
                        className={cn(
                            "relative rounded-lg border-2 p-4 text-left transition-colors",
                            "hover:border-primary hover:bg-accent/50",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                            pkg.popular && "border-primary bg-primary/5"
                        )}
                        onClick={() => handleBuyCredits(pkg.tokens)}
                    >
                        {pkg.popular && (
                            <span className="absolute -top-2 left-3 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                                Populär
                            </span>
                        )}
                        {pkg.savings && (
                            <span className="absolute -top-2 right-3 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
                                {pkg.savings}
                            </span>
                        )}
                        <div className="font-semibold">{pkg.label}</div>
                        <div className="text-2xl font-bold mt-1">
                            {loadingPackage === pkg.tokens ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                `${pkg.price} kr`
                            )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            {(pkg.price / (pkg.tokens / 1000000)).toFixed(0)} kr/1M tokens
                        </div>
                    </button>
                ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
                Köpta credits förfaller aldrig och kan användas när som helst.
            </p>
        </SettingsSection>
    )
}

interface BillingItem {
    id: string
    date: string
    description: string
    amount: string
    status: "Betald" | "Obetald" | "Väntande"
    type: "subscription" | "credits"
    invoiceUrl?: string
    receiptUrl?: string
}

interface PaymentMethodInfo {
    brand: string
    last4: string
    expMonth: number
    expYear: number
}

function useBillingHistory() {
    const [items, setItems] = useState<BillingItem[]>([])
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethodInfo | null>(null)
    const [loading, setLoading] = useState(true)

    const fetch_ = useCallback(async () => {
        try {
            const response = await fetch("/api/stripe/billing-history")
            if (response.ok) {
                const data = await response.json()
                setItems(data.items || [])
                setPaymentMethod(data.paymentMethod || null)
            }
        } catch (error) {
            console.error("[Billing] Failed to fetch billing history:", error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetch_() }, [fetch_])

    return { items, paymentMethod, loading }
}

export function BillingTab() {
    const { text } = useTextMode()
    const { tierName, isDemo } = useSubscription()
    const { items: billingItems, paymentMethod, loading: billingLoading } = useBillingHistory()
    const [portalLoading, setPortalLoading] = useState(false)

    const openPortal = async () => {
        setPortalLoading(true)
        try {
            const response = await fetch("/api/stripe/portal", {
                method: "POST",
            })
            const data = await response.json()
            if (data.url) {
                window.location.href = data.url
            }
        } catch (error) {
            console.error("[Billing] Failed to open portal:", error)
        } finally {
            setPortalLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <SettingsPageHeader
                title={text.settings.billingSettings}
                description={text.settings.billingDesc}
            />

            {/* Current Plan */}
            <div className="rounded-lg p-4 bg-muted/50">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium">{tierName}-plan</p>
                        <p className="text-sm text-muted-foreground">
                            {isDemo ? "Gratis" : "449 kr/månad"}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isDemo && (
                            <Button variant="outline" size="sm" onClick={openPortal} disabled={portalLoading}>
                                {portalLoading && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                                Hantera prenumeration
                                <ExternalLink className="h-3 w-3 ml-1" />
                            </Button>
                        )}
                        <span className={cn(
                            "text-xs px-2 py-1 rounded-full",
                            isDemo
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        )}>
                            {isDemo ? "Demo" : text.settings.active}
                        </span>
                    </div>
                </div>
            </div>

            {/* AI Usage */}
            <UsageBar />

            {/* Buy Credits */}
            <BuyCreditsSection />

            <Separator />

            {/* Payment Method - only show for paid users */}
            {!isDemo && (
                <SettingsSection title={text.settings.paymentMethod}>
                    <div className="flex items-center justify-between rounded-lg border-2 border-border/60 p-4">
                        <div className="flex items-center gap-3">
                            <CreditCard className="h-5 w-5 text-muted-foreground" />
                            {billingLoading ? (
                                <div className="animate-pulse">
                                    <div className="h-4 bg-muted rounded w-32 mb-1" />
                                    <div className="h-3 bg-muted rounded w-20" />
                                </div>
                            ) : paymentMethod ? (
                                <div>
                                    <p className="text-sm font-medium">
                                        •••• •••• •••• {paymentMethod.last4}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {paymentMethod.brand.charAt(0).toUpperCase() + paymentMethod.brand.slice(1)} — {text.settings.expires} {paymentMethod.expMonth}/{paymentMethod.expYear}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">Inget betalkort registrerat</p>
                            )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={openPortal} disabled={portalLoading}>
                            {portalLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : text.actions.edit}
                        </Button>
                    </div>
                </SettingsSection>
            )}

            {/* Billing History - only show for paid users */}
            {!isDemo && (
                <SettingsSection title={text.settings.billingHistory}>
                    {billingLoading ? (
                        <div className="space-y-3 animate-pulse">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-8 bg-muted rounded" />
                            ))}
                        </div>
                    ) : billingItems.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                            Ingen betalningshistorik ännu.
                        </p>
                    ) : (
                        <div className="space-y-1">
                            {billingItems.map((item) => (
                                <BillingHistoryRow
                                    key={item.id}
                                    date={new Date(item.date).toLocaleDateString("sv-SE")}
                                    id={item.id}
                                    paymentMethod={item.type === "credits" ? "Credits" : "Prenumeration"}
                                    amount={item.amount}
                                    status={item.status}
                                    onDownloadReceipt={item.receiptUrl ? () => window.open(item.receiptUrl, "_blank") : undefined}
                                    onViewInvoice={item.invoiceUrl ? () => window.open(item.invoiceUrl, "_blank") : undefined}
                                />
                            ))}
                        </div>
                    )}
                </SettingsSection>
            )}
        </div>
    )
}
