# Fix: Database Schema

> **Thinking:** 🟢 Medium
> **Status:** ⬜ Not started
> **Blocks:** Workstream 01 (Type Safety) — must be done before regenerating Supabase types

## Why This Exists

The database schema was built for AB (Aktiebolag) first and other company types were bolted on. Before regenerating Supabase types or fixing type safety, the schema itself must be correct: drop dead tables, recreate missing ones, restructure tables that don't serve the vision.

## 1. Drop Dead Tables

| Table | Why dead |
|-------|----------|
| `inbox_items` | 0 code refs, vestigial 3-column stub, never queried |
| `bank_connections` | 0 code refs, no bank integration exists |

## 2. Replace `corporate_documents` with `meetings`

**Problem:** `corporate_documents` is a generic document blob (JSON `content` column, `type` string discriminator). Every query requires manual JSON parsing, status remapping, and type filtering. The name is misleading — it only stores meeting minutes.

**What it actually stores:**
- `board_meeting_minutes` (styrelseprotokoll) — used by AB, Förening
- `general_meeting_minutes` (stämmoprotokoll) — used by AB (bolagsstämma), Förening (årsmöte)

**Replace with a proper `meetings` table:**
```sql
meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id),
  user_id uuid REFERENCES auth.users(id),
  type text NOT NULL,  -- 'board' | 'annual_general' | 'extraordinary' | 'partner_meeting' | 'association_annual'
  title text NOT NULL,
  date date NOT NULL,
  location text,
  status text NOT NULL DEFAULT 'draft',  -- 'draft' | 'held' | 'signed'
  attendees jsonb DEFAULT '[]',          -- [{name, role, present}]
  agenda_items jsonb DEFAULT '[]',       -- [{number, title, description}]
  decisions jsonb DEFAULT '[]',          -- [{paragraph, title, decision}]
  signatures jsonb DEFAULT '[]',         -- [{name, role, signed_at}]
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**All company types use meetings:**
| Company type | Meeting types |
|---|---|
| AB | `board`, `annual_general`, `extraordinary` |
| HB/KB | `partner_meeting` |
| Förening | `board`, `association_annual` |
| EF | None (single owner) |

**Files to update after migration:**
- `src/services/board-service.ts` — rewrite `getBoardMeetingMinutes()` and `getCompanyMeetings()` to query `meetings` with proper typed columns instead of JSON blob parsing
- `src/app/api/compliance/route.ts` — update `.from('corporate_documents')` → `.from('meetings')`
- `src/components/agare/bolagsstamma/use-general-meetings.ts` — update queries
- `src/lib/ai-tools/parter/compliance.ts` — `get_compliance_docs` tool fetches via `/api/compliance`

## 3. Recreate `dividends` Table

**Problem:** Dropped in the March 15 cleanup as "dead" but the `register_dividend` tool needs it for persistent dividend records (not just GL entries). The Ägare/Utdelning page needs dividend history, and K10 prep needs historical dividend data.

**Currently:** `register_dividend` tool only creates verifications (2098→2898 and kupongskatt 2898→2750). No persistent record of the decision itself.

```sql
dividends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id),
  user_id uuid REFERENCES auth.users(id),
  amount numeric NOT NULL,
  year integer NOT NULL,
  date date NOT NULL,
  recipient_name text,              -- NULL = all shareholders
  withholding_tax numeric NOT NULL, -- kupongskatt (30%)
  net_payout numeric NOT NULL,
  verification_id uuid REFERENCES verifications(id),  -- link to GL entry
  status text NOT NULL DEFAULT 'decided',  -- 'decided' | 'paid' | 'reported'
  created_at timestamptz DEFAULT now()
);
```

**AB only.** HB/KB uses delägaruttag (partner withdrawal), which goes through verifications directly.

## 4. Company-Type Schema Gaps

The app serves 5 company types but the ownership tables have uneven depth:

| Table | Company type | Columns | Depth |
|-------|-------------|---------|-------|
| `shareholders` | AB | 18+ columns (shares, voting, board roles, acquisition history) | Full |
| `partners` | HB/KB | 9 columns (capital, profit share, type) | Thin |
| `members` | Förening | 6 columns (member number, type, status, roles) | Thin |

### Issues found:

**a) `partners` table lacks board/governance tracking**
- No `board_role` equivalent (HB/KB can have governance roles)
- No capital transaction history (only `current_capital_balance` snapshot)
- Missing: `email`, `phone` columns (shareholders has these)

**b) `members` table lacks contact info**
- No `email`, `phone` columns
- `roles: string[]` is untyped — should match governance role patterns

**c) EF onboarding seeds into `members` table (wrong)**
- `src/app/api/onboarding/seed/route.ts` inserts EF data into `members`
- EF has a single owner, stored in `companies.contact_person` — no ownership table needed
- Fix: Remove EF → members seeding logic

**d) Compliance deadlines tool only handles AB**
- `getComplianceDeadlinesTool` calculates AGM + Bolagsverket deadlines for AB
- HB/KB/EF/Förening: no deadline logic implemented
- Fix: Add company-type-specific deadline calculations

**e) Reports page lumps HB/KB/Förening as "AB"**
- `src/components/rapporter/arsbokslut.tsx` — `companyType === 'ef' ? 'EF' : 'AB'`
- HB files N3A, KB files N3B — not the same as AB annual report

**f) CompanyProvider defaults to AB**
- `src/providers/company-provider.tsx` — default company has `companyType: 'ab'`, `shareCapital: 25000`, `shareClasses: { A: 0, B: 500 }`
- Any component that reads before company loads gets AB-specific defaults

### What to do:

1. **Extend `partners` table** — add `email`, `phone`, `board_role` columns
2. **Extend `members` table** — add `email`, `phone` columns
3. **Fix EF onboarding** — remove members seeding, EF owner comes from `companies` table
4. **Fix CompanyProvider defaults** — use neutral defaults (no share capital, no share classes)
5. **Compliance deadlines** — add HB/KB/EF/Förening rules (lower priority, tool territory)

## 5. Company-Type Data Isolation

**Principle:** An EF company never sees AB content. An AB company never gets Förening features. The user's company type determines which tables are relevant, which tools are available, and what Scooby offers. This must be enforced at every layer, not just the UI.

### How tables map to company types

**Shared (all types):**
- `transactions`, `verifications`, `verification_lines`, `receipts`
- `customer_invoices`, `supplier_invoices`, `inventarier`, `pending_bookings`
- `employees`, `payslips` (if they have employees)
- `companies`, `profiles`, `user_preferences`, `user_memory`, `user_credits`
- `financial_periods`, `events`, `activity_log`
- `conversations`, `messages`, `ai_audit_log`, `ai_usage`, `agent_metrics`
- `account_balances`, `system_parameters`, `skv_tax_tables`
- `vat_declarations`, `income_declarations`, `agi_reports`, `tax_reports`, `ne_appendices`
- `annual_reports`, `annual_closings`
- `roadmaps`, `roadmap_steps`
- `periodiseringsfonden`
- `meetings` (different meeting types per company, but same table)

**AB only:**
- `shareholders`, `share_transactions` — aktiebok and share transfers
- `dividends` — utdelningsbeslut (HB/KB uses delägaruttag via verifications instead)
- `shareholdings` — investments this company holds in OTHER companies (technically could be any type, but primarily AB)

**HB/KB only:**
- `partners` — delägare with capital contributions and profit share ratios

**Förening only:**
- `members` — medlemsregister with membership types and fee tracking

**EF:**
- No ownership table. Single owner stored in `companies` table fields.

### Where enforcement must happen

**a) AI tool guards (critical — this is where mutations happen)**

Every company-type-specific tool must check `company.companyType` before executing and return a clear Swedish message if wrong type. Examples:
- `register_dividend` → must check `companyType === 'ab'`, otherwise: "Utdelning gäller bara aktiebolag. För HB/KB, använd delägaruttag."
- `get_shareholders` → must check `companyType === 'ab'`
- `get_partners` → must check `companyType === 'hb' || companyType === 'kb'`
- `add_member` → must check `companyType === 'forening'`
- `prepare_agm` → must check `companyType === 'ab'` (Förening has årsmöte, not bolagsstämma)

Pattern for every type-specific tool:
```typescript
execute: async (params, context) => {
    const company = await companyService.getByUserId(context.userId)
    if (company?.companyType !== 'ab') {
        return { success: false, error: 'Denna funktion gäller bara aktiebolag.' }
    }
    // ... actual logic
}
```

**b) Scooby system prompt (critical — this is where the user interacts)**

Scooby's system prompt must include the user's company type so it never suggests irrelevant features. Example injection:
```
Användarens företag: {companyName} ({companyType}).
Du är EF-rådgivare. Erbjud INTE funktioner för aktiebolag (aktiebok, utdelning, bolagsstämma, K10).
```

This belongs in `fix/scooby-engine.md` but is noted here because the data model drives it.

**c) UI page tabs (already handled)**

The Ägare page already switches tabs by company type. Löner page uses `hasFeature()`. This layer is mostly done — the gaps are the missing tabs (Egenavgifter for EF/HB/KB) noted in `fix/information-pages.md`.

**d) Service layer (optional enforcement)**

Services could reject writes to wrong-type tables, but if tools guard correctly this is defense-in-depth, not primary. Lower priority.

**e) Deferred tool loading (natural enforcement)**

The deferred tool system (`search_tools` meta-tool) already filters by domain. Company-type-specific tools should only appear in search results when the user's company type matches. This means adding a `companyTypes` field to tool definitions:
```typescript
defineTool({
    name: 'register_dividend',
    companyTypes: ['ab'],  // only discovered for AB companies
    // ...
})
```

### Tools that need company-type guards

| Tool | Valid types | Currently guarded? |
|------|-----------|-------------------|
| `register_dividend` | AB | No |
| `get_shareholders` / `add_shareholder` | AB | No |
| `get_share_register_summary` | AB | No |
| `prepare_agm` | AB | No |
| `draft_board_minutes` | AB, Förening | No |
| `get_partners` / `add_partner` | HB, KB | No |
| `get_members` / `add_member` | Förening | No |
| `calculate_self_employment_fees` | EF, HB, KB | No |
| `register_owner_withdrawal` | EF, HB, KB | No |
| `prepare_3_12_optimization` | AB (fåmansföretag) | Partially (checks `isCloselyHeld`) |
| `get_compliance_deadlines` | All (but only AB logic exists) | Partially |

## 6. Verify Recent Migration Applied

The March 15 cleanup (`20260315000001_schema_cleanup.sql`) should have:
- Dropped 20 dead tables
- Renamed concatenated names → snake_case
- Deduplicated columns (shareholders.shares_count, receipts.vendor, payslips.paid_at, transactions.occurred_at/timestamp/booked_at)

**Verify in Supabase dashboard** that these changes are live before regenerating types. If not applied, run the migration first.

## 6. After Schema Is Clean → Regenerate Types

Only after steps 1-5:
```bash
npx supabase gen types typescript --project-id <project-id> > src/types/supabase.ts
```

Then proceed to Workstream 01 (Type Safety) to remove `as any` casts from all `.from()` calls.

## Migration Order

```
1. Drop inbox_items, bank_connections
2. Create meetings table (with data from corporate_documents if any exists)
3. Drop corporate_documents
4. Create dividends table
5. Extend partners (add email, phone, board_role)
6. Extend members (add email, phone)
7. Regenerate types
8. Update code references (board-service.ts, compliance route, tools)
```

## Files to Touch

- `supabase/migrations/` — new migration file
- `src/types/database.ts` — regenerate after migration
- `src/services/board-service.ts` — rewrite for `meetings` table
- `src/app/api/compliance/route.ts` — update table references
- `src/components/agare/bolagsstamma/use-general-meetings.ts` — update queries
- `src/app/api/onboarding/seed/route.ts` — fix EF seeding
- `src/providers/company-provider.tsx` — fix AB-biased defaults
- `src/lib/ai-tools/parter/compliance.ts` — update `register_dividend` to write to `dividends` table

## Acceptance Criteria

- [ ] `inbox_items` and `bank_connections` dropped
- [ ] `corporate_documents` replaced by `meetings` with proper typed columns
- [ ] `dividends` table exists with decision + GL link
- [ ] `partners` and `members` tables have contact columns
- [ ] EF onboarding does not seed into `members`
- [ ] CompanyProvider defaults are company-type-neutral
- [ ] Every company-type-specific tool has a `companyType` guard
- [ ] Scooby system prompt includes user's company type
- [ ] Deferred tool discovery filters by company type
- [ ] Supabase types regenerated against clean schema
- [ ] Zero `.from('table' as any)` casts remain
- [ ] All queries compile against new types
