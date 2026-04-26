/**
 * Skatt AI Tools - Index
 */

export * from './vat'
export * from './k10'
export * from './periodiseringsfonder'
export * from './investments'
export * from './deadlines'
export * from './tax-calculations'
export * from './tax-records'
export * from './ink2'
export * from './vat-calculator'

import { vatTools } from './vat'
import { k10Tools } from './k10'
import { periodiseringsfonderTools } from './periodiseringsfonder'
import { investmentTools } from './investments'
import { deadlineTools } from './deadlines'
import { taxCalculationTools } from './tax-calculations'
import { taxRecordTools } from './tax-records'
import { ink2Tools } from './ink2'
import { vatCalculatorTools } from './vat-calculator'

export const skattTools = [
    ...vatTools,
    ...k10Tools,
    ...periodiseringsfonderTools,
    ...investmentTools,
    ...deadlineTools,
    ...taxCalculationTools,
    ...taxRecordTools,
    ...ink2Tools,
    ...vatCalculatorTools,
]
