import type { ComponentType } from "react"

import { InvoiceCard } from "./cards/InvoiceCard"
import { EmployeeCard } from "./cards/EmployeeCard"
import { ActivityFeedCard } from "./chat-tools/information-cards/activity-feed-card"
import { SummaryCard } from "./chat-tools/information-cards/summary-card"
import { AuditCard } from "./chat-tools/information-cards/audit-card"
import { AIUsageCard } from "./cards/AIUsageCard"
import { BuyCreditsPrompt, BuyCreditsCheckout } from "./cards/BuyCreditsCard"

type CardComponent = ComponentType<Record<string, unknown>>

function card(c: ComponentType<never>): CardComponent {
    return c as unknown as CardComponent
}

export const CARD_REGISTRY: Record<string, CardComponent> = {
    invoicecard: card(InvoiceCard),
    invoice:     card(InvoiceCard),

    summarycard:       card(SummaryCard),
    summary:           card(SummaryCard),
    calculation:       card(SummaryCard),
    salarycalculation: card(SummaryCard),
    k10summary:        card(SummaryCard),
    genericlist:       card(SummaryCard),
    list:              card(SummaryCard),

    employeepreview: card(EmployeeCard),
    employee:        card(EmployeeCard),
    newemployee:     card(EmployeeCard),

    taskchecklist:  card(ActivityFeedCard),
    checklist:      card(ActivityFeedCard),
    statuslist:     card(ActivityFeedCard),
    statusoverview: card(ActivityFeedCard),
    manadsavslut:   card(ActivityFeedCard),
    openitems:      card(ActivityFeedCard),
    activityfeed:   card(ActivityFeedCard),
    historik:       card(ActivityFeedCard),
    events:         card(ActivityFeedCard),

    balanceauditcard:  card(AuditCard),
    balanskontroll:    card(AuditCard),
    audit:             card(AuditCard),
    resultatauditcard: card(AuditCard),
    resultatkontroll:  card(AuditCard),

    aiusagecard:        card(AIUsageCard),
    usage:              card(AIUsageCard),
    buycreditsprompt:   card(BuyCreditsPrompt),
    creditsprompt:      card(BuyCreditsPrompt),
    buycreditscheckout: card(BuyCreditsCheckout),
    creditscheckout:    card(BuyCreditsCheckout),
    buyconfirm:         card(BuyCreditsCheckout),
}
