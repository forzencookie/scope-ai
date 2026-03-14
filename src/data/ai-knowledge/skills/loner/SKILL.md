# Skill: Loner

Ladda denna skill nar anvandaren fragar om lonekoning, skatteavdrag, arbetsgivaravgifter, semester, eller personalhantering.

## Arbetsfloden

### Kor loner for en manad
1. `search_tools("lon")` for att hitta lone-verktyg
2. Hamta anstallda och loneuppgifter
3. Berakna skatteavdrag (kommunalskatt fran skattetabell, inte platt 24%)
4. Berakna arbetsgivaravgifter (31,42%)
5. Skapa loneverifikat med `create_verification`
6. Paminn om AGI-deadline (12:e nasta manad)

### Semesterhantering
- Semesterlon: 12% av bruttolonen (Semesterlagen)
- Sparade semesterdagar = skuld i balansrakningen (konto 2920)
- Berakna semestertillagg vid uttag

### Lone till agare (AB)
1. Kontrollera optimalt uttag (lon vs utdelning)
2. Berakna med 3:12-regler om det ar FAMAN
3. `search_tools("k10")` for K10-berakning

## Viktiga regler
- Skatteavdrag: kommunbaserat, anvand ratt skattetabell
- Arbetsgivaravgifter: 31,42% (reducerat for unga/aldre)
- AGI-deklaration: ska in den 12:e varje manad
- Formanar (t.ex. bil, kost) ar skattepliktiga
