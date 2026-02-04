# 🔮 Preview Features

**Created:** 2026-02-04  
**Last Updated:** 2026-02-04

> **Purpose:** Features that are built and visible in the UI but require external integrations not yet available.

---

## Government API Integrations

### Skatteverket Submissions

| Feature | Location | Behavior |
|---------|----------|----------|
| "Skicka till Skatteverket" buttons | Moms, AGI, K10, INK2, NE-bilaga | Downloads SRU/XML for manual upload |

**What works:**
- All tax calculations are real and accurate
- SRU/XML file generation for manual upload to Skatteverket
- AI validation of submitted data

**What doesn't work:**
- Direct API submission (requires BankID integration & agency approval)

---

### Bolagsverket Submissions

| Feature | Location | Behavior |
|---------|----------|----------|
| Årsredovisning submission | Rapporter → Årsredovisning | Generates PDF for manual upload |

**What works:**
- Document generation (PDF årsredovisning)
- AI validation of submissions

**What doesn't work:**
- Direct API submission (requires agency approval)

---

## Settings → Integrations

| Integration | Status | Notes |
|-------------|--------|-------|
| Bankkonto | `comingSoon` | Bank connection via Tink/Plaid |
| Bankgirot | `comingSoon` | Payment file generation |
| Swish | `comingSoon` | Business Swish API |
| Kalender | ✅ Works | iCal feed at `/api/calendar/feed` |

---

## Why Preview?

These integrations are preview because:

1. **Regulatory approval** — Skatteverket and Bolagsverket require formal agreements
2. **BankID** — Government submissions require BankID which needs certification
3. **Bank APIs** — Require partnership with Tink/Plaid and PSD2 compliance

All features gracefully degrade — users can export files (SRU, PDF) and submit manually.
