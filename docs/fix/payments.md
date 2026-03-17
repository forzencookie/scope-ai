# Fix: Payments

> **Flow:** [`docs/flows/payments.md`](../flows/payments.md)
> **Thinking:** 🟢 Medium
> **Status:** 🟢 Complete

## Vision vs Reality

The flow describes: Stripe-powered subscription and token billing with custom branded checkout.

### What exists
- `CheckoutPage` using Stripe `EmbeddedCheckout`.
- ✅ **[VERIFIED]** Webhook handler in `api/stripe/webhook/route.ts` correctly handles subscriptions and one-time credit purchases.
- ✅ Tier mapping (`pro`, `max`, `free`) enforced in `updateUserTier`.

## Acceptance Criteria
- [x] Pricing page shows Pro/Max tiers
- [x] Checkout page renders (Scope-branded via Stripe)
- [x] Subscription flow: landing → checkout → onboarding → dashboard
- [x] Token purchase flow: settings → checkout → back to app with updated balance
- [x] Webhooks handle all subscription lifecycle events
