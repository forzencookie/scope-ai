"use client"

import { FileText, AlertCircle, TrendingUp, Calendar, Smartphone } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useTextMode } from "@/providers/text-mode-provider"
import {
    SettingsPageHeader,
    SettingsSection,
    SettingsToggleItem,
} from "@/components/ui/settings-items"

export function NotificationsTab() {
    const { text } = useTextMode()
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
                        checked
                    />
                    <SettingsToggleItem
                        icon={AlertCircle}
                        label={text.settings.paymentReminders}
                        description={text.settings.paymentRemindersDesc}
                        checked
                    />
                    <SettingsToggleItem
                        icon={TrendingUp}
                        label={text.settings.monthlyReports}
                        description={text.settings.monthlyReportsDesc}
                    />
                    <SettingsToggleItem
                        icon={Calendar}
                        label={text.settings.importantDates}
                        description={text.settings.importantDatesDesc}
                    />
                </div>
            </SettingsSection>

            <Separator />

            <SettingsSection title={text.settings.pushNotifications}>
                <SettingsToggleItem
                    icon={Smartphone}
                    label={text.settings.mobileNotifications}
                    description={text.settings.mobileNotificationsDesc}
                />
            </SettingsSection>
        </div>
    )
}
