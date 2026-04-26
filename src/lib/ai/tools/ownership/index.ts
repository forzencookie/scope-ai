/**
 * Parter AI Tools - Index
 *
 * Re-exports all parter-related tools.
 */

export * from './shareholders'
export * from './partners'
export * from './compliance'
export * from './board'

import { shareholderTools } from './shareholders'
import { partnerTools } from './partners'
import { complianceTools } from './compliance'
import { boardTools } from './board'

export const parterTools = [
    ...shareholderTools,
    ...partnerTools,
    ...complianceTools,
    ...boardTools,
]
