// AI Components — organized by surface
//
// cards/          → Inline chat cards (Layer 1 compact previews)
// confirmations/  → User approval UI (AI prepares, Human approves)
// documents/      → Downloadable formal documents (PDF/XML)
// blocks/         → Block primitives for walkthrough rendering

// Confirmations
export { ActionCard } from './chat-tools/action-cards/action-card'

// Rows / Blocks
export { DataRow, type DataRowProps } from './chat-tools/rows/data-row'
export { Block, type BlockProps } from './chat-tools/rows/block'

export { MentionPopover, MentionBadge, type MentionItem, type MentionCategory } from './mention-popover'

export * from './mascots'
export { CardRenderer, type CardRendererProps } from './card-renderer'
