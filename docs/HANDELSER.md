# Händelser — Event Hub & Period Management

Händelser is the central hub for everything that has happened, is happening, and is planned in a company's accounting lifecycle. It replaces the old Arkiv and Tidslinje tabs with a unified four-view module that gives accountants full chronological visibility over a company's financial year.

## Why Händelser Exists

Swedish accounting law (BFL) requires companies to maintain a complete, verifiable trail of all financial events. Accountants need to quickly answer questions like:

- What happened in March? Were all transactions booked?
- Has the VAT declaration been filed for Q1?
- Are there any months where reconciliation isn't complete?
- What corporate actions were taken this year?

Händelser brings all of this into one place instead of scattering it across bookkeeping, payroll, and reporting screens.

## The Four Views

### 1. Månadsavslut (Monthly Closing)

The default view. A 12-month grid shows every month of the selected year at a glance. Each month displays a status indicator:

| Indicator | Meaning |
|-----------|---------|
| Blue dot | Current month |
| Green dot | All reconciliation checks completed |
| Yellow dot | At least one manual check completed, work in progress |
| White dot | Past month, no checks started |
| Empty ring | Future month |

Clicking a month reveals a detail panel with:

- **Financial summary** — verification count, discrepancies, revenue, expenses, and result
- **Avstämningskoll** — a dynamic reconciliation checklist tailored to the company profile

The checklist engine (`checklist-engine.ts`) generates checks based on what applies:

| Check | Condition | Type |
|-------|-----------|------|
| Inga obokförda transaktioner | Always | Auto |
| Avstämning bankkonto (1930) | Always | Manual |
| Momsdeklaration inlämnad | VAT-registered + reporting month | Manual |
| Arbetsgivardeklaration inlämnad | Has employees | Manual |
| Löner utbetalda och bokförda | Has employees | Manual |
| Delägaruttag bokförda | HB/KB company type | Manual |
| Förberedelse årsbokslut | Fiscal year end month | Manual |

Auto checks are computed from real data (e.g., pending transaction count). Manual checks are assertions the accountant ticks off as they complete each task.

The "Öppna fullständig månadsöversikt" button opens a full-screen dialog with financial breakdown, activity sections, the same checklist, and a notes field for month-level comments.

### 2. Kalender (Calendar)

A traditional month-view calendar where every event in the company appears as a colored pill on its date. Events are color-coded by source:

- **AI** (purple) — AI-classified transactions, auto-generated reports
- **User** (blue) — Manual bookings, approvals, logins
- **System** (gray) — Automated processes, scheduled tasks
- **Document** (amber) — Invoice uploads, receipt scans
- **Authority** (orange) — Tax filings, Bolagsverket registrations

Clicking any day opens the **Day Detail Dialog**, which shows:

- All events for that specific date with timestamps and source badges
- An empty state with a mascot illustration when nothing happened
- A notes field for day-level comments (useful for annotating unusual activity)
- Prev/next day navigation within the month

Event pills in the calendar can be clicked independently (with stopPropagation) without triggering the day dialog.

### 3. Planering (Roadmap)

A vertical stepper UI for planning future corporate actions and milestones. Each roadmap contains ordered steps that can be toggled between pending, in progress, completed, and skipped.

Roadmaps show:

- Title and description
- Circular progress indicator with percentage
- Step completion count (e.g., "3/7 steg")
- Individual steps with due dates, descriptions, and status icons
- Vertical connector lines that turn green as steps complete

New roadmaps are created through the Action Wizard dialog (accessible via the "Ny åtgärd" button). Roadmaps can be deleted with confirmation.

### 4. Aktivitetslogg (Activity Log)

A real-time feed of all user and system actions. Every create, update, delete, booking, send, and approval is logged with:

- Who performed the action (user avatar + name)
- What was affected (entity type + name)
- When it happened (relative timestamp)
- What changed (field-level diffs for updates)

The activity log supports filtering by entity type and ID, making it useful for auditing specific transactions or tracing who made a particular change.

## How Accountants Use Händelser

### Monthly Workflow

1. Open Månadsavslut at month end
2. Review the 12-month grid — identify which months need attention (white dots = untouched)
3. Click a month to see its financial summary and checklist
4. Work through the Avstämningskoll:
   - Auto checks show whether data is clean (green = no pending transactions)
   - Manually tick off completed tasks (bank reconciliation, VAT filing, payroll)
5. Open the full monthly overview for detailed notes and financial breakdowns
6. Once all checks are green, the month shows as complete in the grid

### Daily Review

1. Switch to Kalender for a chronological view of the month
2. Click any day to see what happened — useful for investigating specific dates
3. Add day notes to document unusual transactions or client communications
4. Use prev/next arrows to step through days without closing the dialog

### Planning

1. Switch to Planering to see upcoming corporate actions
2. Create roadmaps for year-end closing, audits, or structural changes
3. Track step-by-step progress with due dates

### Auditing

1. Switch to Aktivitetslogg when you need to trace who did what
2. Filter by entity to see the full history of a specific transaction, invoice, or employee record
3. Use this for internal controls and audit trail verification

## Data Architecture

Events follow a structured schema (`HändelseEvent`) with:

- Unique ID and timestamp
- Source, category, and action type
- Actor identification (user or system)
- Related entity links (transactions, invoices, receipts, etc.)
- Optional status workflow for corporate actions
- Hash chain fields for future tamper-proof audit trails

Monthly period data is stored in the `financialperiods` table with reconciliation state persisted as JSONB in `reconciliation_checks`. This includes manual check states, month-level notes, and day-level notes — all synced across devices via Supabase.

## Key Files

| File | Purpose |
|------|---------|
| `src/components/pages/handelser-page.tsx` | Page layout, tab routing, view orchestration |
| `src/components/handelser/manadsavslut-view.tsx` | 12-month grid, detail panel, checklist UI |
| `src/components/handelser/month-review-dialog.tsx` | Full monthly overview dialog |
| `src/components/handelser/day-detail-dialog.tsx` | Day-level event list and notes |
| `src/components/handelser/handelser-kalender.tsx` | Calendar grid with event pills |
| `src/components/handelser/roadmap-view.tsx` | Vertical stepper roadmap UI |
| `src/components/shared/activity-feed.tsx` | Reusable activity timeline |
| `src/hooks/use-events.ts` | Event fetching, filtering, emission |
| `src/hooks/use-month-closing.ts` | Period state, checklist toggling, notes persistence |
| `src/lib/checklist-engine.ts` | Dynamic check definitions based on company profile |
| `src/types/events.ts` | Event type definitions, source/status enums |
