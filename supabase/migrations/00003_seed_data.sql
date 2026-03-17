-- =============================================================================
-- Scope AI — Seed Data (Reference / Static)
-- =============================================================================
-- NOTE: No BEGIN/COMMIT — Supabase CLI handles transactions.

-- ---------------------------------------------------------------------------
-- 1. system_parameters — Swedish tax & legal parameters
-- NOTE: value column is JSONB, so string values are quoted as JSON strings
-- ---------------------------------------------------------------------------
INSERT INTO system_parameters (key, year, value, description) VALUES
  ('ibb', 2023, '"52500"', 'Inkomstbasbelopp för 2023'),
  ('ibb', 2024, '"57300"', 'Inkomstbasbelopp för 2024'),
  ('ibb', 2025, '"58500"', 'Prognostiserat Inkomstbasbelopp för 2025'),
  ('ibb', 2026, '"58500"', 'Inkomstbasbelopp för 2026 (prognostiserat)'),
  ('k10_schablon_rate', 2024, '"2.75"', 'Multiplikator för Förenklingsregeln (2.75 * IBB)'),
  ('k10_schablon_rate', 2025, '"2.75"', 'Multiplikator för Förenklingsregeln (2.75 * IBB)'),
  ('employer_contribution_rate', 2024, '"0.3142"', 'Arbetsgivaravgift 31.42%'),
  ('employer_contribution_rate', 2025, '"0.3142"', 'Arbetsgivaravgift 31.42%'),
  ('employer_contribution_rate', 2026, '"0.3142"', 'Arbetsgivaravgift 31.42%'),
  ('employer_contribution_rate_senior', 2024, '"0.1021"', 'Reducerad avgift 66+'),
  ('employer_contribution_rate_senior', 2025, '"0.1021"', 'Reducerad avgift 66+'),
  ('employer_contribution_rate_senior', 2026, '"0.1021"', 'Reducerad avgift 66+'),
  ('corporate_tax_rate', 2024, '"0.206"', 'Bolagsskatt 20.6%'),
  ('corporate_tax_rate', 2025, '"0.206"', 'Bolagsskatt 20.6%'),
  ('corporate_tax_rate', 2026, '"0.206"', 'Bolagsskatt 20.6%'),
  ('egenavgifter_full', 2024, '"0.2897"', 'Fulla egenavgifter 28.97%'),
  ('egenavgifter_full', 2025, '"0.2897"', 'Fulla egenavgifter 28.97%'),
  ('egenavgifter_reduced', 2024, '"0.1021"', 'Reducerade egenavgifter (66+)'),
  ('egenavgifter_reduced', 2025, '"0.1021"', 'Reducerade egenavgifter (66+)'),
  ('egenavgifter_karens_reduction', 2024, '"0.0076"', 'Karensavdrag reducering'),
  ('egenavgifter_karens_reduction', 2025, '"0.0076"', 'Karensavdrag reducering'),
  ('egenavgift_sjukforsakring', 2024, '"0.0388"', 'Sjukförsäkringsavgift'),
  ('egenavgift_sjukforsakring', 2025, '"0.0388"', 'Sjukförsäkringsavgift'),
  ('egenavgift_foraldraforsakring', 2024, '"0.0260"', 'Föräldraförsäkringsavgift'),
  ('egenavgift_foraldraforsakring', 2025, '"0.0260"', 'Föräldraförsäkringsavgift'),
  ('egenavgift_alderspension', 2024, '"0.1021"', 'Ålderspensionsavgift'),
  ('egenavgift_alderspension', 2025, '"0.1021"', 'Ålderspensionsavgift'),
  ('egenavgift_efterlevandepension', 2024, '"0.0070"', 'Efterlevandepensionsavgift'),
  ('egenavgift_efterlevandepension', 2025, '"0.0070"', 'Efterlevandepensionsavgift'),
  ('egenavgift_arbetsmarknadsavgift', 2024, '"0.0264"', 'Arbetsmarknadsavgift'),
  ('egenavgift_arbetsmarknadsavgift', 2025, '"0.0264"', 'Arbetsmarknadsavgift'),
  ('egenavgift_arbetsskadeavgift', 2024, '"0.0020"', 'Arbetsskadeavgift'),
  ('egenavgift_arbetsskadeavgift', 2025, '"0.0020"', 'Arbetsskadeavgift'),
  ('egenavgift_allman_loneavgift', 2024, '"0.1150"', 'Allmän löneavgift'),
  ('egenavgift_allman_loneavgift', 2025, '"0.1150"', 'Allmän löneavgift'),
  ('dividend_tax_kapital', 2024, '"0.20"', 'Kapitalskatt på utdelning 20%'),
  ('dividend_tax_kapital', 2025, '"0.20"', 'Kapitalskatt på utdelning 20%'),
  ('mileage_rate', 2024, '"2.50"', 'Milersättning kr/km skattefritt'),
  ('mileage_rate', 2025, '"2.50"', 'Milersättning kr/km skattefritt'),
  ('mileage_rate', 2026, '"2.50"', 'Milersättning kr/km skattefritt'),
  ('vacation_pay_rate', 2024, '"0.12"', 'Semesterersättning 12%'),
  ('vacation_pay_rate', 2025, '"0.12"', 'Semesterersättning 12%'),
  ('formansvarde_kost', 2024, '"260"', 'Förmånsvärde kost per dag'),
  ('formansvarde_kost', 2025, '"260"', 'Förmånsvärde kost per dag'),
  ('formansvarde_lunch', 2024, '"130"', 'Förmånsvärde lunch per dag'),
  ('formansvarde_lunch', 2025, '"130"', 'Förmånsvärde lunch per dag'),
  ('rantebaserat_rate', 2024, '"0.0976"', 'Räntebaserat utrymme K10'),
  ('rantebaserat_rate', 2025, '"0.0976"', 'Räntebaserat utrymme K10'),
  ('periodiseringsfond_max_ab', 2024, '"0.25"', 'Max periodiseringsfond AB (25%)'),
  ('periodiseringsfond_max_ab', 2025, '"0.25"', 'Max periodiseringsfond AB (25%)'),
  ('periodiseringsfond_max_ef', 2024, '"0.30"', 'Max periodiseringsfond EF (30%)'),
  ('periodiseringsfond_max_ef', 2025, '"0.30"', 'Max periodiseringsfond EF (30%)'),
  ('marginal_tax_rate_approx', 2024, '"0.32"', 'Genomsnittlig marginalskatt'),
  ('marginal_tax_rate_approx', 2025, '"0.32"', 'Genomsnittlig marginalskatt'),
  ('top_marginal_tax_rate', 2024, '"0.52"', 'Högsta marginalskatt inkl statlig'),
  ('top_marginal_tax_rate', 2025, '"0.52"', 'Högsta marginalskatt inkl statlig'),
  ('drivmedel_formansvarde_multiplier', 2024, '"1.2"', 'Drivmedelsförmån 120%'),
  ('drivmedel_formansvarde_multiplier', 2025, '"1.2"', 'Drivmedelsförmån 120%'),
  ('benefit_limit_friskvard', 2025, '"5000"', 'Friskvårdsbidrag max'),
  ('benefit_limit_friskvard', 2026, '"5000"', 'Friskvårdsbidrag max'),
  ('benefit_limit_julgava', 2025, '"550"', 'Julgåva max'),
  ('benefit_limit_julgava', 2026, '"550"', 'Julgåva max'),
  ('benefit_limit_jubileumsgava', 2025, '"1650"', 'Jubileumsgåva max'),
  ('benefit_limit_jubileumsgava', 2026, '"1650"', 'Jubileumsgåva max'),
  ('benefit_limit_minnesgava', 2025, '"15000"', 'Minnesgåva max'),
  ('benefit_limit_minnesgava', 2026, '"15000"', 'Minnesgåva max'),
  ('benefit_limit_cykel_skattefri', 2025, '"3000"', 'Cykelförmån skattefri max'),
  ('benefit_limit_cykel_skattefri', 2026, '"3000"', 'Cykelförmån skattefri max')
