# Onboarding & Payments — Implementation Plan

## Philosophy
Make the existing UI real. The onboarding wizard is 90% built — it just doesn't save anything. Wire it up, add the missing profile step, then fix payments. AI interview comes last once the app has data worth pre-populating.

---

## Phase 1: Make Onboarding Real

### 1a. Company Data Persistence
The wizard collects org-nr, company name, type, shares — then throws it all away. Fix: save to `companies` table as the user progresses through the wizard.

**What saves today:**
- Shareholders → `/api/onboarding/seed` → `shareholders` table
- Partners → `/api/onboarding/seed` → `partners` table
- SIE import → `/api/sie/import` → `transactions` + `accountbalances` tables
- Completion status → `/api/onboarding/status` PATCH → `profiles` table

**What needs to save:**
- Company type (AB/EF/HB/KB/Förening) → `companies.company_type`
- Org number → `companies.org_number`
- Company name → `companies.name`
- Share capital + total shares (AB) → `companies.share_capital`, `companies.total_shares`
- Onboarding mode (fresh/existing) → local state is fine, no need to persist

**Approach:** Add an `/api/onboarding/company` route (or extend `/api/onboarding/seed`) that upserts company data. Call it when the user completes each relevant step, so partial progress is saved.

### 1b. Profile & Preferences Step
Add a new onboarding step after company setup:
- Profile picture upload OR emoji avatar selection
- Dark/light mode preference
- Uses Supabase Storage for images, `profiles` table for preferences

### 1c. Guided App Tour (replaces AI Interview)
~~AI Interview~~ — Originally planned as a chat phase where the AI interviews the user. Replaced with a **guided first-login walkthrough**: after onboarding completes, the user gets an interactive step-by-step tour of the dashboard. Spotlight highlights one component at a time (sidebar sections, AI chat, reports, etc.) with tooltips explaining each area. Only the highlighted element is clickable — everything else is dimmed. Think Linear/Notion/Figma onboarding. Build after core features are production-solid.

---

## Phase 2: Image Uploads

One reusable upload component + Supabase Storage bucket. Unblocks:
- Onboarding → profile step (avatar)
- Settings → account tab (profile picture)
- Settings → company tab (company logo)
- Invoice/payslip PDF generation (logo on documents)

**Storage buckets:** `avatars` (profile pics) + `company-assets` (logos)

---

## Phase 3: Fix Payments

### 3a. Webhook Secret
`STRIPE_WEBHOOK_SECRET` is empty — webhooks silently fail. Must configure in Stripe Dashboard → Webhooks.

### 3b. Credits Tracking
No `user_credits` table exists. `use-ai-usage.ts` hardcodes extra credits to 0. Need:
- `user_credits` table (user_id, tokens_purchased, tokens_remaining, purchased_at)
- Update webhook handler to insert credits on purchase
- Update `use-ai-usage` to read real credit balance

### 3c. Real Billing History
Replace hardcoded demo rows in billing tab with actual Stripe data:
- `stripe.invoices.list({ customer })` for subscription invoices
- `stripe.checkout.sessions.list({ customer })` for one-time credit purchases
- Receipt download via Stripe's hosted invoice URLs

### 3d. Embedded Checkout
Replace Stripe hosted checkout with Stripe Embedded Checkout (`@stripe/react-stripe-js` + `EmbeddedCheckoutProvider`). Gives branded inline checkout without building a custom payment form. 90% of the branding benefit, 10% of the work vs fully custom.

---

## Deferred (Not in Scope)

| Feature | Reason |
|---------|--------|
| Guided App Tour | Replaces AI Interview — interactive first-login walkthrough with spotlight highlights. Build after core features are solid |
| Bank integration | Tink/Plaid is a separate project |
| Team email invites | Email infrastructure is a whole thing |
| Document upload persistence | Needs file categorization design first |
| Fully custom payment form | Embedded Checkout achieves the same goal |

---

## Priority Order

1. **Phase 1a** — Company data persistence (wire existing forms to DB)
2. **Phase 1b** — Profile & preferences step (new step + image upload)
3. **Phase 2** — Image upload component (reusable, unblocks Settings too)
4. **Phase 3a** — Webhook secret setup
5. **Phase 3b** — Credits tracking table + real balance
6. **Phase 3c** — Real billing history from Stripe
7. **Phase 3d** — Embedded checkout page
8. **Phase 1c** — Guided App Tour (deferred — after core features are production-ready)
