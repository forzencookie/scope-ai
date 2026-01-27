/**
 * Planning AI Tools - Index
 *
 * Re-exports all planning/roadmap-related tools.
 */

export * from './roadmap'

import { roadmapTools } from './roadmap'

// Also include the legacy generator tool for backwards compatibility
import { generateRoadmapTool } from './roadmap-generator'

export const planningTools = [
    ...roadmapTools,
    generateRoadmapTool,
]
