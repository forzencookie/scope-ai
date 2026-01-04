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
export { LonesbeskContent } from "./lonebesked"
export { AGIContent } from "@/components/skatt"

// Dialog components
export { PayslipDetailsDialog } from "./dialogs/spec"
export { PayslipCreateDialog } from "./dialogs/lonebesked"
export { BenefitDetailsDialog, getBenefitIcon } from "./dialogs/forman"
