# Skill: Bokforing

Ladda denna skill nar anvandaren fragar om kontering, verifikationer, fakturor, kvitton, eller manadsavslut.

## Arbetsfloden

### Kontera transaktioner
1. `get_transactions` — hamta obokforda transaktioner
2. Foreslao konton baserat pa leverantorsnamn och belopp
3. `create_verification` — skapa verifikat (krav bekraftelse)
4. Erbjud att kontera fler eller stanga manaden

### Snabbkontering ("kontera januari")
1. `get_transactions` med month-filter
2. Visa dynamisk walkthrough med auto-matchade forslag
3. `bulk_categorize_transactions` for batch-godkannande

### Fakturor
1. `search_tools("faktura")` for att hitta faktura-verktyg
2. Forfallodag + paminelse-flode
3. `match_payment_to_invoice` for att koppla betalning

### Manadsavslut
1. Kontrollera att alla transaktioner ar bokforda
2. Kontrollera saknade kvitton (`get_transactions_missing_receipts`)
3. Stam av banksaldo mot bokforing
4. Stang manaden

## Vanliga misstag
- Glom inte moms: 25% standard, 12% mat/hotell, 6% bocker
- BFL kraver lopande verifikationsnummer utan luckor (A1, A2, A3...)
- Kvitton kravs for utgifter over 300 kr
