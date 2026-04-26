// AI Components — organized by surface
//
// cards/          → Inline chat cards (Layer 1 compact previews)
// confirmations/  → User approval UI (AI prepares, Human approves)
// documents/      → Downloadable formal documents (PDF/XML)
// blocks/         → Block primitives for walkthrough rendering

// Confirmations
export { ActionCard } from './cards/action-cards/action-card'

// Rows / Blocks
export { DataRow, type DataRowProps } from './cards/rows/data-row'
export { Block, type BlockProps } from './cards/rows/block'

export { SkillPicker, SkillBadge, type SkillItem, type SkillCategory } from './skill-picker'

export * from './mascots'
export { CardRenderer, type CardRendererProps } from './card-renderer'
