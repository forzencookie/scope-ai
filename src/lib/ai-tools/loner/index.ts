/**
 * Löner AI Tools - Index
 *
 * Re-exports all löner-related tools.
 */

export * from './payroll'
export * from './benefits'
export * from './register-employee'
export * from './owner-payroll'

import { payrollTools } from './payroll'
import { benefitsTools } from './benefits'
import { registerEmployeeTool } from './register-employee'
import { ownerPayrollTools } from './owner-payroll'

export const lonerTools = [
    ...payrollTools,
    ...benefitsTools,
    registerEmployeeTool,
    ...ownerPayrollTools,
]
