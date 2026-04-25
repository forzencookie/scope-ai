import type { ComponentType } from "react"

import { AuditCard } from "./chat-tools/information-cards/audit-card"
import { AIUsageCard } from "./cards/AIUsageCard"
import { BuyCreditsPrompt, BuyCreditsCheckout } from "./cards/BuyCreditsCard"

type CardComponent = ComponentType<Record<string, unknown>>

function card(c: ComponentType<never>): CardComponent {
    return c as unknown as CardComponent
}

export const CARD_REGISTRY: Record<string, CardComponent> = {
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
