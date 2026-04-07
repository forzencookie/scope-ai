# Inkomstdeklaration 2 (INK2)

Test page: `/test-ui/walkthroughs/inkomstdeklaration/`

## What it shows

Scooby presents the corporate tax declaration with full provenance — every tax adjustment traces back to the specific verifikationer (journal entries) in the bookkeeping that produced it. The user sees which transactions are non-deductible, which income is non-taxable, and how periodiseringsfonder affect the taxable result.

## UI Components

- **ScoobyPresentation** — header with message + 3 highlights (bokfört resultat, skattepliktigt resultat, bolagsskatt)
- **WalkthroughRenderer** (block-based) with:
  - Bokfört resultat (fält 3.1): annotation (source: resultaträkning), key-value (intäkter, kostnader, resultat)
  - Per-adjustment sections: heading (label + fält code + explanation), annotation (source: N verifikationer), financial-table (ver.nr, datum, beskrivning, konto, belopp + totals)
  - Periodiseringsfonder: annotation (source: konto 2150), key-value (ingående, avsättning, återföring, nettopåverkan), info-card (schablonintäkt calculation)
  - Skatteberäkning: key-value (full chain from bokfört resultat through all adjustments to final skatt)
  - Status-check: resultaträkning stämd, ej avdragsgilla kontrollerade, periodiseringsfonder inom gräns, klart för SRU
  - Action-bar: Exportera SRU-fil, Visa fullständig INK2, Stäng

## Expected behavior

When user asks "Gör min inkomstdeklaration" or "Hur mycket bolagsskatt?":

1. Scooby fetches the resultaträkning for the fiscal year
2. Tool scans verifikationer for non-deductible expenses (representation, böter, gåvor, etc.)
3. Tool scans for non-taxable income (näringsbetingade andelar, etc.)
4. Tool reads periodiseringsfondregister
5. Returns WalkthroughResponse with every adjustment traced to source verifikationer

## Data connections — what's dynamic

| Data | Source | Static in test? |
|------|--------|----------------|
| Revenue, costs, bokfört resultat | `verifications` aggregated into resultaträkning | Yes |
| Ej avdragsgilla kostnader | `verifications` on specific accounts (6072, 6990, 6991, 6993) | Yes |
| Ej skattepliktiga intäkter | `verifications` on accounts (8012, etc.) | Yes |
| Verifikation details (ver.nr, date, desc, account, amount) | `verifications` table | Yes |
| Periodiseringsfonder (opening, allocation, reversal) | `verifications` on konto 2150 + fond register | Yes |
| Statslåneränta (for schablonintäkt) | Riksbanken — yearly rate | Yes |
| Bolagsskattesats (20.6%) | Tax law — can change | Yes |
| Max periodiseringsfond (25% of surplus) | Tax law — IL 30 kap | Yes |
| Fiscal year period | `companies.fiscal_year_start/end` | Yes |

## What must NEVER be static in production

- **All verifikation data** — from actual bookkeeping entries
- **Resultaträkning figures** — computed from verifikationer
- **Adjustment amounts** — scanned from specific account ranges
- **Periodiseringsfonder** — from fund register / konto 2150
- **Bolagsskattesats** — from rate data source (changes with law)
- **SLR** — from Riksbanken rate data source

## What CAN be static

- Field codes ("fält 3.1", "fält 4.3", "fält 4.5")
- Legal references ("IL 30 kap")
- Section headings and explanatory text
- Rules ("max 25% av överskott, återförs inom 6 år")

## Other declaration variants (not yet built)

The current walkthrough covers INK2 (aktiebolag). Other company types need different forms:

| Form | For who | Priority | Notes |
|------|---------|----------|-------|
| **INK2** | Aktiebolag (AB) | Done | This walkthrough |
| **INK1 + NE-bilaga** | Enskild firma | High | App already supports EF (egenavgifter walkthrough exists). Same block patterns, different fields. |
| **INK3** | Handelsbolag (HB) | Low | Build when HB support matures |
| **INK4** | Ideella föreningar | Low | Build when förening support matures |

The UI pattern is identical across variants — only the fields and source data differ. No new block types needed.
