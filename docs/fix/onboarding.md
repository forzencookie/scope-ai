# Fix: Onboarding

> **Flow:** [`docs/flows/onboarding.md`](../flows/onboarding.md)
> **Thinking:** 🟢 Medium
> **Status:** ⬜ Not started

## Vision vs Reality

The flow describes: 2-step onboarding after first payment. Company setup + profile. Mandatory before dashboard.

### What exists
- Onboarding wizard exists at `/onboarding`
- Company setup step exists
- Profile step exists

### What to do
- 🟢 Verify onboarding is exactly 2 steps (company + profile) — remove any extra steps
- 🟢 Verify SIE file import works in company setup step
- 🟢 Verify onboarding is mandatory after first payment (can't skip to dashboard)
- 🟢 Verify Scooby greeting after onboarding reflects what was set up

### Suspicious / needs founder input
- Old bank integration step was already removed — verify no leftover references
- Are there any extra onboarding steps that should be removed?

## Acceptance Criteria
- [ ] Exactly 2 steps: company setup + profile
- [ ] SIE import functional
- [ ] Mandatory — no skip to dashboard
- [ ] Post-onboarding Scooby greeting uses context
