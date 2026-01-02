# PageLayout Refactoring Plan

> **Status:** Saved for post-MVP polish
> **Effort:** Medium (2-3 hours)
> **Priority:** Low - maintainability improvement, no functional change

## Problem

Most pages share this structure but implement it individually:
```
┌─────────────────────────────────────────┐
│ Header (title + description + action)   │
├─────────────────────────────────────────┤
│ StatCards row (3-4 cards)               │
├─────────────────────────────────────────┤
│ ─────────── separator ───────────       │
├─────────────────────────────────────────┤
│ Content (table, kanban, etc.)           │
└─────────────────────────────────────────┘
```

**DRY violations found:**
- `StatCardGrid columns` used 33 times
- `border-b-2 border-border/60` used 44 times
- Same header pattern repeated in 25+ files

---

## Solution

Create `src/components/ui/page-layout.tsx`:

```tsx
interface PageLayoutProps {
  title: string
  description?: string
  action?: React.ReactNode
  stats?: StatCardProps[]
  statsColumns?: 3 | 4
  children: React.ReactNode
  showSeparator?: boolean // default true
}

<PageLayout
  title="Transaktioner"
  description="Alla betalningar"
  action={<Button>Ny</Button>}
  stats={[{ label: "Antal", value: "0" }]}
>
  <DataTable>...</DataTable>
</PageLayout>
```

---

## Files to Refactor (~25)

### bokforing/
- [ ] table.tsx
- [ ] receipts-table.tsx
- [ ] invoices-table.tsx
- [ ] leverantorsfakturor-table.tsx
- [ ] verifikationer-table.tsx
- [ ] inventarier-table.tsx
- [ ] huvudbok.tsx
- [ ] invoices-kanban.tsx
- [ ] unified-invoices-view.tsx

### skatt/
- [ ] momsdeklaration-content.tsx
- [ ] inkomstdeklaration-content.tsx
- [ ] agi-content.tsx
- [ ] arsbokslut-content.tsx
- [ ] arsredovisning-content.tsx
- [ ] ne-bilaga-content.tsx

### loner/
- [ ] lonebesked-content.tsx
- [ ] benefits-tab.tsx

### parter/
- [ ] aktiebok.tsx
- [ ] delagare.tsx
- [ ] styrelseprotokoll.tsx
- [ ] bolagsstamma.tsx
- [ ] utdelning-content.tsx
- [ ] arsmote.tsx
- [ ] delagaruttag.tsx
- [ ] medlemsregister.tsx

---

## Files to Skip (~15)

| File | Reason |
|------|--------|
| financial-statements.tsx | Uses Table2Container |
| overview-tab.tsx | Dashboard layout |
| egenavgifter.tsx | Calculator layout |
| journal-calendar.tsx | Calendar component |
| handelser/* | Timeline layout |

---

## Expected Results

- **Lines removed:** ~1000
- **New component:** ~100 lines
- **Net reduction:** ~900 lines
