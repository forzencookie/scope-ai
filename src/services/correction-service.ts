/**
 * Correction Service (Rättelseverifikat)
 * 
 * Per Swedish Bokföringslag, original verifications must never be deleted.
 * Instead, corrections are made by creating a new verification that:
 * 1. Reverses the original entries (debit ↔ credit)
 * 2. Books the corrected entries
 * 
 * This preserves the full audit trail as required by law.
 */

import { verificationService, type VerificationEntry, type Verification } from './verification-service'
import { logAuditEntry } from '@/lib/audit'

// =============================================================================
// Types
// =============================================================================

export interface CorrectionPreview {
    /** The original verification being corrected */
    original: Verification
    /** Reversal entries (mirror of original) */
    reversalEntries: VerificationEntry[]
    /** The new corrected entries */
    correctedEntries: VerificationEntry[]
}

export interface CorrectionResult {
    /** ID of the reversal verification */
    reversalVerificationId: string
    /** ID of the correction verification (if new entries provided) */
    correctionVerificationId?: string
}

// =============================================================================
// Service
// =============================================================================

export const correctionService = {
    /**
     * Preview a correction — shows what reversal entries will be created.
     * Does NOT persist anything.
     */
    async previewCorrection(
        verificationId: string,
        correctedEntries?: VerificationEntry[]
    ): Promise<CorrectionPreview> {
        const original = await verificationService.getVerificationById(verificationId)
        if (!original) {
            throw new Error('Verifikation hittades inte')
        }

        // Create reversal: swap debit ↔ credit for each line
        const reversalEntries: VerificationEntry[] = original.entries.map(entry => ({
            account: entry.account,
            accountName: entry.accountName,
            debit: entry.credit,
            credit: entry.debit,
            description: `Rättelse: ${entry.description || entry.accountName || entry.account}`,
        }))

        return {
            original,
            reversalEntries,
            correctedEntries: correctedEntries || [],
        }
    },

    /**
     * Execute a correction:
     * 1. Creates a reversal verification (same series + date, adds "RÄTTELSE" prefix)
     * 2. If correctedEntries are provided, creates a new verification with correct amounts
     * 
     * Both reference the original verification via sourceId.
     */
    async executeCorrection(
        verificationId: string,
        correctedEntries?: VerificationEntry[],
        correctionDescription?: string
    ): Promise<CorrectionResult> {
        const preview = await this.previewCorrection(verificationId, correctedEntries)
        const original = preview.original

        // Step 1: Create reversal verification
        const reversal = await verificationService.createVerification({
            series: original.series,
            date: new Date().toISOString().split('T')[0], // Today's date
            description: `RÄTTELSE av ${original.series}${original.number}: ${original.description}`,
            entries: preview.reversalEntries,
            sourceType: 'correction_reversal',
            sourceId: verificationId,
        })

        const result: CorrectionResult = {
            reversalVerificationId: reversal.id,
        }

        // Step 2: Create correction verification with new entries (if provided)
        if (correctedEntries && correctedEntries.length > 0) {
            // Validate balance
            const totalDebit = correctedEntries.reduce((sum, e) => sum + (e.debit || 0), 0)
            const totalCredit = correctedEntries.reduce((sum, e) => sum + (e.credit || 0), 0)
            if (Math.abs(totalDebit - totalCredit) > 0.01) {
                throw new Error(`Korrigerade poster är inte balanserade: debet ${totalDebit}, kredit ${totalCredit}`)
            }

            const correction = await verificationService.createVerification({
                series: original.series,
                date: new Date().toISOString().split('T')[0],
                description: correctionDescription || `Korrigering av ${original.series}${original.number}`,
                entries: correctedEntries,
                sourceType: 'correction',
                sourceId: verificationId,
            })

            result.correctionVerificationId = correction.id
        }

        // Audit trail: log correction with reference to original verification
        logAuditEntry({
            action: 'updated',
            entityType: 'verifications',
            entityId: verificationId,
            entityName: `Rättelse av ${original.series}${original.number}`,
            metadata: {
                originalVerificationId: verificationId,
                reversalVerificationId: result.reversalVerificationId,
                correctionVerificationId: result.correctionVerificationId,
            },
        })

        return result
    },
}
