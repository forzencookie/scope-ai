# Egenavgifter (Self-Employment Social Contributions)

**Source:** Socialavgiftslagen (SAL) 3 kap, Inkomstskattelagen (IL) 16 kap 29§, Skatteverket  
**Verified:** 2026 rates

Applies to: Enskild firma (EF), active partners in HB/KB.  
Does NOT apply to: AB owners paying themselves salary (they pay arbetsgivaravgift instead).

## Calculation Formula

```
Base    = Profit (överskott) × 0.75
          (25% schablonavdrag per IL 16 kap 29§ — fixed deduction before applying rates)

Avgifter = Base × rate
```

The 25% schablonavdrag represents the approximate cost of the contributions themselves, avoiding circular calculation.

## Full Rates — Born 1960–2000 (age 26–65 during 2026)

| Component | Rate | Account |
|-----------|------|---------|
| Sjukförsäkringsavgift | 3.55% | 7570 |
| Föräldraförsäkringsavgift | 2.60% | 7570 |
| Ålderspensionsavgift | 10.21% | 7570 |
| Efterlevandepensionsavgift | 0.70% | 7570 |
| Arbetsmarknadsavgift | 2.66% | 7570 |
| Arbetsskadeavgift | 0.20% | 7570 |
| Allmän löneavgift | 11.53% | 7570 |
| **Total on base** | **31.45%** | |
| **Effective rate on gross profit** | **~28.97%** (31.45% × 0.75) | |

## Reduced Rate — Born 1959 or earlier (67+ during 2026)

Only ålderspensionsavgift, applied to full profit (no schablonavdrag needed at this level).

| Component | Rate |
|-----------|------|
| Ålderspensionsavgift | 10.21% |

## Youth Rate — Born 2001 or later (under 26 during 2026)

| Component | Rate |
|-----------|------|
| Ålderspensionsavgift | 10.21% |

## Journal Entry Pattern

Egenavgifter are booked as a cost in the EF:

```
Debit  7570  Egenavgifter          [calculated amount]
Credit 2510  Skatteskulder         [liability until paid]
```

## Tax Return

Declared on NE-bilagan (Skatteverket).  
Preliminary egenavgifter paid monthly as part of F-skatt or SA-skatt.  
Final settlement in annual income tax return.

## Key Difference vs Arbetsgivaravgifter

| | Arbetsgivaravgifter | Egenavgifter |
|---|---|---|
| Who pays | Employer (AB/EF with employees) | Self-employed person (EF) |
| Base | Gross salary paid | 75% of profit |
| Rate | 31.42% | ~28.97% effective |
| Allmän löneavgift | 11.62% | 11.53% |
