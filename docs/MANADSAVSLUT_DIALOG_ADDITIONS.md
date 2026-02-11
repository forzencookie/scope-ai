# Månadsavslut Dialog — AI & Roadmap Sections

## What to Add
Two new sections in `month-review-dialog.tsx`, below the data sections and above Notes.

---

## 1. AI Conversations Section

**Data source**: `conversations` table, filtered by `created_at` within the month.

### API change (`/api/monthly-review/route.ts`)
Add query #9 to `Promise.allSettled`:
```ts
// 8: AI Conversations
userDb.client
    .from('conversations')
    .select('id, title, created_at')
    .gte('created_at', startDate)
    .lte('created_at', endDate + 'T23:59:59')
    .order('created_at', { ascending: false })
```

Add to response as new field (NOT inside `sections` — it has its own shape):
```ts
conversations: Array<{ id: string; title: string | null; created_at: string | null }>
```

### Dialog UI
- Section header: `<Bot className="h-4 w-4" /> AI-konversationer` + count badge
- Each conversation = clickable row: title (or "Utan titel"), date on the right
- Click → `router.push('/dashboard/ai?conversation=${id}')` (or whatever the AI chat route is)
- Only render if `conversations.length > 0`

### Check the AI route first
```bash
grep -r "conversation" src/app/dashboard --include="*.tsx" -l
```
Find the correct route to link to.

---

## 2. Roadmap Achievements Section

**Data source**: `roadmap_steps` table, filtered by `updated_at` within the month AND `status = 'completed'`.

### API change (`/api/monthly-review/route.ts`)
Add query #10 to `Promise.allSettled`:
```ts
// 9: Completed roadmap steps
userDb.client
    .from('roadmap_steps')
    .select('id, title, status, updated_at, roadmap_id')
    .eq('status', 'completed')
    .gte('updated_at', startDate)
    .lte('updated_at', endDate + 'T23:59:59')
    .order('updated_at', { ascending: false })
```

Add to response:
```ts
roadmapSteps: Array<{ id: string; title: string; updated_at: string; roadmap_id: string }>
```

### Dialog UI
- Section header: `<Map className="h-4 w-4" /> Roadmap-framsteg` + count badge
- Each step = row with checkmark icon + title + completion date
- Only render if `roadmapSteps.length > 0`

---

## Response Type Update

```ts
interface MonthlyReviewData {
    financial: { revenue: number; expenses: number; result: number }
    sections: Section[]
    // NEW:
    conversations: Array<{ id: string; title: string | null; created_at: string | null }>
    roadmapSteps: Array<{ id: string; title: string; updated_at: string; roadmap_id: string }>
}
```

---

## Dialog Layout Order (top to bottom)
1. Header with month nav arrows
2. Financial summary (3-stat row)
3. Data sections (transactions, invoices, etc.)
4. **AI Conversations** ← NEW
5. **Roadmap Achievements** ← NEW
6. Notes textarea
7. Checklist (4 checkboxes)
8. Footer close button

---

## Files to Touch
1. `src/app/api/monthly-review/route.ts` — add 2 queries + 2 response fields
2. `src/components/handelser/month-review-dialog.tsx` — add 2 UI sections + update interface
