# Scope AI Architecture

Technical reference for codebase structure, security, and performance.

> **Last Updated:** 2026-02-04
> **Note:** Statistics from January 2026 audits. Some numbers may have changed.

---

## Codebase Overview

| Metric | Value |
|--------|-------|
| Total Lines of Code | ~108,000 |
| Source Files | 784 `.ts/.tsx` |
| Components | 380 `.tsx` in 87 directories |
| Lib Files | 144 |
| Services | 44 |
| Hooks | 39 |
| API Routes | 57 |
| Providers | 13 |
| Database Migrations | 48 |

### Overall Grade: B+ (81/100)

| Category | Score | Notes |
|----------|-------|-------|
| Architecture | A- (88) | Clean domain separation |
| Code Quality | C+ (72) | Some `as any` casts, ESLint disables |
| Testing | D (35) | Limited coverage |
| Domain Design | A- (87) | Swedish accounting well-modeled |
| DevEx | B+ (82) | Good tooling |

---

## Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── chat/          # AI chat endpoint
│   │   ├── invoices/      # Invoice CRUD
│   │   └── ...
│   └── dashboard/         # Protected pages
├── components/            # React components
│   ├── ai/               # AI chat, cards, overlays
│   ├── bokforing/        # Accounting UI
│   ├── loner/            # Payroll UI
│   ├── rapporter/        # Reports UI
│   └── ui/               # Shadcn components
├── lib/
│   ├── agents/           # AI agent system
│   │   └── scope-brain/  # Single unified agent
│   ├── ai-tools/         # 55+ AI tool definitions
│   │   ├── bokforing/    # Accounting tools
│   │   ├── loner/        # Payroll tools
│   │   ├── skatt/        # Tax tools
│   │   ├── parter/       # Partners/shareholders tools
│   │   ├── common/       # Navigation, settings, events
│   │   └── planning/     # Roadmap tools
│   ├── services/         # Business logic
│   └── database/         # Supabase client, types
├── hooks/                 # Custom React hooks
├── providers/             # Context providers
└── types/                 # TypeScript definitions

supabase/
└── migrations/            # 48 SQL migrations
```

---

## AI System Architecture

### Single Agent (Scope Brain)

```
User Message
    ↓
Model Selector (complexity-based routing)
    ↓
┌─────────────────────────────────┐
│         SCOPE BRAIN             │
│  - Swedish accounting expert    │
│  - Full tool access (55+)       │
│  - Cross-domain reasoning       │
└─────────────────────────────────┘
    ↓
Tool Execution → Supabase
    ↓
