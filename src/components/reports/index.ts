// ============================================
// Reports Components - Central Export
// Re-exports from @/components/skatt for backward compatibility
// ============================================

// Constants and data (still in reports/)
export * from "./constants"

// Re-export from skatt (moved components)
export {
    InkomstWizardDialog,
    ArsredovisningWizardDialog,
    MomsdeklarationContent,
    InkomstdeklarationContent,
    ArsredovisningContent,
    ArsbokslutContent,
    MomsDetailDialog,
    MomsPreview,
} from "@/components/skatt"

// Still in reports/
export { ForetagsstatistikContent } from "./foretagsstatistik-content"
export { ResultatrakningContent, BalansrakningContent } from "./financial-statements"
