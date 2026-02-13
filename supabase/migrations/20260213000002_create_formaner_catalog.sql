-- Create backend-driven benefits catalog table
-- Replaces the static array in reference-data.ts

CREATE TABLE IF NOT EXISTS formaner_catalog (
    id text PRIMARY KEY,
    name text NOT NULL,
    category text NOT NULL CHECK (category IN ('tax_free', 'taxable', 'salary_sacrifice')),
    max_amount numeric,
    tax_free boolean NOT NULL DEFAULT false,
    formansvarde_calculation text,
    description text,
    rules jsonb DEFAULT '{}'::jsonb,
    bas_account text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE formaner_catalog ENABLE ROW LEVEL SECURITY;

-- Benefits catalog is read-only for authenticated users (shared reference data)
CREATE POLICY "Authenticated users can read benefits catalog"
    ON formaner_catalog FOR SELECT
    TO authenticated
    USING (true);

-- Only service role can modify
CREATE POLICY "Service role can modify benefits catalog"
    ON formaner_catalog FOR ALL
    TO service_role
    USING (true);

-- Seed the catalog with all Swedish benefits
INSERT INTO formaner_catalog (id, name, category, max_amount, tax_free, formansvarde_calculation, description, rules, bas_account) VALUES
-- Tax-Free Benefits
('friskvard', 'Friskvårdsbidrag', 'tax_free', 5000, true, NULL, 'Bidrag till motion och friskvård', '{"AB": true, "EF": true, "EnskildFirma": false}', '7699'),
('personalvard', 'Personalvårdsförmåner', 'tax_free', NULL, true, NULL, 'Kaffe, frukt, personalfester av mindre värde', '{"AB": true, "EF": true}', '7690'),
('arbetsklader', 'Arbetskläder', 'tax_free', NULL, true, NULL, 'Kläder som krävs för arbetet', '{"AB": true, "EF": true}', '7380'),
('foretagshalsovard', 'Företagshälsovård', 'tax_free', NULL, true, NULL, 'Hälsoundersökningar, förebyggande vård', '{}', '7691'),
('utbildning', 'Utbildning', 'tax_free', NULL, true, NULL, 'Arbetsrelaterad utbildning och kurser', '{}', '7620'),
('reseforsakring', 'Reseförsäkring', 'tax_free', NULL, true, NULL, 'Försäkring för tjänsteresor', '{}', '7570'),
('julgava', 'Julgåva', 'tax_free', 550, true, NULL, 'Jul- eller nyårsgåva till anställda', '{}', '7699'),
('jubileumsgava', 'Jubileumsgåva', 'tax_free', 1650, true, NULL, 'Gåva vid företagets jubileum', '{}', '7699'),
('minnesgava', 'Minnesgåva', 'tax_free', 15000, true, NULL, 'Gåva vid 25 år, pension, etc.', '{}', '7699'),
('cykel_skattefri', 'Cykelförmån (skattefri)', 'tax_free', 3000, true, NULL, 'Skattefri cykelförmån upp till 3000 kr/år', '{}', '7399'),
('telefon', 'Telefonförmån', 'tax_free', NULL, true, NULL, 'Fri telefon är numera skattefri', '{}', '6211'),

-- Taxable Benefits
('tjanstebil', 'Tjänstebil', 'taxable', NULL, false, 'Baserat på nybilspris och biltyp (Skatteverkets tabell)', 'Bil som tillhandahålls av arbetsgivaren', '{}', '7385'),
('drivmedel', 'Drivmedelsförmån', 'taxable', NULL, false, '1.2 x marknadspris för drivmedel', 'Arbetsgivaren betalar privat drivmedel', '{}', '7385'),
('bostad', 'Bostadsförmån', 'taxable', NULL, false, 'Marknadshyra för motsvarande bostad', 'Bostad som tillhandahålls av arbetsgivaren', '{}', '7399'),
('kost', 'Kostförmån (fri kost)', 'taxable', NULL, false, '260 kr/dag (2024)', 'Fria måltider från arbetsgivaren', '{}', '7399'),
('lunch', 'Lunchförmån', 'taxable', NULL, false, '130 kr/dag (2024)', 'Subventionerad lunch', '{}', '7399'),
('parkering', 'Parkeringsförmån', 'taxable', NULL, false, 'Marknadsvärde för parkering', 'Fri parkering vid arbetsplatsen', '{}', '7399'),

-- Salary Sacrifice
('tjanstepension', 'Tjänstepension', 'salary_sacrifice', NULL, false, 'Ingen förmånsbeskattning, men lägre bruttolön', 'Extra pensionsavsättning via bruttolöneavdrag', '{}', '7411'),
('sjukvardsforsakring', 'Sjukvårdsförsäkring', 'salary_sacrifice', NULL, false, 'Premien förmånsbeskattas', 'Privat sjukvårdsförsäkring', '{}', '7570'),
('cykel', 'Cykelförmån', 'salary_sacrifice', NULL, false, 'Reducerat förmånsvärde vid bruttolöneavdrag', 'Cykel via bruttolöneavdrag', '{}', '7399')

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    max_amount = EXCLUDED.max_amount,
    tax_free = EXCLUDED.tax_free,
    formansvarde_calculation = EXCLUDED.formansvarde_calculation,
    description = EXCLUDED.description,
    rules = EXCLUDED.rules,
    bas_account = EXCLUDED.bas_account;