Response (Chat / Walkthrough)
```

### Model Selection

| Complexity | Model | Use Case |
|------------|-------|----------|
| Simple | Haiku | Greetings, simple lookups |
| Standard | Sonnet | Most accounting tasks |
| Complex | Sonnet + thinking | Tax planning, multi-step analysis |

### Streaming Protocol

| Prefix | Type | Description |
|--------|------|-------------|
| `T:` | string | Text content delta |
| `TH:` | string | Extended thinking (internal) |
| `D:` | object | Tool results, metadata |
| `E:` | object | Error message |
| `W:` | object | Walkthrough UI blocks |

---

## Security

### Overall Score: 8.5/10

### RLS (Row Level Security)

All user tables use:
```sql
USING (user_id = (SELECT auth.uid()))
```

**Special cases:**
- `profiles`: Uses `id = auth.uid()` + `is_admin()` function
- `categories`: Read-only for authenticated, admin-only write
- `ratelimitssliding`: Open for anon (intentional for rate limiting)

### Key Security Measures

| Measure | Status |
|---------|--------|
| RLS on all tables | ✅ Enabled |
| FK to auth.users | ✅ All user_id columns |
| SECURITY DEFINER functions | ✅ With `search_path = ''` |
| Service role scoped | ✅ Only for system operations |
| Anon access revoked | ✅ On sensitive tables |

### Admin Check Pattern

```sql
-- SECURITY DEFINER function bypasses RLS
CREATE FUNCTION is_admin() RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$ SELECT EXISTS (
  SELECT 1 FROM public.profiles
  WHERE id = auth.uid() AND role = 'admin'
) $$;
```

---

## Performance

### Optimizations Applied

| Area | Fix | Impact |
|------|-----|--------|
| Bundle | Removed Three.js | -1MB |
| Context | Single CompanyProvider | -50% re-renders |
| API | React Query caching | Deduped requests |
| Fetches | AbortController | No memory leaks |
| Queries | Parallel requests | Faster loads |

### Database Indexes

Key indexes for common queries:
- `idx_*_user_id` on all user tables
- `idx_*_user_status` for filtered lists
- `idx_*_user_company` for multi-company queries
- `idx_transactions_user_occurred` for date ranges

### Known Performance Considerations

1. **48 migrations** - Consider squashing for new deployments
2. **Large walkthrough designs** (102KB) - Loaded on demand
3. **AI streaming** - Uses chunked transfer encoding

---

## Data Flow

### Invoice Creation Example

```
1. User: "Skapa faktura till Acme AB på 10000 kr"
2. AI calls: create_invoice tool
3. Tool returns: confirmation required
4. User confirms in UI
5. Tool executes:
   - Creates invoice in customerinvoices table
   - Creates verification with double-entry rows
   - Returns invoice data
6. AI responds with confirmation + PDF link
```

### Tax Report Example

```
1. User: "Visa momsrapport för Q4"
2. AI calls: get_vat_report tool
3. Tool queries: verifications, calculates VAT
4. AI composes: Dynamic walkthrough with tables, summary
5. User can: Export SRU file for Skatteverket
```

---

## Coding Standards

### TypeScript Rules
- **No `any`:** Use `unknown` or define a distinct type.
- **Interfaces over Types:** Use `interface` for object definitions (better error messages).
- **Explicitness:** Return types mandatory for exported functions.

### Component Guidelines
- **Filenames:** Kebab-case (`invoice-list.tsx`, not `InvoiceList.tsx`).
- **Exports:** Named Exports (`export function InvoiceList`), not Default Exports.
- **Props:** Define `interface ComponentProps` right above the component.

### CSS / Tailwind
- **Utility First:** Use Tailwind utilities. Use `cn()` helper for conditional classes.
- **Mobile First:** `class="flex flex-col md:flex-row"` (defaults to mobile, overrides for desktop).

### Error Handling
- **UI:** Use `useToast` for user-facing success/error messages.
- **Logging:** Log errors to console in dev; ensure no PII is logged.

---

## UX Patterns

### Design Philosophy
- **Clean & Professional:** Lots of whitespace, crisp borders, subtle shadows.
- **Native Feel:** Should feel like part of the OS, not a website.
- **Dark Mode First:** Branding leans on dark/cosmic themes ("Scope").

### Core Components (Shadcn/UI)
- `Button`: Variants `default`, `secondary`, `ghost`, `destructive`.
- `Card`: Primary content container.
- `Dialog`: Modals / critical confirmations.
- `Sheet`: Side-drawers (e.g., editing a row).

### Shell Layout
- **Sidebar:** Fixed left navigation.
- **AI Overlay:** Persistent layer that can slide over any content.
- **Main Content:** Centered, max-width constrained for readability.

### Key UX Flows
- **Walkthrough:** The primary way complex data is presented. See `WALKTHROUGH_DESIGNS.md`.
- **Drill-down:** Clicking a Card opens a Sheet or redirects to a Detail View.

---

## File Migration Notes

These files were consolidated into this document on 2026-02-04:
- `CODEBASE_ANALYSIS.md` → Deleted
- `SECURITY_AUDIT.md` → Deleted
- `PERFORMANCE_AUDIT.md` → Deleted
- `streaming-protocol.md` → Deleted
