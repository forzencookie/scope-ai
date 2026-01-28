// AI Components
// Components for AI chat display and interaction

export { ConfirmationCard, ReceiptCard, TransactionCard } from './confirmation-card'
export { TaskChecklist, createTaskItems } from './task-checklist'
export { MentionPopover, MentionBadge, useMentionItems, type MentionItem, type MentionCategory } from './mention-popover'
export { ActivityCard, type ActivityCardProps, type ActivityChange } from './activity-card'
export { ComparisonTable, type ComparisonTableProps, type ComparisonRow } from './comparison-table'
export { ActionTriggerChip, type ActionTriggerDisplay, type ActionTriggerIcon } from './action-trigger-chip'

// AI Overlay Experience
export { AIOverlay } from './ai-overlay'
export {
    PixelDog,
    PixelBear,
    PixelGiraffe,
    MascotCookingScene,
    MascotCelebrationScene,
    MascotPlayingScene,
    MascotReadingScene,
    MascotSearchingScene,
    MascotErrorScene,
    type SceneType,
} from './pixel-mascots'
export { CardRenderer, type CardRendererProps } from './card-renderer'
export { AIHighlight, useAIHighlight } from './ai-highlight'
