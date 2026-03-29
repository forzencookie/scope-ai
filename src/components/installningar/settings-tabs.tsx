"use client"

// =============================================================================
// Settings Tabs - Re-export from modular components
// =============================================================================
// Each tab is self-contained: owns its data, owns its save logic.
// settings-overlay.tsx is a pure router — no form state.

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
} from "./tabs"
