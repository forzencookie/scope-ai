# Cleanup Backlog

Files and folders to remove once the basics are working.

## APIs to Delete (Confirmed)

| Path | Reason |
|------|--------|
| `/api/bolagsverket` | Merge into `/receiver` |
| `/api/skatteverket` | Merge into `/receiver` |
| `/api/receipts/processed` | Merge into `/api/receipts` |

## API Consolidation

| Path | Reason | Action |
|------|--------|--------|
| `/api/transactions/processed` | Redundant if exists | Check & merge |
| `/api/invoices/[id]/pay` | May not be needed | Evaluate usage |
| `/api/invoices/[id]/book` | May not be needed | Evaluate usage |

## Pages to Review

| Path | Status | Notes |
|------|--------|-------|
| `/receiver` | Keep | External data receiver |
| `/simulator` | Keep | Testing tool |
| `/users` | Review | Registration page |

## Services/Lib Files

Check for unused services after API cleanup is complete.

---

*Last updated: 2024-12-18*
