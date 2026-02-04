# Scope AI Development Roadmap

**Created:** 2026-02-04
**Last Updated:** 2026-02-04

---

## Priority Order

| # | Plan | Status | Completed |
|---|------|--------|-----------|
| 1 | [Logic Audit Fixes](./LOGIC_AUDIT_REPORT.md) | ⏳ Pending | - |

---

## Completed Plans

| Plan | Completed Date |
|------|----------------|
| Profiles RLS Recursion Fix | 2026-02-04 |
| [AI Tools Migration](./ai-tools-migration-plan.md) | 2026-02-04 |
| [Agent Refactor](./AGENT_REFACTOR_PLAN.md) (Phase 1-5) | 2026-02-04 |
| [AI Tools Audit](./AI_TOOLS_AUDIT.md) | 2026-01-27 |
| [Performance Fix Plan](./PERFORMANCE_FIX_PLAN.md) | 2026-01-28 |

---

## Security & Architecture Assessment (2026-02-04)

### Security Status: IMPROVED but needs ongoing attention

**Fixed Issues:**
- ✅ Profiles RLS recursion - was causing infinite loops, now uses `is_admin()` SECURITY DEFINER function
- ✅ Multiple overlapping RLS policies consolidated
- ✅ `(SELECT auth.uid())` pattern used for performance (single evaluation vs per-row)

**Remaining Concerns:**
1. **Events table** - Still flagged in Logic Audit as having security issues (user_id column added but verify RLS is properly enforced)
2. **Settings persistence** - 8/10 settings tabs are decorative only (no data leak, but misleading UX)
3. **Rate limiting tables** - Intentionally permissive for anon (correct design, but document why)

### Data Leakage Risk: LOW

- All user tables have RLS enabled with `user_id = auth.uid()` policies
- Admin checks now use SECURITY DEFINER function (no recursion)
- FK constraints to `auth.users(id)` ensure referential integrity
- Service role access is properly scoped

### Code Quality: MODERATE

**Strengths:**
- Clean separation of AI tools by domain (bokforing, loner, skatt, etc.)
- Consistent tool interface pattern across all AI tools
- TypeScript types generally well-defined

**Areas for Improvement:**
- 48 migrations with overlapping changes - consider squashing for new deployments
- Some hardcoded mock data still present (see Logic Audit)
- Test coverage appears limited

### Architecture: GOOD

**Strengths:**
- Domain-driven organization (bokforing, loner, parter, skatt)
- AI tools properly separated from UI components
- Supabase RLS provides defense-in-depth

**Recommendations:**
1. Complete Logic Audit fixes (Phase 1 critical items first)
2. Add integration tests for RLS policies
3. Consider migration consolidation for cleaner history

---

## Skipped / Low Priority

| Plan | Reason |
|------|--------|
| [TypeScript Errors](./TYPESCRIPT_ERRORS_FIX_PLAN.md) | App builds fine, cosmetic only |

---

## Reference Documentation

| Document | Purpose |
|----------|---------|
| [Preview Features](./PREVIEW_FEATURES.md) | Lists features that are UI-complete but not connected to real backends |

---

## Workflow

When completing a plan:

1. Mark the plan as ✅ Complete in this file
2. Add the completion date
3. Edit the original plan doc to add a header like:

```markdown
> **Status:** ✅ COMPLETE  
> **Completed:** YYYY-MM-DD
```
