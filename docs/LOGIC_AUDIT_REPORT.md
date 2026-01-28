# 🔍 Logic & Functionality Audit Report

**Date:** January 28, 2026  
**Status:** UI ~95% complete, Logic ~60-65% complete

---

## Executive Summary

This audit examined all major categories for logic issues, hardcoded data, and incomplete functionality. The UI is nearly complete, but critical backend logic and data persistence is missing across many features.

---

## 🚨 CRITICAL ISSUES

### 1. AI Chat is Broken

**Error:** `Invalid schema for function 'create_verification': object schema missing properties`

**Root Cause:** Three tools use Zod schemas while the system expects JSON Schema:

- `create_verification` (src/lib/ai-tools/bokforing/create-verification.ts)
- `register_employee` (src/lib/ai-tools/loner/employees.ts)
- `generate_roadmap` (src/lib/ai-tools/planning/roadmap-generator.ts)

**Fix:** Convert to JSON Schema format or add Zod-to-JSON conversion.

---

### 2. Settings Don't Persist (8 of 10 tabs broken)

| Tab           | Status     | Issue                                                         |
| ------------- | ---------- | ------------------------------------------------------------- |
| Notifications | ❌ Broken  | Toggles are decorative, no state/persistence                  |
| Appearance    | ❌ Broken  | Theme/density don't save, ThemeButton not connected           |
| Language      | ❌ Broken  | All selects display-only                                      |
| Email         | ❌ Broken  | Toggles don't persist                                         |
| Accessibility | ❌ Broken  | Toggles don't persist                                         |
| Security      | ❌ Broken  | Hardcoded sessions ("MacBook Pro", "iPhone 15 Pro"), fake 2FA |
| Integrations  | ❌ Broken  | No connection logic, all decorative                           |
| Billing       | ❌ Broken  | Hardcoded mock data ("•••• 4242"), no Stripe integration      |
| Account       | 🟡 Partial | Avatar upload missing, name/email work                        |
| Company       | ✅ Works   | Properly persists via hook                                    |

---

### 3. Events System Security Hole

- `events` table has **no user_id column**
- RLS policy: `USING (true)` allows ALL users to read ALL events
- Events from one company visible to everyone
- **Critical privacy/security vulnerability**

---

### 4. No Customer/Supplier Registry

- Customer data stored inline on each invoice
- Must re-enter customer details every time
- No supplier master data for vendor relationships
- **Major productivity loss for accountants**

---

### 5. Payroll Missing Critical Features

| Feature                                | Status     | Impact                               |
| -------------------------------------- | ---------- | ------------------------------------ |
| Swedish tax tables (skattetabeller)    | ❌ Missing | Uses flat 24% instead of real tables |
| Employer contributions accounting      | ❌ Missing | Not booked to 7510/2730              |
| Personnummer for AGI                   | ❌ Missing | Cannot submit to Skatteverket        |
| Vacation pay (semesterersättning)      | ❌ Missing | Legally required                     |
| Pension contributions (tjänstepension) | ❌ Missing | Common benefit                       |
| Time tracking persistence              | ❌ Missing | Just shows toast, doesn't save       |
| Age-reduced employer fees              | ❌ Missing | Wrong rates for <23 or >65           |

---

## 🟠 MODERATE ISSUES

### Broken Dialogs

| Dialog            | File                         | Issue                             |
| ----------------- | ---------------------------- | --------------------------------- |
| MotionDialog      | arsmote/index.tsx            | Form data discarded, submits `{}` |
| PlanMeetingDialog | arsmote/index.tsx            | Attendees/notes discarded         |
| ReportDialog      | team/report-dialog.tsx       | No API integration                |
| AddEmployeeDialog | team/add-employee-dialog.tsx | No validation before submit       |

### Händelser (Events) Issues

| Issue                          | File                    | Details                                             |
| ------------------------------ | ----------------------- | --------------------------------------------------- |
| Hardcoded "Rice" board member  | board-change-form.tsx   | Should fetch actual board members                   |
| Roadmap creates generic steps  | action-wizard/index.tsx | Promises AI but uses 3 hardcoded steps              |
| Calendar clicks do nothing     | handelser-kalender.tsx  | `onEventClick` not handled                          |
| Wrong completion message       | step-complete.tsx       | Says "protokoll" for all actions including roadmaps |
| Mock shareholders in migration | compliance.sql          | Hardcoded "Rice" and "Investor AB"                  |

### Reports Issues

