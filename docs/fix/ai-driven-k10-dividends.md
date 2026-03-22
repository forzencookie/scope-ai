# Feature: K10 & Dividend Calculation

> **Flow:** [`docs/flows/tools.md`](../flows/tools.md)
> **Status:** ⬜ Not started — future feature

## What This Is

A tool that pulls the user's real financial data (shares, acquisition price, salary paid, free equity) so Scooby can calculate optimal K10 dividend. Same pattern as every other tool — `get_dividend_data` fetches numbers, Scooby reasons about them.

## What Needs to Be Built

1. **`get_dividend_data` tool** — Returns from the user's data:
   - Total shares and acquisition price (from share register)
   - Salary paid by the company last year (from payroll)
   - Free equity balance (Konto 2091-2099)
   - Previous year's dividend (if any)

2. **`calculate_k10` tool** — Deterministic calculation (like `calculate_employer_tax`):
   - Simplified rule (förenklingsregeln): uses IBB (inkomstbasbelopp)
   - Salary-based rule (huvudregeln): uses actual salary data
   - Returns both results so Scooby can recommend the better one

3. **Solvency check** — Tool returns distributable equity so Scooby can warn if dividend exceeds safe limits (ABL 17:3)

4. **System prompt context** — K10 rules reference so Scooby can explain *why* one rule is better

## Design Principles

- Named `get_dividend_data` and `calculate_k10` — consistent with other tools (no "AI" prefix)
- Deterministic calculation in the tool, reasoning and explanation from Scooby
- Tax rates and IBB values from data sources, not hardcoded

## Acceptance Criteria
- [ ] `get_dividend_data` returns real ledger values for the user's company
- [ ] `calculate_k10` computes both rules correctly
- [ ] Scooby explains which rule is better and why, using the user's actual numbers
- [ ] Dividend planning happens in chat, not a static calculator page
