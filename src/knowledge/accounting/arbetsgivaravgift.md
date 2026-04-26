# Arbetsgivaravgifter (Employer Social Contributions)

**Source:** Socialavgiftslagen (SAL), Skatteverket  
**Verified:** 2026 rates

Applies to: AB, HB/KB, EF with employees. Paid monthly with AGI declaration.  
Base: gross salary paid to employee (bruttolön).

## Full Rate — Born 1959–2000 (age 26–66 during 2026)

| Component | Rate |
|-----------|------|
| Sjukförsäkringsavgift | 3.55% |
| Föräldraförsäkringsavgift | 2.60% |
| Ålderspensionsavgift | 10.21% |
| Efterlevandepensionsavgift | 0.70% |
| Arbetsmarknadsavgift | 2.66% |
| Arbetsskadeavgift | 0.20% |
| Allmän löneavgift | 11.62% |
| **Total** | **31.42%** (+ 0.08% rounding = 31.42% effective) |

## Reduced Rate — Born 1958 or earlier (67+ during 2026)

Only ålderspensionsavgift applies.

| Component | Rate |
|-----------|------|
| Ålderspensionsavgift | 10.21% |
| **Total** | **10.21%** |

## Youth Rate — Born 2001 or later (under 26 during 2026)

Reduced rate applies until the month the employee turns 26.

| Component | Rate |
|-----------|------|
| Ålderspensionsavgift | 10.21% |
| **Total** | **10.21%** |

## Journal Entry Pattern (per payroll run)

```
Debit  7011  Löner till tjänstemän              [gross salary]
Credit 2710  Personalskatt                       [preliminary tax withheld]
Credit 2910  Upplupna löner                      [net salary payable]

Debit  7511  Lagstadgade sociala avgifter        [gross × 31.42%]
Credit 2730  Arbetsgivaravgifter                 [gross × 31.42%]
```

Payment to Skatteverket (AGI):
```
Debit  2710  Personalskatt                       [tax amount]
Debit  2730  Arbetsgivaravgifter                 [employer contribution]
Credit 1930  Företagskonto                       [total payment]
```

## AGI Declaration

Filed monthly via Skatteverket's e-service (Arbetsgivardeklaration).  
Deadline: 12th of the month following the pay period (26th for large employers).  
Includes: per-employee salary, tax withheld, employer contributions.
