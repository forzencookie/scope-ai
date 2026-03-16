# Workflow: Tools

> How AI tools work. Every action Scooby takes goes through a tool.

## What They Are

AI tools are functions that Scooby calls to interact with the app's data and services. There are 60+ tools organized by domain. They are the bridge between natural language conversation and database operations.

## Architecture

```
Scooby decides to act
  → Calls a tool with parameters
  → Tool validates parameters (Zod schema)
  → Tool calls service layer function
  → Service calls Supabase (or lib/bookkeeping/ for accounting)
  → Result returned to Scooby
  → Scooby renders response with blocks/cards
```

**Absolute rules:**
- Tools call services. Services call DB. No shortcuts.
- No tool makes direct Supabase calls.
- No tool uses `fetch('/api/')` for internal data.
- Every tool has Zod parameter validation.
- No duplicate tool names in the registry.

## Tool Categories

### Deterministic Rule Tools (Swedish Law)
These contain hardcoded law. The AI calls them instead of guessing:

| Tool | Purpose |
|------|---------|
| `lookup_bas_account` | Fuzzy search BAS kontoplan (400+ accounts) |
| `calculate_employer_tax` | Arbetsgivaravgift by municipality + age |
| `calculate_vat` | VAT rate (25/12/6/0%) by transaction type |
| `calculate_vacation_accrual` | 12% semesterlöneskuld per Semesterlagen |
| `validate_verification` | BFL compliance: debit=credit, sequential numbering |
| `calculate_312` | 3:12 rules for K10/gränsbelopp |
| `get_tax_table` | Municipal income tax tables |
| `get_filing_deadlines` | SKV deadlines by company type |

**Rule: The AI decides WHAT to do. Deterministic tools decide HOW to calculate.**

### Domain Tools
Organized in `src/lib/ai-tools/` by area:
- `bokforing/` — transaction booking, invoice creation, receipt matching, verification assembly
- `loner/` — payroll runs, benefit management, salary calculations
- `rapporter/` — report generation, tax form population
- `agare/` — governance documentation, dividend calculations
- `handelser/` — calendar events, period closing
- `installningar/` — settings updates

### Meta Tools
- `search_tools` — discovers other tools by description (deferred loading)

## Accounting Tool Pattern

All tools that create accounting entries follow this pattern:

1. Tool receives parameters from Scooby
2. Tool calls `lib/bookkeeping/` engine — NOT raw Supabase inserts
3. Engine validates: BAS account exists, debit=credit, period not locked, sequential numbering
4. Engine creates **pending** verification
5. Tool returns confirmation card to Scooby
6. On user confirm → tool finalizes verification (pending → confirmed)

## AI Tools Needed (Dialog Replacements)

All mutation dialogs have been removed from the app. The following actions previously lived in dialogs and now need AI tool equivalents. Tools listed here do NOT yet exist in `src/lib/ai-tools/` — tools that already exist (like `create_verification`, `create_transaction`, `create_receipt`, `register_employee`, `register_owner_withdrawal`, `assign_benefit`, `register_dividend`) are excluded.

### Bokforing

| Tool Needed | Was | Notes |
|-------------|-----|-------|
| `create_supplier_invoice` | SupplierInvoiceDialog | `get_supplier_invoices` exists (read-only). Need a write tool that creates supplier invoices and books them via `lib/bookkeeping/`. |
| `batch_create_verifications` | AutoVerifikationDialog | Bulk-book multiple transactions at once. Should iterate `create_verification` internally with a single confirmation card. |

### Agare

| Tool Needed | Was | Notes |
|-------------|-----|-------|
| `plan_meeting` | PlanMeetingDialog | Schedule bolagsstamma or board meetings. `prepare_agm` exists but only gathers documents — this tool should create the meeting record. |
| `send_meeting_notice` | SendNoticeDialog | Generate and send kallelse for a scheduled meeting. Needs meeting record as input. |
| `create_motion` | MotionDialog | Create motions/proposals for upcoming meetings. Ties to meeting record. |
| `add_member` | AddMemberDialog | Add members to the company register. `get_members` exists (read-only). |
| `add_partner` | AddPartnerDialog | Add delagare/partners. `get_partners` exists (read-only). `add_shareholder` exists for aktiebolag — this covers other company types. |

### Loner

| Tool Needed | Was | Notes |
|-------------|-----|-------|
| `create_time_report` | ReportDialog | Create time, expense, or mileage reports for employees. Feeds into payroll. |

## What Connects Here

- AI interface invokes tools via the chat route
- Tools call services (in `src/services/`)
- Accounting tools call the bookkeeping engine (in `src/lib/bookkeeping/`)
- Tool results render as blocks/cards in the chat via the block rendering system
- App manifest maps which tools belong to which pages and data sources
