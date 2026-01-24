/**
 * Domain Agents Index
 * 
 * Central export for all domain-specific agents.
 */

// Core Business Agents
export { BokforingAgent, bokforingAgent } from './bokforing'
export { ReceiptAgent, receiptAgent } from './receipts'
export { InvoiceAgent, invoiceAgent } from './invoices'
export { LonerAgent, lonerAgent } from './loner'
export { SkattAgent, skattAgent } from './skatt'
export { RapporterAgent, rapporterAgent } from './rapporter'
export { ComplianceAgent, complianceAgent } from './compliance'

// Platform Control Agents
export { StatistikAgent, statistikAgent } from './statistik'
export { HandelserAgent, handelserAgent } from './handelser'
export { InstallningarAgent, installningarAgent } from './installningar'

// All domain agents for registration
import { bokforingAgent } from './bokforing'
import { receiptAgent } from './receipts'
import { invoiceAgent } from './invoices'
import { lonerAgent } from './loner'
import { skattAgent } from './skatt'
import { rapporterAgent } from './rapporter'
import { complianceAgent } from './compliance'
import { statistikAgent } from './statistik'
import { handelserAgent } from './handelser'
import { installningarAgent } from './installningar'

export const domainAgents = [
    // Core Business
    bokforingAgent,
    receiptAgent,
    invoiceAgent,
    lonerAgent,
    skattAgent,
    rapporterAgent,
    complianceAgent,
    // Platform Control
    statistikAgent,
    handelserAgent,
    installningarAgent,
]