ON CONFLICT (key, year) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. formaner_catalog — Swedish employee benefit types
-- ---------------------------------------------------------------------------
INSERT INTO formaner_catalog (id, name, category, max_amount, tax_free, description, bas_account, rules) VALUES
  ('friskvard', 'Friskvårdsbidrag', 'tax_free', 5000, true, 'Bidrag till motion och friskvård', '7699', '{"AB": true, "EF": true}'),
  ('personalvard', 'Personalvårdsförmåner', 'tax_free', NULL, true, 'Kaffe, frukt, personalfester av mindre värde', '7690', '{"AB": true, "EF": true}'),
  ('arbetsklader', 'Arbetskläder', 'tax_free', NULL, true, 'Kläder som krävs för arbetet', '7380', '{"AB": true, "EF": true}'),
  ('foretagshalsovard', 'Företagshälsovård', 'tax_free', NULL, true, 'Hälsoundersökningar, förebyggande vård', '7691', '{}'),
  ('utbildning', 'Utbildning', 'tax_free', NULL, true, 'Arbetsrelaterad utbildning och kurser', '7620', '{}'),
  ('reseforsakring', 'Reseförsäkring', 'tax_free', NULL, true, 'Försäkring för tjänsteresor', '7570', '{}'),
  ('julgava', 'Julgåva', 'tax_free', 550, true, 'Jul- eller nyårsgåva till anställda', '7699', '{}'),
  ('jubileumsgava', 'Jubileumsgåva', 'tax_free', 1650, true, 'Gåva vid företagets jubileum', '7699', '{}'),
  ('minnesgava', 'Minnesgåva', 'tax_free', 15000, true, 'Gåva vid 25 år, pension, etc.', '7699', '{}'),
  ('cykel_skattefri', 'Cykelförmån (skattefri)', 'tax_free', 3000, true, 'Skattefri cykelförmån upp till 3000 kr/år', '7399', '{}'),
  ('telefon', 'Telefonförmån', 'tax_free', NULL, true, 'Fri telefon är numera skattefri', '6211', '{}'),
  ('tjanstebil', 'Tjänstebil', 'taxable', NULL, false, 'Bil som tillhandahålls av arbetsgivaren', '7385', '{}'),
  ('drivmedel', 'Drivmedelsförmån', 'taxable', NULL, false, 'Arbetsgivaren betalar privat drivmedel', '7385', '{}'),
  ('bostad', 'Bostadsförmån', 'taxable', NULL, false, 'Bostad som tillhandahålls av arbetsgivaren', '7399', '{}'),
  ('kost', 'Kostförmån (fri kost)', 'taxable', NULL, false, 'Fria måltider från arbetsgivaren', '7399', '{}'),
  ('lunch', 'Lunchförmån', 'taxable', NULL, false, 'Subventionerad lunch', '7399', '{}'),
  ('parkering', 'Parkeringsförmån', 'taxable', NULL, false, 'Fri parkering vid arbetsplatsen', '7399', '{}'),
  ('tjanstepension', 'Tjänstepension', 'salary_sacrifice', NULL, false, 'Extra pensionsavsättning via bruttolöneavdrag', '7411', '{}'),
  ('sjukvardsforsakring', 'Sjukvårdsförsäkring', 'salary_sacrifice', NULL, false, 'Privat sjukvårdsförsäkring', '7570', '{}'),
  ('cykel', 'Cykelförmån', 'salary_sacrifice', NULL, false, 'Cykel via bruttolöneavdrag', '7399', '{}')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. skv_tax_tables — Swedish tax deduction tables (2025)
