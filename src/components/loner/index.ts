// @ts-nocheck
// ============================================
// Payroll Components - Central Exports
// ============================================

// Constants and data
export {
    termExplanations,
    allTabs,
    payslips,
    agiReports,
    dividendHistory,
    k10Declarations,
    employees,
    type PayrollTabConfig
} from "./constants"

// Tab content components
export { LonesbeskContent } from "./payslips"
export { BenefitsTab } from "./benefits"
export { default as TeamTab } from "./team"
export { EgenavgifterCalculator as Egenavgifter } from "./egenavgifter"
export { DelagaruttagManager as Delagaruttag } from "./delagaruttag"

// Dialog components
export { PayslipDetailsDialog } from "./dialogs/spec"
export { PayslipCreateDialog } from "./dialogs/create-payslip"
export { BenefitDetailsDialog } from "./dialogs/forman"
export { getBenefitIcon } from "./dialogs/forman/constants"