| Report         | Issue                                             |
| -------------- | ------------------------------------------------- |
| AGI            | No per-employee breakdown (only totals)           |
| K10            | `sparatUtdelningsutrymme` hardcoded to 0          |
| All Reports    | No previous year comparisons                      |
| Moms           | EU transactions (ruta 35-37) not implemented      |
| Årsredovisning | Förvaltningsberättelse and notes are placeholders |

---

## ✅ WHAT WORKS WELL

### Accounting Core

- ✅ Verifications save to real Supabase database
- ✅ Double-entry bookkeeping correct
- ✅ Account balances calculated from ledger via RPC
- ✅ BAS account mapping correct for Swedish accounting

### Reports (Calculations)

- ✅ Momsdeklaration calculated from real verifications
- ✅ Resultaträkning/Balansräkning from actual data
- ✅ K10 3:12 rules properly implemented
- ✅ INK2 with 50+ fields mapped correctly
- ✅ XML/SRU export for Skatteverket

### Invoicing

- ✅ Customer invoices create proper verifications
- ✅ Supplier invoices with AI extraction
- ✅ PDF generation works
- ✅ OCR number calculation correct

### Documents

- ✅ AI document extraction functional
- ✅ Receipt capture and processing
- ✅ Compliance documents (corporate actions)

---

## 📊 FUNCTIONALITY BY CATEGORY

| Category           | UI Complete | Logic Complete | Notes                                   |
| ------------------ | ----------- | -------------- | --------------------------------------- |
| **Bokföring**      | 95%         | 85%            | Core works, some dialogs broken         |
| **Rapporter**      | 90%         | 80%            | Real calculations, missing comparatives |
| **Fakturering**    | 90%         | 75%            | Works but no customer registry          |
| **Löner**          | 85%         | 40%            | Missing tax tables, employer fees       |
| **Händelser**      | 90%         | 50%            | Events/roadmaps partially work          |
| **Inställningar**  | 95%         | 20%            | Almost entirely decorative              |
| **Parter**         | 85%         | 60%            | HB/KB partners only, no customers       |
| **AI Chat**        | 90%         | 0%             | Currently broken (schema error)         |
| **Ägare/Styrning** | 85%         | 60%            | Some hardcoded data                     |

---

## 🎯 FIX PLAN

### Phase 1: Critical Blockers (Today)

| #   | Task                          | Impact                  | Effort |
| --- | ----------------------------- | ----------------------- | ------ |
| 1   | **Fix AI schema error**       | AI completely broken    | 30 min |
| 2   | **Fix events table security** | Data leak vulnerability | 45 min |

### Phase 2: Core Functionality (This Week)

| #   | Task                                   | Impact                   | Effort  |
| --- | -------------------------------------- | ------------------------ | ------- |
| 3   | **Create settings persistence**        | 8 settings tabs broken   | 2-3 hrs |
| 4   | **Add customers table**                | Invoicing productivity   | 1-2 hrs |
| 5   | **Add suppliers table**                | Supplier invoice linking | 1 hr    |
| 6   | **Fix payroll employer contributions** | Incorrect bookkeeping    | 30 min  |

### Phase 3: UX Polish (This Week)

| #   | Task                             | Impact                | Effort |
| --- | -------------------------------- | --------------------- | ------ |
| 7   | **Fix broken dialogs**           | Forms don't save      | 1 hr   |
| 8   | **Fix Händelser hardcoded data** | Wrong data displayed  | 30 min |
| 9   | **Connect theme to next-themes** | Theme doesn't persist | 15 min |

### Phase 4: Enhancements (This Month)

| #   | Task                        | Impact             | Effort  |
| --- | --------------------------- | ------------------ | ------- |
| 10  | **Add comparative periods** | Reports incomplete | 3-4 hrs |

---

## Detailed Fix Instructions

### Task 1: Fix AI Schema Error

**Files to modify:**

- `src/lib/ai-tools/bokforing/create-verification.ts`
- `src/lib/ai-tools/loner/employees.ts`
- `src/lib/ai-tools/planning/roadmap-generator.ts`

**Change:** Replace Zod schema with JSON Schema format:

```typescript
// FROM (Zod):
parameters: z.object({
    description: z.string().describe("..."),
    rows: z.array(z.object({...}))
})

// TO (JSON Schema):
parameters: {
    type: 'object',
    properties: {
        description: { type: 'string', description: '...' },
        rows: { type: 'array', items: { type: 'object', properties: {...} } }
    },
    required: ['description', 'rows']
}
```

---

### Task 2: Fix Events Table Security

**Create migration:** `supabase/migrations/XXXXXX_fix_events_security.sql`

