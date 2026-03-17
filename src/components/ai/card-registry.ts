/**
 * Card registry — maps card type strings to React components.
 * Cards are Layer 1 (compact inline previews in chat).
 * Blocks are Layer 2 (detailed walkthrough overlay content).
 * These are complementary systems, not replacements.
 */
import type { ComponentType } from "react"
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
import { ResultatAuditCard } from "./previews/bokforing/resultat-audit-card"

// Billing/Usage Cards
import { AIUsageCard } from "./cards/AIUsageCard"
import { BuyCreditsPrompt, BuyCreditsCheckout } from "./cards/BuyCreditsCard"

// Each card component has its own specific props interface. The registry stores
// them heterogeneously — callers spread parsed JSON data as props at runtime.
// We use a permissive function signature so diverse components can coexist.
//
// At the call site (card-renderer.tsx), props are always Record<string, unknown>
// built from parsed AI output, so the loose typing here is accurate.
type CardComponent = ComponentType<Record<string, unknown>>

// Widening helper — accepts any React component and returns CardComponent.
// This is safe because the renderer always passes Record<string, unknown> props.
// Widening helper — bridges specific component prop types to the generic registry type.
// This uses `unknown` for the input and returns CardComponent for the map.
// Safe because the card-renderer always passes Record<string, unknown> props at runtime.
function card(c: ComponentType<never>): CardComponent {
    return c as unknown as CardComponent
}

export const CARD_REGISTRY: Record<string, CardComponent> = {
    // Basic Cards
    receiptcard: card(ReceiptCard),
    receipt: card(ReceiptCard),

    transactioncard: card(TransactionCard),
    transaction: card(TransactionCard),

    invoicecard: card(InvoiceCard),
    invoice: card(InvoiceCard),

    taskchecklist: card(TaskChecklist),
    checklist: card(TaskChecklist),

    activitycard: card(ActivityCard),
    activity: card(ActivityCard),

    summarycard: card(SummaryCard),
    summary: card(SummaryCard),
    calculation: card(SummaryCard),
    salarycalculation: card(SummaryCard),
    k10summary: card(SummaryCard),

    // Document Previews
    payslippreview: card(PayslipCard),
    lonebesked: card(PayslipCard),

    vatformpreview: card(VATReportCard),
    momsredovisning: card(VATReportCard),
    vat: card(VATReportCard),

    agiformpreview: card(AGIReportCard),
    agi: card(AGIReportCard),
    arbetsgivardeklaration: card(AGIReportCard),

    boardminutespreview: card(BoardMinutesCard),
    styrelseprotokoll: card(BoardMinutesCard),
    protocol: card(BoardMinutesCard),
    meeting: card(BoardMinutesCard),

    financialreportpreview: card(FinancialReportCard),
    financialreport: card(FinancialReportCard),
    resultat: card(FinancialReportCard),
    balans: card(FinancialReportCard),
    resultatbalans: card(FinancialReportCard),

    shareregisterpreview: card(ShareRegisterCard),
    shareregister: card(ShareRegisterCard),
    aktiebok: card(ShareRegisterCard),
    shares: card(ShareRegisterCard),

    k10formpreview: card(K10Card),
    k10: card(K10Card),

    taxdeclarationpreview: card(TaxDeclarationCard),
    taxdeclaration: card(TaxDeclarationCard),
    inkomstdeklaration: card(TaxDeclarationCard),
    ink2: card(TaxDeclarationCard),

    annualreportpreview: card(AnnualReportCard),
    annualreport: card(AnnualReportCard),
    arsredovisning: card(AnnualReportCard),

    roadmappreview: card(RoadmapCard),
    roadmap: card(RoadmapCard),
    plan: card(RoadmapCard),
    planering: card(RoadmapCard),

    employeepreview: card(EmployeeCard),
    employee: card(EmployeeCard),
    newemployee: card(EmployeeCard),

    verificationpreview: card(VerificationCard),
    verification: card(VerificationCard),

    // Lists (use SmartListCard to handle raw array data)
    genericlist: card(SmartListCard),
    list: card(SmartListCard),
    transactionstable: card(SmartListCard),
    receiptstable: card(SmartListCard),
    invoicestable: card(SmartListCard),
    employeelist: card(SmartListCard),
    payslipstable: card(SmartListCard),
    shareholderlist: card(SmartListCard),
    partnerlist: card(SmartListCard),
    memberlist: card(SmartListCard),
    deadlineslist: card(SmartListCard),
    benefitstable: card(SmartListCard),
    vatsummary: card(SmartListCard),

    // Audit
    balanceauditcard: card(BalanceAuditCard),
    balanskontroll: card(BalanceAuditCard),
    audit: card(BalanceAuditCard),

    resultatauditcard: card(ResultatAuditCard),
    resultatkontroll: card(ResultatAuditCard),

    // Billing/Usage
    aiusagecard: card(AIUsageCard),
    usage: card(AIUsageCard),

    buycreditsprompt: card(BuyCreditsPrompt),
    creditsprompt: card(BuyCreditsPrompt),

    buycreditscheckout: card(BuyCreditsCheckout),
    creditscheckout: card(BuyCreditsCheckout),
    buyconfirm: card(BuyCreditsCheckout),
}
