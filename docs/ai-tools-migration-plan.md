# AI Tools Migration Plan

> **Status:** ✅ COMPLETE  
> **Phase 1:** ✅ Complete (2026-01-XX) - Block primitives & renderer built  
> **Phase 2:** ✅ Complete (2026-02-04) - All `display:` fields removed from tools  
> **Phase 3:** ✅ Complete (2026-02-04) - System prompt enhanced with block library & domain guidance  
> **Phase 4:** ✅ Complete (2026-02-04) - Deprecated types marked, legacy infrastructure preserved for fallback

From hardcoded card displays to AI-composed block walkthroughs.

---

## Premise

The ~98 AI tools are sound — they fetch data, write records, handle confirmations, and log audits. The problem is the display layer: each tool hardcodes which UI component to render (`display: { component: 'TransactionsTable', props: {...} }`), giving the AI zero control over presentation.

The target: tools return raw data, the AI composes a response using block primitives based on intent and domain guidance. Three response modes (chat, fixed walkthrough, dynamic walkthrough) replace the single centered-card overlay.

---

## What Stays

| Layer | Status | Reason |
|---|---|---|
| Tool definitions (~98) | Keep as-is | Domain logic, Supabase queries, validation |
| Tool registry | Keep as-is | Registration, execution, format conversion |
| Confirmation workflow | Keep as-is | 5-min expiry, checkbox, audit trail |
| Audit logging | Keep as-is | `ai_tool_executions` table, compliance |
| Stream protocol (`T:`/`D:`) | Extend | Add `W:` packet for walkthrough blocks |
| System prompt | Extend | Add STEP 0 intent detection + domain guidance |

## What Changes

| Layer | Current | Target |
|---|---|---|
| Card registry (70+ components) | Hardcoded per-tool mapping | Replaced by block renderer |
| AI overlay | Single mode (centered card) | Three modes (none, fixed, dynamic) |
| WalkthroughOverlay | Hardcoded for balance audit | Generic block composition renderer |
| ConfirmationCard | Standalone modal-like card | Inline step within walkthrough |
| Tool `display` field | `{ component: 'X', props }` | Raw data only, AI picks blocks |
| Display components | One-off per domain | ~24 reusable block primitives |

---

## Block Primitives

These are the atomic UI building blocks the AI assembles into walkthroughs. Each block takes typed props and renders a self-contained section.

### Core Blocks (build in Phase 1)

| # | Block | Purpose | Props |
|---|---|---|---|
| 1 | `stat-cards` | Row of KPI cards | `items: { label, value, change?, trend?, icon? }[]` |
| 2 | `financial-table` | Accounting table with debit/credit | `columns, rows, totals?, highlights?` |
| 3 | `data-table` | Generic sortable table | `columns, rows, caption?` |
| 4 | `chart` | Bar/line/pie visualization | `type, data, xKey, yKey, title?` |
| 5 | `ranked-list` | Ordered items with values | `items: { rank, label, value, badge? }[]` |
| 6 | `timeline` | Chronological events | `events: { date, title, description?, status? }[]` |
| 7 | `checklist` | Actionable todo items | `items: { label, checked, detail? }[]` |
| 8 | `info-card` | Highlighted explanation box | `title?, content, variant: info/warning/success/error` |
| 9 | `legal-paragraphs` | Formal document text | `sections: { heading?, body }[]` |
| 10 | `key-value` | Label-value pairs | `items: { label, value }[], columns?: 1/2/3` |
| 11 | `comparison` | Side-by-side options | `options: { title, items: {label, value}[], recommended? }[]` |
| 12 | `action-bar` | Confirm/cancel/edit buttons | `actions: { label, variant, onClick }[]` |
| 13 | `separator` | Visual divider | `label?` |
| 14 | `heading` | Section title | `text, level: 1/2/3, subtitle?` |
| 15 | `prose` | Free-form markdown text | `content: string` |
| 16 | `status-check` | Pass/warning/fail indicator | `items: { label, status, detail? }[]` |
| 17 | `document-preview` | PDF/formal document frame | `title, meta: {label,value}[], body` |
| 18 | `form-fields` | Read-only form display | `fields: { label, value, type? }[]` |
| 19 | `progress-bar` | Completion indicator | `value, max, label?` |
| 20 | `confirmation` | Inline confirm step | `title, summary: {label,value}[], warnings?, checkbox?` |
| 21 | `employee-row` | Employee info display | `name, role, salary?, status?` |
| 22 | `invoice-row` | Invoice line display | `number, customer, amount, status, dueDate?` |
| 23 | `transaction-row` | Transaction line display | `date, description, amount, account?, status?` |
| 24 | `receipt-row` | Receipt line display | `supplier, amount, date, matched?` |

