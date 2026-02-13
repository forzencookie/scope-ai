# Future Features — Post-Current Sprint

Features explicitly deferred during the production readiness audit (2026-02-13).

---

## Email Infrastructure (Resend)

**Purpose:** Send invoices, kallelser, payslips, and company update emails from within the app.

**Scope:**
- Install and configure Resend (or alternative provider)
- Invoice email sending with company branding (name + logo)
- Weekly/monthly/quarterly company progress update emails
- Extensible email service (`email-service.ts`)

**Prerequisite:** Company logo upload should work first (currently missing).

---

## AI Memory — Full Implementation

**Purpose:** Scooby remembers user preferences, patterns, and history across conversations.

**Current state:** `user_memory` table exists, `user-memory-service.ts` (337 lines) is fully built with CRUD, search, supersede, and history tracking. The missing piece is the **extraction job** — nothing runs after conversations to populate the memory.

**Scope:**
- Post-conversation memory extraction (analyze chat, extract key facts → `addMemory()`)
- Per-company memory spaces
- Memory compaction over time (merge similar memories)
- Pattern detection (e.g., "user always books office supplies to 6110")
- Inject relevant memories into system prompt for next conversation

**Reference:** Founder interview §15 — "He should really KNOW me"

---

## Planning System — "Min Plan"

**Purpose:** AI-generated daily/weekly/monthly to-do lists for running the user's company.

**Location:** Subtab inside Händelser, alongside Roadmap, Månadsavslut, Kalender.

**Scope:**
- Scooby generates a structured plan based on onboarding data (company type, momsperiod, start date)
- Plan is a browsable text document with daily/weekly/monthly items
- User can ask Scooby to modify, regenerate, or create additional plans
- Plans stored in DB, browsable (current + past plans)
- Dashboard "Idag" widget pulling from active plan

**Reference:** Founder interview §2 — "The Planning System"

---

*Created 2026-02-13 during codebase vision audit.*