```sql
-- Add user_id column
ALTER TABLE events ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update existing events (optional: assign to first admin or delete)
-- DELETE FROM events WHERE user_id IS NULL;

-- Drop old permissive policy
DROP POLICY IF EXISTS "Enable read access for all users" ON events;

-- Create proper RLS policies
CREATE POLICY "Users can read own events" ON events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events" ON events
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

### Task 3: Create Settings Persistence

**Create migration:** `supabase/migrations/XXXXXX_create_user_preferences.sql`

```sql
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,

    -- Notifications
    notify_new_invoices BOOLEAN DEFAULT true,
    notify_payment_reminders BOOLEAN DEFAULT true,
    notify_tax_deadlines BOOLEAN DEFAULT true,
    notify_mobile BOOLEAN DEFAULT false,

    -- Appearance
    theme TEXT DEFAULT 'system', -- 'light', 'dark', 'system'
    density TEXT DEFAULT 'normal', -- 'compact', 'normal', 'comfortable'
    compact_sidebar BOOLEAN DEFAULT false,

    -- Language
    language TEXT DEFAULT 'sv',
    currency TEXT DEFAULT 'SEK',
    date_format TEXT DEFAULT 'YYYY-MM-DD',
    first_day_of_week INTEGER DEFAULT 1,
    text_mode TEXT DEFAULT 'enkel', -- 'enkel', 'avancerad'

    -- Email
    daily_summary BOOLEAN DEFAULT false,
    marketing_emails BOOLEAN DEFAULT false,

    -- Accessibility
    reduce_motion BOOLEAN DEFAULT false,
    high_contrast BOOLEAN DEFAULT false,
    larger_text BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);
```

**Create API:** `src/app/api/user/preferences/route.ts`

**Create hook:** `src/hooks/use-preferences.ts`

---

### Task 4: Add Customers Table

**Create migration:**

```sql
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    org_number TEXT,
    email TEXT,
    phone TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    postal_code TEXT,
    city TEXT,
    country TEXT DEFAULT 'SE',
    payment_terms INTEGER DEFAULT 30,
    credit_limit DECIMAL(15,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add customer_id to invoices
ALTER TABLE invoices ADD COLUMN customer_id UUID REFERENCES customers(id);
```

---

### Task 5: Add Suppliers Table

**Create migration:**

```sql
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    org_number TEXT,
    email TEXT,
    phone TEXT,
    bankgiro TEXT,
    plusgiro TEXT,
    iban TEXT,
    payment_terms INTEGER DEFAULT 30,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add supplier_id to supplier_invoices
ALTER TABLE supplier_invoices ADD COLUMN supplier_id UUID REFERENCES suppliers(id);
```

---

### Task 6: Fix Payroll Employer Contributions

**File:** `src/components/loner/create-payslip/index.tsx`

**Add to verification rows:**

```typescript
const employerContribution = Math.round(finalSalary * 0.3142);

await addVerification({
  description: `Lön ${selectedEmp.name} ${currentPeriod}`,
  rows: [
    { account: "7010", debit: finalSalary, credit: 0 }, // Salary expense
    { account: "7510", debit: employerContribution, credit: 0 }, // Employer contribution expense
    { account: "2710", debit: 0, credit: tax }, // Tax liability
    { account: "2730", debit: 0, credit: employerContribution }, // Employer contribution liability
    { account: "1930", debit: 0, credit: netSalary }, // Bank payment
  ],
});
```

---

## Files Referenced

### Settings

- `src/components/installningar/tabs/notifications-tab.tsx`
- `src/components/installningar/tabs/appearance-tab.tsx`
- `src/components/installningar/tabs/language-tab.tsx`
- `src/components/installningar/tabs/email-tab.tsx`
- `src/components/installningar/tabs/accessibility-tab.tsx`
- `src/components/installningar/tabs/security-tab.tsx`
- `src/components/installningar/tabs/integrations-tab.tsx`
- `src/components/installningar/tabs/billing-tab.tsx`

### Events

- `src/components/handelser/`
- `src/components/agare/action-wizard/`
- `src/hooks/use-events.ts`
- `supabase/migrations/*events*.sql`

### AI Tools

- `src/lib/ai-tools/bokforing/create-verification.ts`
- `src/lib/ai-tools/loner/employees.ts`
- `src/lib/ai-tools/planning/roadmap-generator.ts`
- `src/lib/ai-tools/types.ts`

### Payroll

- `src/components/loner/`
- `src/hooks/use-employees.ts`
- `src/app/api/payroll/`

### Reports

- `src/components/rapporter/`
- `src/hooks/use-financial-reports.ts`
- `src/services/processors/reports/`
