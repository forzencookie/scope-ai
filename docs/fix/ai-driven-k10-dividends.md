# Fix: AI-Driven K10 & Dividend Planning

> **Flow:** [`docs/flows/ai-interface.md`](../flows/ai-interface.md)
> **Status:** 🔴 Red (Needs Transition from "Calculator" to "CFO")

## The Problem
Currently, K10 and Dividend logic is partially hardcoded into "calculators" in the UI layer. This makes the app a "manageable tool" rather than a "Digital CFO." The AI should own the regulatory references, while the code owns the verified financial data.

## The Fix: Moving Logic to the "Brain"

### 1. The Calculator is a Bridge, not a Source
- **Old Way:** A TypeScript file calculates the `gränsbelopp` using a hardcoded variable for the 2025/2026 Price Base Amount (Prisbasbelopp).
- **New Way:** 
    - The **Code** provides: Total shares, acquisition price, salary paid by the company last year.
    - The **AI (Scooby)** provides: The current legal rules (Simplified rule vs. Salary-based rule) and the specific index values for that tax year.
    - **Result:** Scooby calculates the optimal dividend and explains *why* (e.g., "Because you paid X in salary, the salary-based rule is better this year").

### 2. Solvency Ownership (ABL 17:3)
- **Old Way:** UI shows a warning if dividend > distributable equity.
- **New Way:** 
    - The **Code** provides: Free equity balance (Konto 2091-2099).
    - The **AI** evaluates the risk: "You have 500k in free equity, but you have large upcoming tax payments. I recommend a max dividend of 300k to maintain liquidity."

## Technical Transition
- **Deprecate:** `src/components/agare/utdelning/dividend-calculator.tsx` (static logic).
- **Implement:** A tool `get_dividend_data` that returns raw ledger values. 
- **System Prompt:** Add K10 rule references to Scooby's context so he can reason about the numbers.

## Acceptance Criteria
- [ ] No hardcoded Swedish tax rules in the frontend.
- [ ] Scooby can explain the difference between the "Simplified rule" and "Salary rule" using the user's real numbers.
- [ ] Dividend planning starts in the chat, not by opening a calculator.
