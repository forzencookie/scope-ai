# Scope AI — Claude Code Instructions

## The App

Scope AI is an AI-first Swedish accounting platform. A business owner opens the app, talks to an AI assistant called Scooby, and Scooby handles their entire accounting — booking transactions, creating invoices, running payroll, filing tax declarations, generating legal documents. All through conversation, with human confirmation before anything is finalized.

**Who it serves:**
- New business owners who can't afford an accountant — Scooby teaches while it works
- Professional accountants who want a force multiplier — handle 20 clients instead of 10
- Accounting firms that want AI to handle the repetitive bulk

**How it works:** User talks to Scooby in chat. Scooby picks the right tools, calls services, writes to the database, and responds with interactive cards. Pages exist only for reviewing data — all mutations happen through chat. Every output must be legally compliant enough to submit to Skatteverket or Bolagsverket.

**The stack:** Next.js 16, React 19, Supabase, Vercel AI SDK.

## The Architecture

```
User → Chat → Scooby → Tools → Services → Bookkeeping Engine → Supabase
                                                ↓
                              Pages (read-only) ← display the data
```

- **Chat** is the only interaction surface for mutations
- **Tools** (60+) are Scooby's hands — organized by domain, discovered on demand via deferred loading
- **Services** are the business logic layer — every tool goes through a service, never direct DB
- **Bookkeeping engine** (`src/lib/bookkeeping/`) enforces Swedish law: BAS validation, debit/credit balance, sequential verification numbering
- **Pages** are read-only data displays — tables with clickable rows that open detail overlays
- **Overlays** replace all dialogs — walkthrough overlays for AI output, page overlays for table row details, settings overlay for configuration

## Code Quality — Zero Tolerance

This is a pre-production MVP. No code is in production. There is no excuse for dirty code.

**Banned — these are debt disguised as progress:**
- `as any` — define the actual type
- `@ts-ignore` / `@ts-nocheck` — fix the type error
- `eslint-disable` — fix the code the rule is protecting
- `// TODO: fix later` — fix it now or don't touch it
- Swallowing errors in try/catch silently
- `_` prefix on unused variables instead of removing dead code

**Required:**
- Proper TypeScript types everywhere
- Tools → Services → DB (no shortcuts)
- Accounting entries → `lib/bookkeeping/` (never raw inserts)
- Tax rates, account plans, legal thresholds from data sources (never hardcoded inline)

## Before You Touch Code

1. **Read the flow doc** for the feature area you're working on (`docs/flows/`). Understand the full chain before editing a single file.
2. **Read the fix doc** (`docs/fix/`) — understand what needs to happen and what's already done.
3. **Compare vision to current code** — the fix docs may be stale. Verify against the actual codebase before acting.
4. **Does this file serve the app's purpose?** If not, flag it for removal — don't fix dead code.
5. **Will your change introduce suppressors?** If yes, it's not a fix. Do the proper fix.
6. **Do you lack context?** Ask the founder. Do not guess. A wrong guess creates debt.
7. **Flag suspicious code** — anything that doesn't serve the vision, cross-reference with the flow and flag for founder review rather than silently keeping or deleting.

## After You Touch Code — Propagation Rule

**When you change a feature, update EVERY file that references it.** This is non-negotiable. Stale references across files are the #1 source of bugs in this codebase.

Before marking any change as done, trace the full dependency chain:

1. **Navigation** — Does `src/data/app-navigation.ts` reference this feature? Update tab keys, URLs, labels, feature gates.
2. **Page components** — Do tab definitions in the page component match what navigation promises? Check `allTabs` arrays, `tabsByCompanyType` maps, `?tab=` query param handling.
3. **Types** — Did you add/remove/rename a feature key? Update `src/lib/company-types.ts` and every `featureKey` reference.
4. **AI tools** — Does a tool reference this feature? Update tool descriptions, keywords, `allowedCompanyTypes`.
5. **Flow docs** — Does `docs/flows/` describe this feature? Update to match reality.
6. **Fix docs** — Does `docs/fix/` have an assessment? Mark items as done or update the status. If a fix doc says something is broken but it's already fixed, update the doc immediately.

**The rule:** If you change file A and file B references the same concept, file B must be updated in the same change. No exceptions. No "I'll fix it later." Check the chain, update everything, then mark it done.

## Flow Documentation

Read before working. Update when code changes.

### Core Flows
| Flow | What It Covers |
|------|---------------|
| [`ai-interface.md`](docs/flows/ai-interface.md) | Chat, Scooby, sidebar tasks, two-layer cards, skills, scenarios, cascades |
| [`scooby-engine.md`](docs/flows/scooby-engine.md) | Context engineering, token management, memory architecture, 6 load-bearing systems |
| [`information-pages.md`](docs/flows/information-pages.md) | Read-only data displays, table structure, full page list |
| [`tools.md`](docs/flows/tools.md) | AI tool architecture, deterministic rule engine, service layer, tool categories |
| [`walkthrough-overlays.md`](docs/flows/walkthrough-overlays.md) | Card click → full preview, auto-rendered reports, block primitives |
| [`page-overlays.md`](docs/flows/page-overlays.md) | Table row click → detail view, replaces all dialogs |

### Supporting Flows
| Flow | What It Covers |
|------|---------------|
| [`settings.md`](docs/flows/settings.md) | Company info, profile, language, billing — overlay in main content area |
| [`payments.md`](docs/flows/payments.md) | Stripe subscription, token purchase, custom checkout |
| [`onboarding.md`](docs/flows/onboarding.md) | Post-payment guided setup — company + profile |
| [`landing-page.md`](docs/flows/landing-page.md) | Public pages, conversion flow, demo mode |

## Your Task

Fix the codebase so it achieves the vision described in `docs/flows/`. Three folders guide your work:

| Folder | Purpose | Start Here |
|--------|---------|------------|
| [`docs/flows/`](docs/flows/README.md) | **Vision** — what each feature should be | Read first |
| [`docs/fix/`](docs/fix/) | **Execution plans** — what to build/change to reach the vision (maps 1:1 to flows) | Work from here |
| [`docs/workstreams/`](docs/workstreams/PROGRESS.md) | **What's broken** — type errors, dead code, consistency bugs | Clean these first |

**Order of operations:** workstreams (clean the foundation) → fix docs (build toward the vision).

Flag anything suspicious for founder review rather than guessing.

## Key Docs
- `docs/BACKEND_AUDIT_REPORT.md` — Current state audit with grades
- `docs/SCOOBY_COSPLAY_SESSION.md` — Scooby personality and behavior reference
- `docs/ai-conversation-scenarios.md` — Few-shot examples for Scooby's system prompt
- `docs/FUTURE_FEATURES.md` — Backlog of unbuilt features