### Block Component Interface

Every block implements the same interface:

```typescript
interface BlockProps<T = unknown> {
  type: string        // block type name
  props: T            // block-specific typed props
  id?: string         // optional unique ID for keying
}

interface WalkthroughResponse {
  mode: 'fixed' | 'dynamic'
  title: string
  subtitle?: string
  blocks: BlockProps[]
}
```

### Block Renderer

A single component that maps block types to React components:

```typescript
function BlockRenderer({ block }: { block: BlockProps }) {
  const Component = blockMap[block.type]
  if (!Component) return null
  return <Component {...block.props} />
}

function WalkthroughRenderer({ response }: { response: WalkthroughResponse }) {
  return (
    <div className="walkthrough">
      <h1>{response.title}</h1>
      {response.subtitle && <p>{response.subtitle}</p>}
      {response.blocks.map((block, i) => (
        <BlockRenderer key={block.id ?? i} block={block} />
      ))}
    </div>
  )
}
```

---

## Stream Protocol Extension

Current protocol:
```
T:{"delta":"text"}     → Chat text
D:{"display":{...}}    → Card display data
```

Extended protocol:
```
T:{"delta":"text"}     → Chat text (Mode A)
D:{"display":{...}}    → Legacy card display (backward compat)
W:{"walkthrough":{...}} → Walkthrough block composition (Mode B/C)
```

The `W:` packet carries a `WalkthroughResponse`:
```json
{
  "mode": "fixed",
  "title": "Resultaträkning Q3 2025",
  "blocks": [
    { "type": "stat-cards", "props": { "items": [...] } },
    { "type": "financial-table", "props": { "columns": [...], "rows": [...] } },
    { "type": "info-card", "props": { "content": "...", "variant": "info" } }
  ]
}
```

---

## Phase 1 — Block Primitives & Renderer

**Goal:** Build the 24 block components and a WalkthroughRenderer that can display them. Nothing changes about the existing system — this is additive.

### Files to create

```
src/components/ai/blocks/
├── index.ts                    # Block registry + BlockRenderer + WalkthroughRenderer
├── types.ts                    # BlockProps, WalkthroughResponse types
├── stat-cards.tsx              # KPI row
├── financial-table.tsx         # Debit/credit accounting table
├── data-table.tsx              # Generic table
├── chart.tsx                   # Recharts wrapper (bar/line/pie)
├── ranked-list.tsx             # Ordered items
├── timeline.tsx                # Chronological events
├── checklist.tsx               # Todo items
├── info-card.tsx               # Info/warning/success/error box
├── legal-paragraphs.tsx        # Formal document sections
├── key-value.tsx               # Label-value pairs
├── comparison.tsx              # Side-by-side options
├── action-bar.tsx              # Buttons row
├── separator.tsx               # Divider
├── heading.tsx                 # Section title
├── prose.tsx                   # Markdown content
├── status-check.tsx            # Pass/warning/fail items
├── document-preview.tsx        # Formal document frame
├── form-fields.tsx             # Read-only form
├── progress-bar.tsx            # Completion indicator
├── confirmation.tsx            # Inline confirmation step
├── entity-rows.tsx             # Employee/invoice/transaction/receipt rows
└── block-renderer.tsx          # Registry + renderer
```

### Files to modify

```
src/components/ai/walkthrough-overlay.tsx
  → Refactor to use WalkthroughRenderer instead of hardcoded audit layout

src/hooks/chat/use-stream-parser.ts
  → Add W: packet parsing alongside existing T: and D:

src/providers/ai-overlay-provider.tsx
  → Add walkthroughBlocks state alongside existing walkthroughContent

src/components/ai/ai-overlay.tsx
  → Add branch: if walkthroughBlocks, render via WalkthroughRenderer
```

### Acceptance criteria
- All 24 block components render correctly in isolation
- WalkthroughRenderer composes any combination of blocks
- `W:` packets parsed by stream parser
- Overlay can display block-based walkthroughs
- Existing `D:` card system still works unchanged
- No regressions in current tool behavior

---

## Phase 2 — Tool Return Type Evolution

**Goal:** Tools return raw data. The AI decides presentation via system prompt + domain guidance.

