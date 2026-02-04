# Scope AI Changelog

Historical record of completed plans, audits, and major changes.

---

## 2026-02-04: Profiles RLS Recursion Fix

**Issue:** Profiles table RLS policies queried the profiles table itself to check admin status, causing infinite recursion.

**Solution:**
- Created `is_admin()` SECURITY DEFINER function to bypass RLS
- Replaced recursive policies on profiles, categories, securityauditlog tables
- Migration: `20260204000001_fix_profiles_rls_recursion.sql`

---

## 2026-02-04: Agent System Overhaul

> Previously documented in: AGENT_REFACTOR_PLAN.md

**Change:** Refactored from multi-agent orchestration to single unified agent.

```
Before:  User → Classifier → Orchestrator (Gojo) → 10 Domain Agents → Tools
After:   User → Model Selector → Scope Brain → Tools
```

**Why:**
- Simpler architecture - one agent with full context
- Better reasoning - single LLM can reason across domains
- Lower latency - no classification hop or agent handoffs
- Easier maintenance - one system prompt vs 11 separate agents

**Deleted:**
- `src/lib/agents/orchestrator/` (agent, classifier, planner, router)
- `src/lib/agents/domains/` (10 domain agents)
- `src/lib/agents/message-bus.ts`, `registry.ts`, `base-agent.ts`

**Added:**
- `src/lib/agents/scope-brain/` (agent, model-selector, system-prompt)

---

## 2026-02-04: AI Tools Migration

> Previously documented in: ai-tools-migration-plan.md

**Change:** Migrated from hardcoded card displays to AI-composed block walkthroughs.

**Before:** Each tool hardcoded `display: { component: 'TransactionsTable', props: {...} }`
**After:** Tools return raw data, AI composes response using block primitives

**Three response modes:**
- Mode A (Chat): Answer in conversation, no overlay
- Mode B (Fixed walkthrough): Standardized document layout for formal reports
- Mode C (Dynamic walkthrough): AI freely composes blocks for analysis

**What stayed:** Tool definitions, registry, confirmation workflow, audit logging
**What changed:** Card registry replaced by block renderer, AI overlay supports 3 modes

---

## 2026-01-28: Performance Fixes

> Previously documented in: PERFORMANCE_FIX_PLAN.md

**Completed fixes:**

| Fix | Impact |
|-----|--------|
| Removed Three.js ecosystem | -1MB bundle size |
| Removed duplicate CompanyProvider | -50% context re-renders |
| Added React Query caching | Reduced duplicate API calls |
| Added AbortController to fetches | Prevented memory leaks |
| Parallelized sequential requests | Faster page loads |

---

## 2026-01-27: AI Tools Audit

> Previously documented in: AI_TOOLS_AUDIT.md, AI_AUDIT_COMPLETE.md

**Audit scope:** 55+ AI tools across 6 domains

**Findings:**
- All tools implemented with proper logic
- System prompts well-structured
- Proper audit logging via `ai_tool_executions` table
- Confirmation workflow working (5-min expiry, checkbox, audit trail)

**Status at time:** EXCELLENT (before agent system removal)

---

## 2026-01-27: TypeScript Errors Assessment

> Previously documented in: TYPESCRIPT_ERRORS_FIX_PLAN.md

**Status:** SKIPPED (low priority)

**Reason:** App builds fine, errors are cosmetic type mismatches that don't affect runtime.

**Count at time:** 69 errors (down from 102 after schema alignment)

**Categories:**
- Missing `UserScopedDb` methods (4 errors)
- Database type mismatches (41 errors)
- Missing properties in types (24 errors)

---

## 2026-01-26: Security Audit & Fixes

> Details in: ARCHITECTURE.md (Security section)

**Fixes applied:**
- RLS enabled on all tables with `user_id = (SELECT auth.uid())` pattern
- Removed public access policies (data leak vulnerability)
- Added FK constraints to `auth.users`
- Revoked anon access on sensitive tables
- Fixed 8 critical, 9 high-risk issues

**Score:** 5.8/10 → 8.5/10

---

## File Migration Notes

These files were consolidated into this changelog on 2026-02-04:
- `AGENT_REFACTOR_PLAN.md` → Deleted
- `ai-tools-migration-plan.md` → Deleted
- `PERFORMANCE_FIX_PLAN.md` → Deleted
- `AI_TOOLS_AUDIT.md` → Deleted
- `AI_AUDIT_COMPLETE.md` → Deleted
- `TYPESCRIPT_ERRORS_FIX_PLAN.md` → Deleted
