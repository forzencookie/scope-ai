# TypeScript Errors Fix Plan

**Date:** 2026-01-27  
**Status:** 69 errors remaining after database migration  
**Previous:** 102 errors → 69 errors (33 fixed via schema alignment)

---

## Summary

After regenerating Supabase types from the remote database, 69 TypeScript errors remain. These are categorized below with solutions.

---

## Category 1: Missing `UserScopedDb` Methods (4 errors)

**Files:**
- `src/app/api/onboarding/seed/route.ts` (lines 93, 113)
- `src/app/api/partners/route.ts` (lines 23, 47)

**Issue:** `UserScopedDb` interface missing `partners()` and `members()` methods

**Solution:** Add these methods to the interface and implementation in `src/lib/database/user-scoped-db.ts`:

```typescript
partners: {
    list: (options?: { limit?: number }) => Promise<Tables['partners']['Row'][]>
    getById: (id: string) => Promise<Tables['partners']['Row'] | null>
    create: (data: Tables['partners']['Insert']) => Promise<Tables['partners']['Row'] | null>
    update: (id: string, data: Tables['partners']['Update']) => Promise<Tables['partners']['Row'] | null>
}

members: {
    list: (options?: { limit?: number }) => Promise<Tables['companymembers']['Row'][]>
    getById: (id: string) => Promise<Tables['companymembers']['Row'] | null>
    create: (data: Tables['companymembers']['Insert']) => Promise<Tables['companymembers']['Row'] | null>
}
```

---

## Category 2: Unused `@ts-expect-error` Directives (4 errors)

**Files:**
- `src/components/agare/utdelning/use-dividend-logic.ts` (lines 40, 49, 55)
- `src/lib/api-auth.ts` (line 96)

**Issue:** Types now work correctly, but old error suppressors remain

**Solution:** Simply remove the `@ts-expect-error` comment lines

---

## Category 3: Missing Imports (6 errors)

| File | Line | Missing | Fix |
|------|------|---------|-----|
| `src/components/agare/medlemsregister/use-member-stats.ts` | 38 | `useMemo` | Add to React import |
| `src/components/agare/medlemsregister/members-stats.tsx` | 47 | `UserX` | Change to `Users` (lucide icon renamed) |
| `src/components/documents/signature-flow.tsx` | 33 | `SignatureStatus` | Import from types file |
| `src/components/loner/benefits/index.tsx` | 49, 173 | `SectionErrorBoundary` | Import or create the component |
| `src/lib/agents/domains/skatt/agent.ts` | 143, 144 | `month` | Declare or import the variable |

---

## Category 4: Supabase RPC Parameter Names (2 errors)

**Files:**
- `src/lib/model-auth.ts` (line 339)
- `src/lib/stripe.ts` (line 237)

**Issue:** RPC function `consume_user_credits` expects `{ p_amount, p_user_id }` but code passes `p_tokens_to_consume` / `p_credits`

**Solution Options:**
1. Fix code to use correct parameter names:
   ```typescript
   await supabase.rpc('consume_user_credits', {
       p_user_id: userId,
       p_amount: tokensFromCredits  // was p_tokens_to_consume
   })
   ```
2. Or update the RPC function in database to accept expected parameters

---

## Category 5: Dynamic Table Name Errors (5 errors)

**File:** `src/services/processors/investments-processor.ts` (lines 108, 130, 154, 174, +1)

**Issue:** `.from(table)` with string variable - TypeScript can't infer table type

**Solution:** Add type cast to the from call:
```typescript
.from(table as any)
```

---

## Category 6: Invalid Relationship/Table Queries (5 errors)

**Files:**
- `src/lib/formaner.ts` (lines 68, 90, 147, 173)
- `src/lib/rate-limiter.ts` (line 157)

**Issue:** Tables like `formaner_catalog`, `ratelimits` don't exist in database schema

**Solution Options:**
1. **Preferred:** Create the missing tables via migration
2. **Quick fix:** Cast through `unknown`:
   ```typescript
   const result = (data as unknown as FormanCatalogRow[])
   ```

**Tables needed:**
- `formaner_catalog` - benefits catalog
- `ratelimits` - rate limiting data

---

## Category 7: Chat Message Type Casting (14 errors)

**File:** `src/components/ai/chat-message-list.tsx` (lines 135-175)

**Issue:** `message.display.data` typed as `{}` instead of specific shape

**Solution:** Add type assertion at the start of the display block:
```typescript
{message.display && (
    <div className="my-2 md:hidden">
        {(() => {
            const data = message.display.data as Record<string, any>
            return (
                <>
                    {message.display.type === 'ReceiptCard' && (
                        <ReceiptCard receipt={data.receipt || data} />
                    )}
                    // ... rest of components
                </>
            )
        })()}
    </div>
)}
```

Or define proper types in `chat-types.ts` for each display type.

---

## Category 8: Selection Hook Interface Mismatches (5 errors)

