/**
 * Löner AI Tools - Index
 *
 * Re-exports all löner-related tools.
 */

export * from './payroll'
export * from './benefits'
export * from './register-employee'

import { payrollTools } from './payroll'
import { benefitsTools } from './benefits'
import { registerEmployeeTool } from './register-employee'

export const lonerTools = [
    ...payrollTools,
    ...benefitsTools,
    registerEmployeeTool
]
