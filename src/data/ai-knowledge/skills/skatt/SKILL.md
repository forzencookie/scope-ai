# Skill: Skatt

Ladda denna skill nar anvandaren fragar om moms, inkomstdeklaration, K10, egenavgifter, eller periodiseringsfonder.

## Arbetsfloden

### Momsdeklaration
1. `search_tools("moms")` for att hitta moms-verktyg
2. Berakna utgaende moms (forsaljning) och ingaende moms (inkop)
3. Nettomoms = utgaende - ingaende
4. Visa sammanstallning med momsatser (25/12/6/0%)
5. Deadline: 26:e varje manad/kvartal

### K10 / 3:12-regler (FAMAN-bolag)
1. `search_tools("k10")` for K10-verktyg
2. Berakna grannbelopp: lonebaserat eller forenklat
3. Forenklat: 2,75 IBB (ca 204 325 kr for 2026)
4. Lonebaserat: 50% av loner i bolaget
5. Kapitalinkomst beskattas med 20%, overskjutande = tjanst

### Periodiseringsfonder
- Max 25% av vinst (AB), 30% (EF)
- Aterfor senast ar 6
- Anvand for att jamna ut resultat over ar

### Egenavgifter (EF/HB/KB)
- Egenavgifter: ~28,97% pa vinst
- Skattefri schablon: 25% av avgiftsunderlaget
- Preliminarskatt baseras pa forvantad vinst

## Viktiga datum
- 12:e varje manad: AGI + skattebetalning
- 26:e (kvartal/ar): Momsdeklaration
- 2 maj: Inkomstdeklaration (privatperson/EF)
- 1 juli: Inkomstdeklaration (foretag)
