"use client"

import { FileText, AlertCircle, TrendingUp, Calendar, Smartphone } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useTextMode } from "@/providers/text-mode-provider"
import { usePreferences } from "@/hooks/use-preferences"
import {
    SettingsPageHeader,
    SettingsSection,
    SettingsToggleItem,
} from "@/components/ui/settings-items"

export function NotificationsTab() {
    const { text } = useTextMode()
    const { preferences, updatePreference, isLoading } = usePreferences()

    return (
        <div className="space-y-6">
            <SettingsPageHeader
                title={text.settings.notificationsSettings}
                description={text.settings.notificationsDesc}
            />

            <SettingsSection title={text.settings.emailNotifications}>
                <div className="space-y-3">
                    <SettingsToggleItem
                        icon={FileText}
                        label={text.settings.newInvoices}
                        description={text.settings.newInvoicesDesc}
                        checked={preferences.notify_new_invoices}
                        onCheckedChange={(checked) => updatePreference('notify_new_invoices', checked)}
                        disabled={isLoading}
                    />
                    <SettingsToggleItem
                        icon={AlertCircle}
                        label={text.settings.paymentReminders}
                        description={text.settings.paymentRemindersDesc}
                        checked={preferences.notify_payment_reminders}
                        onCheckedChange={(checked) => updatePreference('notify_payment_reminders', checked)}
                        disabled={isLoading}
                    />
                    <SettingsToggleItem
                        icon={TrendingUp}
                        label={text.settings.monthlyReports}
                        description={text.settings.monthlyReportsDesc}
                        checked={preferences.notify_monthly_reports}
                        onCheckedChange={(checked) => updatePreference('notify_monthly_reports', checked)}
                        disabled={isLoading}
                    />
                    <SettingsToggleItem
                        icon={Calendar}
                        label={text.settings.importantDates}
                        description={text.settings.importantDatesDesc}
                        checked={preferences.notify_important_dates}
                        onCheckedChange={(checked) => updatePreference('notify_important_dates', checked)}
                        disabled={isLoading}
                    />
                </div>
            </SettingsSection>

            <Separator />

            <SettingsSection title={text.settings.pushNotifications}>
                <SettingsToggleItem
                    icon={Smartphone}
                    label={text.settings.mobileNotifications}
                    description={text.settings.mobileNotificationsDesc}
                    checked={preferences.notify_mobile}
                    onCheckedChange={(checked) => updatePreference('notify_mobile', checked)}
                    disabled={isLoading}
                />
            </SettingsSection>
        </div>
    )
}
