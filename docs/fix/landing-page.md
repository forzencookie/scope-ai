# Fix: Landing Page

> **Flow:** [`docs/flows/landing-page.md`](../flows/landing-page.md)
> **Thinking:** 🟢 Medium
> **Status:** ⬜ Not started

## Vision vs Reality

The flow describes: public-facing pages that convert visitors to subscribers.

### What exists
- Landing page at `/`
- Public pages (login, register, pricing, etc.)
- Demo showcase component

### What to do
- 🟢 Verify all public routes exist and render correctly
- 🟢 Verify "Subscribe" button leads to custom Stripe checkout
- 🟢 Verify conversion flow: landing → pricing → checkout → onboarding → dashboard
- 🟢 Verify demo mode shows fake data without real AI access

### Suspicious / needs founder input
- Is the landing page content/copy finalized?
- Does the demo showcase need updating to reflect current app design?

## Acceptance Criteria
- [ ] All public routes render
- [ ] Subscribe → checkout → onboarding flow works end-to-end
- [ ] Demo mode functional with fake data
