import { ComponentType } from "react"
import { ActivityCard } from "./activity-card"
import { ReceiptCard } from "./cards/ReceiptCard"
import { TransactionCard } from "./cards/TransactionCard"
import { InvoiceCard } from "./cards/InvoiceCard"
import { TaskChecklist } from "./cards/TaskChecklist"
import { SummaryCard } from "./cards/SummaryCard"
import { SmartListCard } from "./cards/GenericListCard"

// Preview Wrappers
import { VATReportCard } from "./cards/VATReportCard"
import { AGIReportCard } from "./cards/AGIReportCard"
import { PayslipCard } from "./cards/PayslipCard"
import { BoardMinutesCard } from "./cards/BoardMinutesCard"
import { FinancialReportCard } from "./cards/FinancialReportCard"
import { ShareRegisterCard } from "./cards/ShareRegisterCard"
import { TaxDeclarationCard } from "./cards/TaxDeclarationCard"
import { AnnualReportCard } from "./cards/AnnualReportCard"
import { K10Card } from "./cards/K10Card"
import { RoadmapCard } from "./cards/RoadmapCard"
import { EmployeeCard } from "./cards/EmployeeCard"
import { VerificationCard } from "./cards/VerificationCard"

// Audit Cards
import { BalanceAuditCard } from "./previews/bokforing/balance-audit-card"

// Billing/Usage Cards
import { AIUsageCard } from "./cards/AIUsageCard"
import { BuyCreditsPrompt, BuyCreditsCheckout } from "./cards/BuyCreditsCard"

// Type definition for the registry
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CardComponent = ComponentType<any>

export const CARD_REGISTRY: Record<string, CardComponent> = {
    // Basic Cards
    receiptcard: ReceiptCard,
    receipt: ReceiptCard,

    transactioncard: TransactionCard,
    transaction: TransactionCard,

    invoicecard: InvoiceCard,
    invoice: InvoiceCard,

    taskchecklist: TaskChecklist,
    checklist: TaskChecklist,

    activitycard: ActivityCard,
    activity: ActivityCard,

    summarycard: SummaryCard,
    summary: SummaryCard,
    calculation: SummaryCard,
    salarycalculation: SummaryCard,
    k10summary: SummaryCard,

    // Document Previews
    payslippreview: PayslipCard,
    lonebesked: PayslipCard,

    vatformpreview: VATReportCard,
    momsredovisning: VATReportCard,
    vat: VATReportCard,

    agiformpreview: AGIReportCard,
    agi: AGIReportCard,
    arbetsgivardeklaration: AGIReportCard,

    boardminutespreview: BoardMinutesCard,
    styrelseprotokoll: BoardMinutesCard,
    protocol: BoardMinutesCard,
    meeting: BoardMinutesCard,

    financialreportpreview: FinancialReportCard,
    financialreport: FinancialReportCard,
    resultat: FinancialReportCard,
    balans: FinancialReportCard,
    resultatbalans: FinancialReportCard,

    shareregisterpreview: ShareRegisterCard,
    shareregister: ShareRegisterCard,
    aktiebok: ShareRegisterCard,
    shares: ShareRegisterCard,

    k10formpreview: K10Card,
    k10: K10Card,

    taxdeclarationpreview: TaxDeclarationCard,
    taxdeclaration: TaxDeclarationCard,
    inkomstdeklaration: TaxDeclarationCard,
    ink2: TaxDeclarationCard,

    annualreportpreview: AnnualReportCard,
    annualreport: AnnualReportCard,
    arsredovisning: AnnualReportCard,

    roadmappreview: RoadmapCard,
    roadmap: RoadmapCard,
    plan: RoadmapCard,
    planering: RoadmapCard,

    employeepreview: EmployeeCard,
    employee: EmployeeCard,
    newemployee: EmployeeCard,

    verificationpreview: VerificationCard,
    verification: VerificationCard,

    // Lists (use SmartListCard to handle raw array data)
    genericlist: SmartListCard,
    list: SmartListCard,
    transactionstable: SmartListCard,
    receiptstable: SmartListCard,
    invoicestable: SmartListCard,
    employeelist: SmartListCard,
    payslipstable: SmartListCard,
    shareholderlist: SmartListCard,
    partnerlist: SmartListCard,
    memberlist: SmartListCard,
    deadlineslist: SmartListCard,
    benefitstable: SmartListCard,
    vatsummary: SmartListCard,

    // Audit
    balanceauditcard: BalanceAuditCard,
    balanskontroll: BalanceAuditCard,
    audit: BalanceAuditCard,

    // Billing/Usage
    aiusagecard: AIUsageCard,
    usage: AIUsageCard,

    buycreditsprompt: BuyCreditsPrompt,
    creditsprompt: BuyCreditsPrompt,
    
    buycreditscheckout: BuyCreditsCheckout,
    creditscheckout: BuyCreditsCheckout,
    buyconfirm: BuyCreditsCheckout,
}
