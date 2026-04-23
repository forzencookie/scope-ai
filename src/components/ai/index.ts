// AI Components — organized by surface
//
// cards/          → Inline chat cards (Layer 1 compact previews)
// confirmations/  → User approval UI (AI prepares, Human approves)
// documents/      → Downloadable formal documents (PDF/XML)
// blocks/         → Block primitives for walkthrough rendering

// Confirmations
export { ActionCard } from './chat-tools/action-cards/action-card'



// Cards
export { ActivityFeedCard, type ActivityFeedCardProps, type FeedEvent, type FeedAction, type FeedEntity } from './chat-tools/information-cards/activity-feed-card'
export { MentionPopover, MentionBadge, useMentionItems, type MentionItem, type MentionCategory } from './mention-popover'

export * from './mascots'
export { CardRenderer, type CardRendererProps } from './card-renderer'
