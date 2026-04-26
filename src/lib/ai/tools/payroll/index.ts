/**
 * Löner AI Tools - Index
 *
 * Re-exports all löner-related tools.
 */

export * from './payroll'
export * from './benefits'
export * from './register-employee'
export * from './owner-payroll'
export * from './employer-contributions'
export * from './update-employee'

import { payrollTools } from './payroll'
import { benefitsTools } from './benefits'
import { registerEmployeeTool } from './register-employee'
import { ownerPayrollTools } from './owner-payroll'
import { employerContributionsTools } from './employer-contributions'
import { updateEmployeeTools } from './update-employee'

export const lonerTools = [
    ...payrollTools,
    ...benefitsTools,
    registerEmployeeTool,
    ...ownerPayrollTools,
    ...employerContributionsTools,
    ...updateEmployeeTools,
]
