/**
 * Common AI Tools - Index
 *
 * Re-exports all common/cross-cutting tools.
 */

export * from './request-tools'
export * from './read-skill'
export * from './open-overlay'
export * from './navigation'
export * from './company'
export * from './usage'
export * from './settings'
export * from './events'
export * from './memory'
export * from './reconcile-status'
export * from './summary'
export * from './date-events'
export * from './conversations'
export * from './customers'

import { requestToolsTools } from './request-tools'
import { readSkillTools } from './read-skill'
import { openOverlayTools } from './open-overlay'
import { navigationTools } from './navigation'
import { companyTools } from './company'
import { usageTools } from './usage'
import { settingsTools } from './settings'
import { eventTools } from './events'
import { memoryTools } from './memory'
import { reconcileTools } from './reconcile-status'
import { summaryTools } from './summary'
import { dateEventTools } from './date-events'
import { conversationTools } from './conversations'
import { customerTools } from './customers'

export const commonTools = [
    ...requestToolsTools,
    ...readSkillTools,
    ...openOverlayTools,
    ...navigationTools,
    ...companyTools,
    ...usageTools,
    ...settingsTools,
    ...eventTools,
    ...memoryTools,
    ...reconcileTools,
    ...summaryTools,
    ...dateEventTools,
    ...conversationTools,
    ...customerTools,
]
