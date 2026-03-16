# Fix: Payments

> **Flow:** [`docs/flows/payments.md`](../flows/payments.md)
> **Thinking:** 🟢 Medium
> **Status:** ⬜ Not started

## Vision vs Reality

The flow describes: Stripe-powered subscription and token billing with custom checkout page.

### What exists
- Stripe integration exists (sandbox mode)
- Pricing tiers defined (Pro, Max, Enterprise)
- Basic checkout flow

### What to do
- 🟢 Verify custom checkout page works (not generic Stripe hosted page)
- 🟢 Verify webhook handles: `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated/deleted`
- 🟢 Verify `STRIPE_WEBHOOK_SECRET` is documented as deployment config requirement
- 🟢 Token purchase flow from Settings → Billing
- 🟢 Receipts downloadable from billing section

### Suspicious / needs founder input
- Is `STRIPE_WEBHOOK_SECRET` configured for any environment?
- Does the custom checkout page exist or is it using Stripe's hosted page?

## Acceptance Criteria
- [ ] Custom checkout page renders (Scope-branded)
- [ ] Subscription flow: landing → checkout → onboarding → dashboard
- [ ] Token purchase flow: settings → checkout → back to app with updated balance
- [ ] Webhooks handle all subscription lifecycle events
