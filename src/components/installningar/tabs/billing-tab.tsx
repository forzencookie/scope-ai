"use client"

import { CreditCard, Sparkles, Zap, AlertCircle, TrendingUp } from "lucide-react"
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
                        <Button size="sm" className="mt-3">
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

function BuyCreditsSection() {
    const { isDemo } = useSubscription()

    if (isDemo) return null

    return (
        <SettingsSection 
            title="Köp extra credits" 
            description="Om du förbrukar din månadskvot kan du köpa extra tokens"
        >
            <div className="grid gap-3 sm:grid-cols-3">
                {CREDIT_PACKAGES.map((pkg) => (
                    <button
                        key={pkg.tokens}
                        className={cn(
                            "relative rounded-lg border-2 p-4 text-left transition-colors",
                            "hover:border-primary hover:bg-accent/50",
                            pkg.popular && "border-primary bg-primary/5"
                        )}
                        onClick={() => {
                            // TODO: Integrate with Stripe
                            alert(`Köp ${pkg.label} för ${pkg.price} kr`)
                        }}
                    >
                        {pkg.popular && (
                            <span className="absolute -top-2 left-3 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                                Populär
                            </span>
                        )}
                        <div className="font-semibold">{pkg.label}</div>
                        <div className="text-2xl font-bold mt-1">{pkg.price} kr</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            {(pkg.price / (pkg.tokens / 1000)).toFixed(2)} kr/1k tokens
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

export function BillingTab() {
    const { text } = useTextMode()
    const { tierName, isDemo } = useSubscription()

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
                            {isDemo ? "Gratis" : "299 kr/månad"}
                        </p>
                    </div>
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
                            <div>
                                <p className="text-sm font-medium">•••• •••• •••• 4242</p>
                                <p className="text-xs text-muted-foreground">{text.settings.expires} 12/26</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm">{text.actions.edit}</Button>
                    </div>
                </SettingsSection>
            )}

            {/* Billing History - only show for paid users */}
            {!isDemo && (
                <SettingsSection title={text.settings.billingHistory}>
                    <div className="space-y-1">
                        <BillingHistoryRow
                            date="2024-01-01"
                            id="INV24001"
                            paymentMethod="Visa"
                            cardLastFour="4242"
                            amount="299 kr"
                            status="Betald"
                            onDownloadReceipt={() => alert("Laddar ner kvitto...")}
                            onViewInvoice={() => alert("Öppnar faktura...")}
                        />
                        <BillingHistoryRow
                            date="2023-12-01"
                            id="INV23012"
                            paymentMethod="Visa"
                            cardLastFour="4242"
                            amount="299 kr"
                            status="Betald"
                            onDownloadReceipt={() => alert("Laddar ner kvitto...")}
                            onViewInvoice={() => alert("Öppnar faktura...")}
                        />
                        <BillingHistoryRow
                            date="2023-11-01"
                            id="INV23011"
                            paymentMethod="Mastercard"
                            cardLastFour="8888"
                            amount="299 kr"
                            status="Betald"
                            onDownloadReceipt={() => alert("Laddar ner kvitto...")}
                            onViewInvoice={() => alert("Öppnar faktura...")}
                        />
                    </div>
                </SettingsSection>
            )}
        </div>
    )
}
