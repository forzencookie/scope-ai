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
export { LonesbeskContent } from "./lonebesked-content"
export { AGIContent } from "@/components/skatt/agi-content"
export { UtdelningContent } from "./utdelning-content"

// Dialog components
export { PayslipDetailsDialog } from "./payslip-details-dialog"
