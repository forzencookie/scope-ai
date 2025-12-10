// ============================================
// Receipts Mock Data
// ============================================

import { RECEIPT_STATUSES } from "@/lib/status-types"
import type { Receipt } from "@/types"

// Re-export type for convenience
export type { Receipt }

export const mockReceipts: Receipt[] = [
    {
        id: "1",
        supplier: "Adobe Systems",
        date: "May 2, 2024",
        amount: "-239.00 kr",
        status: RECEIPT_STATUSES.VERIFIED,
        category: "Software",
        attachment: "invoice_adobe_may.pdf",
    },
    {
        id: "2",
        supplier: "Uber Receipts",
        date: "May 5, 2024",
        amount: "-189.00 kr",
        status: RECEIPT_STATUSES.PENDING,
        category: "Travel",
        attachment: "uber_ride_may5.pdf",
    },
    {
        id: "3",
        supplier: "Amazon Web Services",
        date: "May 10, 2024",
        amount: "-450.00 kr",
        status: RECEIPT_STATUSES.VERIFIED,
        category: "Hosting",
        attachment: "aws_invoice_may.pdf",
    },
    {
        id: "4",
        supplier: "Kjell & Company",
        date: "May 12, 2024",
        amount: "-899.00 kr",
        status: RECEIPT_STATUSES.PROCESSING,
        category: "Office Supplies",
        attachment: "receipt_kjell.jpg",
    },
    {
        id: "5",
        supplier: "Apple Store",
        date: "May 15, 2024",
        amount: "-24,995.00 kr",
        status: RECEIPT_STATUSES.REVIEW_NEEDED,
        category: "Equipment",
        attachment: "macbook_pro.pdf",
    },
]

// Re-export status for convenience
export { RECEIPT_STATUSES }
