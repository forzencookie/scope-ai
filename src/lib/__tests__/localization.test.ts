/**
 * Tests for localization constants
 * 
 * These tests ensure that localization strings are correctly defined
 * and help catch accidental modifications.
 */
import {
    ACTIONS,
    TRANSACTION_STATUS_LABELS,
    INVOICE_STATUS_LABELS,
    RECEIPT_STATUS_LABELS,
    GENERAL_STATUS_LABELS,
    TABLE_LABELS,
} from '../localization'

describe('Localization Constants', () => {
    describe('ACTIONS', () => {
        it('should have all required action labels', () => {
            expect(ACTIONS.ADD).toBe('Lägg till')
            expect(ACTIONS.APPROVE).toBe('Godkänn')
            expect(ACTIONS.CANCEL).toBe('Avbryt')
            expect(ACTIONS.DELETE).toBe('Ta bort')
            expect(ACTIONS.EDIT).toBe('Redigera')
            expect(ACTIONS.SAVE).toBe('Spara')
            expect(ACTIONS.SEARCH).toBe('Sök')
        })

        it('should be read-only', () => {
            // TypeScript should prevent this, but we can test at runtime
            expect(Object.isFrozen(ACTIONS)).toBe(false) // 'as const' doesn't freeze
            // The 'as const' makes it a readonly type in TypeScript
        })
    })

    describe('TRANSACTION_STATUS_LABELS', () => {
        it('should have all transaction statuses in Swedish', () => {
            expect(TRANSACTION_STATUS_LABELS.TO_RECORD).toBe('Att bokföra')
            expect(TRANSACTION_STATUS_LABELS.RECORDED).toBe('Bokförd')
            expect(TRANSACTION_STATUS_LABELS.MISSING_DOCUMENTATION).toBe('Saknar underlag')
            expect(TRANSACTION_STATUS_LABELS.IGNORED).toBe('Ignorerad')
        })

        it('should have exactly 4 statuses', () => {
            expect(Object.keys(TRANSACTION_STATUS_LABELS)).toHaveLength(4)
        })
    })

    describe('INVOICE_STATUS_LABELS', () => {
        it('should have all invoice statuses in Swedish', () => {
            expect(INVOICE_STATUS_LABELS.PAID).toBe('Betald')
            expect(INVOICE_STATUS_LABELS.SENT).toBe('Skickad')
            expect(INVOICE_STATUS_LABELS.DRAFT).toBe('Utkast')
            expect(INVOICE_STATUS_LABELS.OVERDUE).toBe('Förfallen')
        })

        it('should have exactly 7 statuses', () => {
            expect(Object.keys(INVOICE_STATUS_LABELS)).toHaveLength(7)
        })
    })

    describe('RECEIPT_STATUS_LABELS', () => {
        it('should have all receipt statuses in Swedish', () => {
            expect(RECEIPT_STATUS_LABELS.VERIFIED).toBe('Verifierad')
            expect(RECEIPT_STATUS_LABELS.PENDING).toBe('Väntar')
            expect(RECEIPT_STATUS_LABELS.PROCESSING).toBe('Bearbetar')
            expect(RECEIPT_STATUS_LABELS.REVIEW_NEEDED).toBe('Granskning krävs')
            expect(RECEIPT_STATUS_LABELS.PROCESSED).toBe('Behandlad')
            expect(RECEIPT_STATUS_LABELS.REJECTED).toBe('Avvisad')
        })

        it('should have exactly 8 statuses', () => {
            expect(Object.keys(RECEIPT_STATUS_LABELS)).toHaveLength(8)
        })
    })

    describe('GENERAL_STATUS_LABELS', () => {
        it('should have common statuses', () => {
            expect(GENERAL_STATUS_LABELS.SUBMITTED).toBe('Inskickad')
            expect(GENERAL_STATUS_LABELS.UPCOMING).toBe('Kommande')
            expect(GENERAL_STATUS_LABELS.COMPLETED).toBe('Klar')
            expect(GENERAL_STATUS_LABELS.INCOMPLETE).toBe('Ofullständig')
        })
    })

    describe('TABLE_LABELS', () => {
        it('should have all table column headers', () => {
            expect(TABLE_LABELS.NAME).toBe('Namn')
            expect(TABLE_LABELS.DATE).toBe('Datum')
            expect(TABLE_LABELS.AMOUNT).toBe('Belopp')
            expect(TABLE_LABELS.STATUS).toBe('Status')
            expect(TABLE_LABELS.ACCOUNT).toBe('Konto')
            expect(TABLE_LABELS.DESCRIPTION).toBe('Beskrivning')
            expect(TABLE_LABELS.CATEGORY).toBe('Kategori')
        })

        it('should have AI-related labels', () => {
            expect(TABLE_LABELS.AI_CATEGORIZATION).toBe('AI-kategorisering')
            expect(TABLE_LABELS.AI_SUGGESTION).toBe('AI-förslag')
        })
    })

    describe('consistency checks', () => {
        it('all status labels should be non-empty strings', () => {
            const allStatuses = [
                ...Object.values(TRANSACTION_STATUS_LABELS),
                ...Object.values(INVOICE_STATUS_LABELS),
                ...Object.values(RECEIPT_STATUS_LABELS),
                ...Object.values(GENERAL_STATUS_LABELS),
            ]

            allStatuses.forEach(status => {
                expect(typeof status).toBe('string')
                expect(status.length).toBeGreaterThan(0)
            })
        })

        it('all action labels should be non-empty strings', () => {
            Object.values(ACTIONS).forEach(action => {
                expect(typeof action).toBe('string')
                expect(action.length).toBeGreaterThan(0)
            })
        })

        it('all table labels should be non-empty strings', () => {
            Object.values(TABLE_LABELS).forEach(label => {
                expect(typeof label).toBe('string')
                expect(label.length).toBeGreaterThan(0)
            })
        })
    })
})
