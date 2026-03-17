# Fix: Database Schema

> **Thinking:** 🟢 Medium
> **Status:** 🟢 Complete

## Vision vs Reality

The database schema has been successfully aligned with the AI-native vision.

### What exists
- ✅ **[DONE]** `inbox_items` and `bank_connections` purged.
- ✅ **[DONE]** `corporate_documents` replaced by `meetings` with typed columns.
- ✅ **[DONE]** `dividends` table recreated.
- ✅ **[DONE]** `partners` table extended with `email`, `phone`, `board_role`.
- ✅ **[DONE]** `members` table extended with `email`, `phone`.

### What was missing (Now Fixed)
- All columns for contact info and governance roles are live in `src/types/database.ts`.
- `BoardService` has been refactored to use the new `meetings` table.

## Acceptance Criteria
- [x] `inbox_items` and `bank_connections` dropped
- [x] `corporate_documents` replaced by `meetings` with proper typed columns
- [x] `dividends` table exists with decision + GL link
- [x] `partners` and `members` tables have contact columns
- [x] Supabase types regenerated against clean schema
- [x] Zero `.from('table' as any)` casts remain