-- ---------------------------------------------------------------------------

-- Table 30 (Stockholm-area ~32% kommunalskatt)
INSERT INTO skv_tax_tables (year, table_number, column_number, income_from, income_to, tax_deduction) VALUES
  (2025, 30, 1, 0, 2200, 0),
  (2025, 30, 1, 2201, 4100, 0),
  (2025, 30, 1, 4101, 7200, 0),
  (2025, 30, 1, 7201, 8500, 600),
  (2025, 30, 1, 8501, 10000, 900),
  (2025, 30, 1, 10001, 12000, 1250),
  (2025, 30, 1, 12001, 14000, 1700),
  (2025, 30, 1, 14001, 16000, 2150),
  (2025, 30, 1, 16001, 18000, 2650),
  (2025, 30, 1, 18001, 20000, 3100),
  (2025, 30, 1, 20001, 22000, 3600),
  (2025, 30, 1, 22001, 24000, 4100),
  (2025, 30, 1, 24001, 26000, 4600),
  (2025, 30, 1, 26001, 28000, 5100),
  (2025, 30, 1, 28001, 30000, 5600),
  (2025, 30, 1, 30001, 32000, 6200),
  (2025, 30, 1, 32001, 34000, 6800),
  (2025, 30, 1, 34001, 36000, 7400),
  (2025, 30, 1, 36001, 38000, 8000),
  (2025, 30, 1, 38001, 40000, 8700),
  (2025, 30, 1, 40001, 45000, 9800),
  (2025, 30, 1, 45001, 50000, 11800),
  (2025, 30, 1, 50001, 55000, 13800),
  (2025, 30, 1, 55001, 60000, 16100),
  (2025, 30, 1, 60001, 65000, 18400),
  (2025, 30, 1, 65001, 70000, 20600),
  (2025, 30, 1, 70001, 80000, 24000),
  (2025, 30, 1, 80001, 90000, 29000),
  (2025, 30, 1, 90001, 100000, 34000),
  (2025, 30, 1, 100001, 999999, 40000)
