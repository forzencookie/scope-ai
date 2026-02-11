# Remaining Gaps — Road to Semi-Finished

## Current State

| Area | Status | Verdict |
|------|--------|---------|
| **Företagsstatistik** | 65% | Founder says "good as is" — leave it |
| **Inställningar** | 70% | Shell is strong (10 tabs, theme, i18n). Missing: profile picture upload, company logo upload, billing receipts |
| **Payments** | 60% | Stripe checkout works but uses hosted Stripe page (founder wants custom). Credit purchases work. No receipts/history UI |
| **Onboarding** | 50% | Beautiful 12-step wizard with animations but forms don't actually save data. No AI interview phase. No profile setup |

## The Real Gaps to "Semi-Finished"

**Onboarding** is the biggest gap — it's the first thing a user touches and currently nothing persists. The three founder phases:

1. **Company Setup** — UI exists (org-nr, name, type, shares) but doesn't save to DB
2. **Profile & Preferences** — not in the flow at all (no photo/emoji, no dark/light choice)
3. **AI Interview** — doesn't exist yet

**Payments** has one structural issue: founder specifically wants a **custom checkout page** for branding, not Stripe's hosted page. That's a meaningful build.

**Settings** needs profile picture upload + company logo upload to unblock the document generation features (invoices, payslips).

## Priority Order

1. **Onboarding data persistence** — make the existing steps actually save (biggest bang, existing UI)
2. **Profile/company image uploads** — Supabase Storage, affects Settings + Onboarding + documents
3. **Custom checkout page** — replace Stripe hosted with embedded form
4. **AI Interview step** — add a chat phase to onboarding (depends on existing AI infra)
