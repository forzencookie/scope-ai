"use client"

import { CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useTextMode } from "@/providers/text-mode-provider"
import {
    SettingsPageHeader,
    SettingsSection,
    BillingHistoryRow,
} from "@/components/ui/settings-items"

export function BillingTab() {
    const { text } = useTextMode()
    return (
        <div className="space-y-6">
            <SettingsPageHeader
                title={text.settings.billingSettings}
                description={text.settings.billingDesc}
            />

            <div className="rounded-lg p-4 bg-muted/50">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium">Pro-plan</p>
                        <p className="text-sm text-muted-foreground">299 kr/månad</p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full">{text.settings.active}</span>
                </div>
            </div>

            <Separator />

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
        </div>
    )
}
