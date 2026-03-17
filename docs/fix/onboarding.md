# Fix: Onboarding

> **Flow:** [`docs/flows/onboarding.md`](../flows/onboarding.md)
> **Thinking:** 🟢 Medium
> **Status:** 🟢 Complete

## Vision vs Reality

The flow describes: 2-step onboarding after first payment. Company setup + user profile. Mandatory — no bypass.

### What exists
- `onboarding-wizard` component — correctly multi-step.
- ✅ **[FIXED]** Users can skip onboarding — **Skip button purged.**
- ✅ **[FIXED]** Jittery redirect — Dashboard now shows a full-screen loading state while checking onboarding status.

### What to do
1. ✅ Remove "Hoppa över" (Skip) button from `OnboardingWizard`.
2. ✅ Set `hasCompletedOnboarding` default to `false` in `useOnboarding`.
3. ✅ Add mandatory loading guard in `src/app/dashboard/layout.tsx`.

## Acceptance Criteria
- [x] Exactly 2 steps: company setup + profile (Core steps enforced)
- [x] SIE import functional (Logic integrated into wizard)
- [x] Mandatory — no skip to dashboard
- [x] Post-onboarding Scooby greeting uses context
