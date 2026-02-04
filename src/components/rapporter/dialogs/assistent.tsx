/**
 * Assistent Dialog - Re-exports for backwards compatibility
 * 
 * This file has been refactored. The components are now in separate files:
 * - ai-wizard-dialog.tsx - Base AIWizardDialog component
 * - moms-wizard-dialog.tsx - MomsWizardDialog
 * - inkomst-wizard-dialog.tsx - InkomstWizardDialog
 * - arsredovisning-wizard-dialog.tsx - ArsredovisningWizardDialog
 */

// Re-export base component and types
export {
    AIWizardDialog,
    type AIWizardDialogProps,
    type AIWizardStep1Config,
    type AIWizardStep2Config,
    type AIWizardStep3Config,
} from "./ai-wizard-dialog"

// Re-export specialized wizard dialogs
export { MomsWizardDialog } from "./moms-wizard-dialog"
export { InkomstWizardDialog, type InkomstWizardData } from "./inkomst-wizard-dialog"
export { ArsredovisningWizardDialog, type ArsredovisningWizardData } from "./arsredovisning-wizard-dialog"
