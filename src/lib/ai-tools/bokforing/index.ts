/**
 * Bokföring AI Tools - Index
 *
 * Re-exports all bokföring-related tools.
 */

export * from './transactions'
export * from './invoices'
export * from './receipts'
export * from './reports'
export * from './create-verification'
export * from './inventarier'
export * from './verifications'
export * from './accounts'
export * from './audit'
export * from './resultat-audit'

import { transactionTools } from './transactions'
import { invoiceTools } from './invoices'
import { receiptTools } from './receipts'
import { reportTools } from './reports'
import { createVerificationTool } from './create-verification'
import { inventarierTools } from './inventarier'
import { verificationExtendedTools } from './verifications'
import { accountTools } from './accounts'
import { auditTools } from './audit'
import { resultatAuditTools } from './resultat-audit'

export const bokforingTools = [
    ...transactionTools,
    ...invoiceTools,
    ...receiptTools,
    ...reportTools,
    createVerificationTool,
    ...inventarierTools,
    ...verificationExtendedTools,
    ...accountTools,
    ...auditTools,
    ...resultatAuditTools,
]