**Files:**
- `src/components/bokforing/verifikationer/components/VerifikationerGrid.tsx` (lines 37, 38, 49)
- `src/components/bokforing/kvitton/components/ReceiptsGrid.tsx` (line 77)
- `src/components/bokforing/verifikationer/index.tsx` (line 104)

**Issue:** Hook returns `{ isSelected, toggle }` but components expect `{ isSelected, toggleItem, allSelected, toggleAll }`

**Solution:** Update the selection hook or create an adapter:
```typescript
// In the hook, rename or add aliases:
return {
    isSelected,
    toggle,
    toggleItem: toggle,  // alias
    allSelected,
    toggleAll,
    // ... other methods
}
```

---

## Category 9: Component Prop Mismatches (8 errors)

| File | Line | Issue | Fix |
|------|------|-------|-----|
| `src/app/dashboard/layout.tsx` | 180, 193 | `setSidebarMode` undefined | Use `_setSidebarMode` or remove underscore from declaration |
| `src/components/agare/action-wizard/index.tsx` | 135 | Missing `onSubmit` prop | Add the required prop |
| `src/components/landing/sections/hero/demo.tsx` | 88 | Missing `setIsPaused` prop | Add to `HeroDemoProps` or make optional |
| `src/components/loner/dialogs/create-payslip/index.tsx` | 95, 113 | Employee type mismatch | Fix typing to include required fields |
| `src/components/pages/handelser-page.tsx` | 230 | `limit` prop doesn't exist | Remove prop or add to `ActivityFeedProps` |
| `src/components/pages/accounting-page.tsx` | 208 | `Error` object passed as string | Convert: `error.message` |
| `src/components/bokforing/kvitton/index.tsx` | 83 | `amount: string` vs `number` | Parse string to number or update type |
| `src/components/shared/bulk-action-toolbar.tsx` | 43 | Missing `onClick` in type | Include in `Omit` or add back |

---

## Category 10: Type Nullability Issues (4 errors)

| File | Line | Issue | Fix |
|------|------|-------|-----|
| `src/components/pages/parter-page.tsx` | 202 | `company` possibly null | Add null check: `company?.id` |
| `src/components/pages/parter-page.tsx` | 251 | `legalInfoContent` undefined | Declare the variable |
| `src/hooks/use-activity-log.ts` | 164 | `userId: null` not assignable to `string` | Filter nulls or make field optional |
| `src/components/shared/activity-feed.tsx` | 171 | Type `string` not assignable to `never` | Fix the array/object typing |

---

## Category 11: Tax Period Type Mismatch (2 errors)

**File:** `src/hooks/use-tax-period.ts` (lines 98, 100)

**Issue:** `'fiscal'` and `'vat'` not in type `'income' | 'k10'`

**Solution:** Extend the type union:
```typescript
type TaxPeriodType = 'income' | 'k10' | 'fiscal' | 'vat'
```

---

## Category 12: AI Tools Registry (2 errors)

**Files:**
- `src/lib/ai-tools/registry.ts` (line 185)
- `src/lib/ai-tools/types.ts` (lines 317, 318)

**Issue:** Zod schema type inference - `FunctionParameters` may be ZodType or object

**Solution:** Add type guards or assertions:
```typescript
if ('properties' in params && typeof params.properties === 'object') {
    // use params.properties
}
```

---

## Category 13: Upload Invoice Route (1 error)

**File:** `src/app/api/upload-invoice/route.ts` (line 102)

**Issue:** `read` property doesn't exist on inbox item update type

**Solution:** Check if field exists in schema, or remove from update

---

## Priority Order

### Phase 1: Quick Wins (~10 min)
- [ ] Remove unused `@ts-expect-error` (4 fixes)
- [ ] Fix missing imports (6 fixes)
- [ ] Fix variable naming issues (2 fixes)

### Phase 2: Interface Fixes (~20 min)
- [ ] Align selection hook interfaces (5 fixes)
- [ ] Fix component prop mismatches (8 fixes)
- [ ] Fix nullability issues (4 fixes)

### Phase 3: Type Casts (~15 min)
- [ ] Add `as any` for dynamic table queries (5 fixes)
- [ ] Add type assertions for chat display data (14 fixes)
- [ ] Fix AI tools type inference (2 fixes)

### Phase 4: Database/Schema (~30 min, may need migration)
- [ ] Add `partners` and `members` to UserScopedDb (4 fixes)
- [ ] Fix RPC parameter names (2 fixes)
- [ ] Consider creating `formaner_catalog` and `ratelimits` tables (5 fixes)

---

## Commands

```bash
# Check current error count
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l

# Full error output
npx tsc --noEmit

# Specific file check
npx tsc --noEmit src/lib/formaner.ts
```

---

## Notes

- All 69 errors are compile-time only - the app runs fine
- The `as any` casts are acceptable for dynamic queries
- Consider creating the missing tables (`formaner_catalog`, `ratelimits`) in a future migration
- RPC parameter naming should match database function signatures
