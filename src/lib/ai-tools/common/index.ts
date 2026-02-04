/**
 * Common AI Tools - Index
 *
 * Re-exports all common/cross-cutting tools.
 */

export * from './navigation'
export * from './company'
export * from './usage'
export * from './settings'
export * from './events'
export * from './statistics'
export * from './memory'

import { navigationTools } from './navigation'
import { companyTools } from './company'
import { usageTools } from './usage'
import { settingsTools } from './settings'
import { eventTools } from './events'
import { companyStatisticsTools } from './statistics'
import { memoryTools } from './memory'

export const commonTools = [
    ...navigationTools,
    ...companyTools,
    ...usageTools,
    ...settingsTools,
    ...eventTools,
    ...companyStatisticsTools,
    ...memoryTools,
]
