"use client"

// =============================================================================
// Settings Tabs - Re-export from modular components
// =============================================================================
// This file now serves as a simple re-export hub for all settings tabs.
// Each tab has been modularized into its own file under ./tabs/

export {
    AccountTab,
    CompanyTab,
    IntegrationsTab,
    BillingTab,
    NotificationsTab,
    AppearanceTab,
    LanguageTab,
    EmailTab,
    AccessibilityTab,
    SecurityTab,
    type SettingsFormData,
} from "./tabs"
