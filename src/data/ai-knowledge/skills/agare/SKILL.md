# Skill: Agare & Bolagsratt

Ladda denna skill nar anvandaren fragar om aktiebok, utdelning, styrelseprotokoll, bolagsstamma, eller delagare.

## Arbetsfloden

### Utdelning (AB)
1. Kontrollera fritt eget kapital (balansrakning)
2. ABL-krav: utdelning far inte overskrida fritt eget kapital
3. Forsaktighetsprincipen: bolag maste ha tillracklig likviditet
4. `search_tools("utdelning")` for utdelningsverktyg
5. Skapa styrelseprotokoll + bokfor med `create_verification`
6. Debet 2091 (Balanserat resultat) / Kredit 2898 (Utdelning)

### Aktiebok
- ABL kraver numrerade aktier (1-1000 etc.)
- Aktiebok ska vara uppdaterad med agare, antal, aktienummer
- `search_tools("aktie")` for aktiebok-verktyg

### Styrelseprotokoll
1. `search_tools("protokoll")` for protokoll-verktyg
2. Krav: ordforande, narvarande, beslut, justerare
3. Numrera protokoll lopande (1/2026, 2/2026...)

### Arsstamma
- Ska hallas inom 6 manader efter rakenskapsarets slut
- Krav: fastställa BR/RR, disposition av vinst, ansvarsfrihet
- Protokoll med rorsakrav: deltagarlista, rostlangd

## Viktiga regler
- Kontrollbalansrakning: om EK < halva aktiekapitalet
- Styrelseansvar vid forsenad kontrollbalansrakning
- Utdelningsbeslut krav: stamma eller extra stamma
