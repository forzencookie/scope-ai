/**
 * Common AI Tools - Index
 *
 * Re-exports all common/cross-cutting tools.
 */

export * from './navigation'
export * from './company'

import { navigationTools } from './navigation'
import { companyTools } from './company'

export const commonTools = [
    ...navigationTools,
    ...companyTools,
]
