/**
 * Skatt AI Tools - Index
 *
 * Re-exports all skatt-related tools.
 */

export * from './vat'
export * from './k10'
export * from './periodiseringsfonder'
export * from './investments'

import { vatTools } from './vat'
import { k10Tools } from './k10'
import { periodiseringsfonderTools } from './periodiseringsfonder'
import { investmentTools } from './investments'

export const skattTools = [
    ...vatTools,
    ...k10Tools,
    ...periodiseringsfonderTools,
    ...investmentTools,
]
