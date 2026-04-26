/**
 * Bokföring AI Tools - Index
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
export * from './year-end'
export * from './period'

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
import { yearEndTools } from './year-end'
import { periodTools } from './period'

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
    ...yearEndTools,
    ...periodTools,
]