### Changes to tool definitions

Before:
```typescript
return {
  success: true,
  data: transactions,
  display: {
    component: 'TransactionsTable',
    props: { transactions, highlights: ['missing-receipt'] }
  }
}
```

After:
```typescript
return {
  success: true,
  data: transactions,
  // display field removed — AI composes blocks from data
}
```

### System prompt additions

The AI receives domain guidance (from `walkthrough-designs.md`) telling it:
- Which blocks to use for which domain
- Fixed layouts: exact block sequence specified
- Dynamic layouts: block palette + rules, AI composes freely

### Transition strategy

Both paths work simultaneously:
1. If tool returns `display` → old card renderer handles it
2. If AI emits `W:` walkthrough → new block renderer handles it
3. Gradually remove `display` from tools as AI takes over each domain

### Files to modify

```
src/lib/ai-tools/bokforing/*.ts   → Remove display fields
src/lib/ai-tools/loner/*.ts       → Remove display fields
src/lib/ai-tools/skatt/*.ts       → Remove display fields
src/lib/ai-tools/parter/*.ts      → Remove display fields
src/lib/ai-tools/common/*.ts      → Remove display fields (keep navigation)
src/app/api/chat/route.ts         → Inject domain guidance into system prompt
src/app/api/chat/system-prompt.ts → Add STEP 0 + block composition rules
```

---

## Phase 3 — AI-Controlled Presentation

**Goal:** The AI has full control over how data is presented. Intent detection (Mode A/B/C) drives the response format.

### Intent detection

Added to system prompt as STEP 0 (already designed in `walkthrough-designs.md`):

```
STEP 0 — DETERMINE RESPONSE MODE:
A) CHAT: Questions, advice, explanations → respond in text only
B) FIXED WALKTHROUGH: Formal documents → use prescribed block layout
C) DYNAMIC WALKTHROUGH: Exploration/analysis → compose blocks freely
```

### Confirmation integration

Current: ConfirmationCard is a standalone overlay card.
Target: `confirmation` block embedded in walkthrough flow.

```json
{
  "mode": "fixed",
  "title": "Skapa faktura",
  "blocks": [
    { "type": "heading", "props": { "text": "Faktura #2025-047" } },
    { "type": "key-value", "props": { "items": [...] } },
    { "type": "financial-table", "props": { "rows": [...] } },
    { "type": "confirmation", "props": {
      "title": "Bekräfta faktura",
      "summary": [{ "label": "Total", "value": "12 500 kr" }],
      "warnings": ["Momsen beräknas automatiskt"],
      "checkbox": true
    }}
  ]
}
```

The confirmation block connects to the existing registry's pending confirmation system — no new backend logic needed.

### Files to modify

```
src/components/ai/ai-overlay.tsx
  → Simplify: only walkthrough mode + chat mode
  → Remove centered-card mode (replaced by inline blocks)

src/providers/ai-overlay-provider.tsx
  → Simplify status: hidden | thinking | walkthrough
  → Remove 'complete' status (blocks render inline or in walkthrough)

src/components/ai/confirmation-card.tsx
  → Keep as wrapper, but also export inline version for block use
```

---

## Phase 4 — Cleanup

**Goal:** Remove deprecated display infrastructure.

### Delete

```
src/components/ai/card-registry.ts          → Block renderer replaces it
src/components/ai/card-renderer.tsx          → Block renderer replaces it
~50 one-off display components               → Replaced by block primitives
```

### Simplify

```
src/lib/ai-tools/types.ts
  → Remove AIDisplayInstruction type
  → Remove display-related fields from AIToolResult

src/hooks/chat/use-stream-parser.ts
  → Remove D: packet parsing (only T: and W: remain)
```

### Verify

- All existing tool flows work through blocks
- Confirmation flow works inline
- Audit logging unchanged
- No regressions in any domain

---

## Risk Mitigation

**Parallel operation:** Phases 1-3 run both systems side by side. The old card system is never broken — it's only removed in Phase 4 after the new system is proven.

**Per-domain migration:** Phase 2 doesn't flip all tools at once. Migrate one domain at a time (start with Bokföring/Transaktioner, the most-used), verify, then continue.

**Fallback rendering:** If the AI emits a block type the renderer doesn't recognize, fall back to `prose` with JSON dump rather than crashing. Log the unknown type for debugging.

**Testing:** Each block component should have a Storybook-style preview (or a `/dev/blocks` route) showing all variants. This catches visual regressions before they reach users.