ON CONFLICT (year, table_number, column_number, income_from) DO NOTHING;

-- Table 31 (~33% municipal)
INSERT INTO skv_tax_tables (year, table_number, column_number, income_from, income_to, tax_deduction) VALUES
  (2025, 31, 1, 0, 2200, 0),
  (2025, 31, 1, 2201, 4100, 0),
  (2025, 31, 1, 4101, 7200, 0),
  (2025, 31, 1, 7201, 8500, 550),
  (2025, 31, 1, 8501, 10000, 850),
  (2025, 31, 1, 10001, 12000, 1200),
  (2025, 31, 1, 12001, 14000, 1650),
  (2025, 31, 1, 14001, 16000, 2050),
  (2025, 31, 1, 16001, 18000, 2500),
  (2025, 31, 1, 18001, 20000, 2950),
  (2025, 31, 1, 20001, 22000, 3400),
  (2025, 31, 1, 22001, 24000, 3900),
  (2025, 31, 1, 24001, 26000, 4400),
  (2025, 31, 1, 26001, 28000, 4900),
  (2025, 31, 1, 28001, 30000, 5400),
  (2025, 31, 1, 30001, 32000, 5900),
  (2025, 31, 1, 32001, 34000, 6500),
  (2025, 31, 1, 34001, 36000, 7100),
  (2025, 31, 1, 36001, 38000, 7700),
  (2025, 31, 1, 38001, 40000, 8400),
  (2025, 31, 1, 40001, 45000, 9500),
  (2025, 31, 1, 45001, 50000, 11400),
  (2025, 31, 1, 50001, 55000, 13400),
  (2025, 31, 1, 55001, 60000, 15600),
  (2025, 31, 1, 60001, 65000, 17800),
  (2025, 31, 1, 65001, 70000, 20000),
  (2025, 31, 1, 70001, 80000, 23400),
  (2025, 31, 1, 80001, 90000, 28300),
  (2025, 31, 1, 90001, 100000, 33200),
  (2025, 31, 1, 100001, 999999, 39000)
ON CONFLICT (year, table_number, column_number, income_from) DO NOTHING;

-- Table 33 (~33-34%)
INSERT INTO skv_tax_tables (year, table_number, column_number, income_from, income_to, tax_deduction) VALUES
  (2025, 33, 1, 0, 2200, 0),
  (2025, 33, 1, 2201, 4100, 0),
  (2025, 33, 1, 4101, 7200, 0),
  (2025, 33, 1, 7201, 8500, 500),
  (2025, 33, 1, 8501, 10000, 800),
  (2025, 33, 1, 10001, 12000, 1150),
  (2025, 33, 1, 12001, 14000, 1600),
  (2025, 33, 1, 14001, 16000, 2000),
  (2025, 33, 1, 16001, 18000, 2400),
  (2025, 33, 1, 18001, 20000, 2850),
  (2025, 33, 1, 20001, 22000, 3300),
  (2025, 33, 1, 22001, 24000, 3750),
  (2025, 33, 1, 24001, 26000, 4250),
  (2025, 33, 1, 26001, 28000, 4700),
  (2025, 33, 1, 28001, 30000, 5200),
  (2025, 33, 1, 30001, 32000, 5700),
  (2025, 33, 1, 32001, 34000, 6300),
  (2025, 33, 1, 34001, 36000, 6900),
  (2025, 33, 1, 36001, 38000, 7500),
  (2025, 33, 1, 38001, 40000, 8100),
  (2025, 33, 1, 40001, 45000, 9200),
  (2025, 33, 1, 45001, 50000, 11000),
  (2025, 33, 1, 50001, 55000, 13000),
  (2025, 33, 1, 55001, 60000, 15200),
  (2025, 33, 1, 60001, 65000, 17400),
  (2025, 33, 1, 65001, 70000, 19600),
  (2025, 33, 1, 70001, 80000, 22800),
  (2025, 33, 1, 80001, 90000, 27600),
  (2025, 33, 1, 90001, 100000, 32400),
  (2025, 33, 1, 100001, 999999, 38000)
