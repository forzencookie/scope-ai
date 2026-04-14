// AI Components — organized by surface
//
// cards/          → Inline chat cards (Layer 1 compact previews)
// confirmations/  → User approval UI (AI prepares, Human approves)
// documents/      → Downloadable formal documents (PDF/XML)
// blocks/         → Block primitives for walkthrough rendering

// Confirmations
export { ConfirmationCard } from './confirmations/confirmation-card'

export { ComparisonTable, type ComparisonTableProps, type ComparisonRow } from './confirmations/comparison-table'
export { ActionTriggerChip, type ActionTriggerDisplay, type ActionTriggerIcon } from './confirmations/action-trigger-chip'

// Cards
export { ActivityFeedCard, type ActivityFeedCardProps, type FeedEvent, type FeedAction, type FeedEntity } from './cards/ActivityFeedCard'
export { MentionPopover, MentionBadge, useMentionItems, type MentionItem, type MentionCategory } from './mention-popover'

// AI Overlay Experience
export { AIOverlay } from './ai-overlay'
export {
    PixelDog,
    PixelBear,
    PixelGiraffe,
    type SceneType,
} from './pixel-mascots'
export { CardRenderer, type CardRendererProps } from './card-renderer'
export { AIHighlight, useAIHighlight } from './ai-highlight'
