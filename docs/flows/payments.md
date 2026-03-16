# Workflow: Payment Integration

> Stripe-powered subscription and token billing. Custom checkout, not generic Stripe hosted page.

## What It Is

Payment integration handles two flows: subscribing to a plan and buying additional AI tokens. Both use Stripe with a custom checkout page for branding consistency.

## Subscription Flow

```
Landing page → user clicks "Subscribe" on a plan
  → Custom checkout page (Scope-branded, not Stripe hosted)
  → Stripe processes payment
  → On success → redirect to onboarding
  → Onboarding is mandatory (no skipping to dashboard)
  → After onboarding → dashboard
```

### Tiers

| Tier | Access | AI Tokens |
|------|--------|-----------|
| **Pro** | Full functionality, real Scooby | Monthly allocation |
| **Max** | Everything in Pro + priority | Higher allocation |
| **Enterprise** | "Contact us" — deferred until proven at smaller scale | Custom |

No free tier. No demo with real AI. Demo mode shows fake data, no AI tokens. "Serious players only."

## Token Purchase Flow

```
User in Settings → Billing tab → clicks "Köp tokens"
  → Custom checkout page (same component, dynamic items)
  → Stripe processes payment
  → On success → redirect back to app
  → Token balance updates immediately
```

## Technical Requirements

- Custom checkout page component (not Stripe's generic hosted checkout)
- `STRIPE_WEBHOOK_SECRET` must be configured for production
- Webhook handles: `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated/deleted`
- Receipts stored and downloadable from Settings → Billing

## What Connects Here

- Landing page triggers subscription checkout
- Settings → Billing triggers token purchase and shows subscription management
- Onboarding is the mandatory next step after first subscription
- Token balance affects whether Scooby can process requests (manual mode when tokens run out)