ON CONFLICT (year, table_number, column_number, income_from) DO NOTHING;

-- Table 34 (~34%)
INSERT INTO skv_tax_tables (year, table_number, column_number, income_from, income_to, tax_deduction) VALUES
  (2025, 34, 1, 0, 2200, 0),
  (2025, 34, 1, 2201, 4100, 0),
  (2025, 34, 1, 4101, 7200, 0),
  (2025, 34, 1, 7201, 8500, 450),
  (2025, 34, 1, 8501, 10000, 750),
  (2025, 34, 1, 10001, 12000, 1100),
  (2025, 34, 1, 12001, 14000, 1550),
  (2025, 34, 1, 14001, 16000, 1950),
  (2025, 34, 1, 16001, 18000, 2350),
  (2025, 34, 1, 18001, 20000, 2750),
  (2025, 34, 1, 20001, 22000, 3200),
  (2025, 34, 1, 22001, 24000, 3650),
  (2025, 34, 1, 24001, 26000, 4100),
  (2025, 34, 1, 26001, 28000, 4550),
  (2025, 34, 1, 28001, 30000, 5000),
  (2025, 34, 1, 30001, 32000, 5500),
  (2025, 34, 1, 32001, 34000, 6100),
  (2025, 34, 1, 34001, 36000, 6700),
  (2025, 34, 1, 36001, 38000, 7300),
  (2025, 34, 1, 38001, 40000, 7900),
  (2025, 34, 1, 40001, 45000, 8900),
  (2025, 34, 1, 45001, 50000, 10700),
  (2025, 34, 1, 50001, 55000, 12700),
  (2025, 34, 1, 55001, 60000, 14800),
  (2025, 34, 1, 60001, 65000, 17000),
  (2025, 34, 1, 65001, 70000, 19200),
  (2025, 34, 1, 70001, 80000, 22200),
  (2025, 34, 1, 80001, 90000, 27000),
  (2025, 34, 1, 90001, 100000, 31700),
  (2025, 34, 1, 100001, 999999, 37000)
ON CONFLICT (year, table_number, column_number, income_from) DO NOTHING;

-- Table 36 (~35-36%)
INSERT INTO skv_tax_tables (year, table_number, column_number, income_from, income_to, tax_deduction) VALUES
  (2025, 36, 1, 0, 2200, 0),
  (2025, 36, 1, 2201, 4100, 0),
  (2025, 36, 1, 4101, 7200, 0),
  (2025, 36, 1, 7201, 8500, 400),
  (2025, 36, 1, 8501, 10000, 700),
  (2025, 36, 1, 10001, 12000, 1050),
  (2025, 36, 1, 12001, 14000, 1450),
  (2025, 36, 1, 14001, 16000, 1850),
  (2025, 36, 1, 16001, 18000, 2250),
  (2025, 36, 1, 18001, 20000, 2650),
  (2025, 36, 1, 20001, 22000, 3050),
  (2025, 36, 1, 22001, 24000, 3500),
  (2025, 36, 1, 24001, 26000, 3950),
  (2025, 36, 1, 26001, 28000, 4400),
  (2025, 36, 1, 28001, 30000, 4850),
  (2025, 36, 1, 30001, 32000, 5300),
  (2025, 36, 1, 32001, 34000, 5900),
  (2025, 36, 1, 34001, 36000, 6400),
  (2025, 36, 1, 36001, 38000, 7000),
  (2025, 36, 1, 38001, 40000, 7600),
  (2025, 36, 1, 40001, 45000, 8600),
  (2025, 36, 1, 45001, 50000, 10300),
  (2025, 36, 1, 50001, 55000, 12200),
  (2025, 36, 1, 55001, 60000, 14300),
  (2025, 36, 1, 60001, 65000, 16400),
  (2025, 36, 1, 65001, 70000, 18500),
  (2025, 36, 1, 70001, 80000, 21400),
  (2025, 36, 1, 80001, 90000, 26000),
  (2025, 36, 1, 90001, 100000, 30600),
  (2025, 36, 1, 100001, 999999, 36000)
ON CONFLICT (year, table_number, column_number, income_from) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. Storage buckets
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('receipts', 'receipts', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. Storage RLS policies
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can upload receipts" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'receipts' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

CREATE POLICY "Users can view own receipts" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

CREATE POLICY "Users can delete own receipts" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload avatars" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
