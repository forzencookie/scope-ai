-- Seed all tax rates into system_parameters
-- Eliminates 15+ hardcoded rates across the codebase

-- Arbetsgivaravgift (Employer contributions)
INSERT INTO system_parameters (key, year, value, description) VALUES
('employer_contribution_rate', 2024, '0.3142', 'Arbetsgivaravgift 31.42%'),
('employer_contribution_rate', 2025, '0.3142', 'Arbetsgivaravgift 31.42%'),
('employer_contribution_rate', 2026, '0.3142', 'Arbetsgivaravgift 31.42%'),

('employer_contribution_rate_senior', 2024, '0.1021', 'Reducerad avgift 66+ (ålderspensionsavgift)'),
('employer_contribution_rate_senior', 2025, '0.1021', 'Reducerad avgift 66+ (ålderspensionsavgift)'),
('employer_contribution_rate_senior', 2026, '0.1021', 'Reducerad avgift 66+ (ålderspensionsavgift)'),

-- Bolagsskatt (Corporate tax)
('corporate_tax_rate', 2024, '0.206', 'Bolagsskatt 20.6%'),
('corporate_tax_rate', 2025, '0.206', 'Bolagsskatt 20.6%'),
('corporate_tax_rate', 2026, '0.206', 'Bolagsskatt 20.6%'),

-- Egenavgifter (Self-employment contributions)
('egenavgifter_full', 2024, '0.2897', 'Fulla egenavgifter 28.97%'),
('egenavgifter_full', 2025, '0.2897', 'Fulla egenavgifter 28.97%'),

('egenavgifter_reduced', 2024, '0.1021', 'Reducerade egenavgifter (66+)'),
('egenavgifter_reduced', 2025, '0.1021', 'Reducerade egenavgifter (66+)'),

('egenavgifter_karens_reduction', 2024, '0.0076', 'Karensavdrag reducering'),
('egenavgifter_karens_reduction', 2025, '0.0076', 'Karensavdrag reducering'),

-- Individual egenavgift components
('egenavgift_sjukforsakring', 2024, '0.0388', 'Sjukförsäkringsavgift'),
('egenavgift_sjukforsakring', 2025, '0.0388', 'Sjukförsäkringsavgift'),

('egenavgift_foraldraforsakring', 2024, '0.0260', 'Föräldraförsäkringsavgift'),
('egenavgift_foraldraforsakring', 2025, '0.0260', 'Föräldraförsäkringsavgift'),

('egenavgift_alderspension', 2024, '0.1021', 'Ålderspensionsavgift'),
('egenavgift_alderspension', 2025, '0.1021', 'Ålderspensionsavgift'),

('egenavgift_efterlevandepension', 2024, '0.0070', 'Efterlevandepensionsavgift'),
('egenavgift_efterlevandepension', 2025, '0.0070', 'Efterlevandepensionsavgift'),

('egenavgift_arbetsmarknadsavgift', 2024, '0.0264', 'Arbetsmarknadsavgift'),
('egenavgift_arbetsmarknadsavgift', 2025, '0.0264', 'Arbetsmarknadsavgift'),

('egenavgift_arbetsskadeavgift', 2024, '0.0020', 'Arbetsskadeavgift'),
('egenavgift_arbetsskadeavgift', 2025, '0.0020', 'Arbetsskadeavgift'),

('egenavgift_allman_loneavgift', 2024, '0.1150', 'Allmän löneavgift'),
('egenavgift_allman_loneavgift', 2025, '0.1150', 'Allmän löneavgift'),

-- Utdelning/Kapitalskatt
('dividend_tax_kapital', 2024, '0.20', 'Kapitalskatt på utdelning 20%'),
('dividend_tax_kapital', 2025, '0.20', 'Kapitalskatt på utdelning 20%'),

-- Milersättning
('mileage_rate', 2024, '2.50', 'Milersättning kr/km skattefritt'),
('mileage_rate', 2025, '2.50', 'Milersättning kr/km skattefritt'),
('mileage_rate', 2026, '2.50', 'Milersättning kr/km skattefritt'),

-- Semesterersättning
('vacation_pay_rate', 2024, '0.12', 'Semesterersättning 12%'),
('vacation_pay_rate', 2025, '0.12', 'Semesterersättning 12%'),

-- Förmånsvärden
('formansvarde_kost', 2024, '260', 'Förmånsvärde kost per dag'),
('formansvarde_kost', 2025, '260', 'Förmånsvärde kost per dag'),

('formansvarde_lunch', 2024, '130', 'Förmånsvärde lunch per dag'),
('formansvarde_lunch', 2025, '130', 'Förmånsvärde lunch per dag')

ON CONFLICT (key, year) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;
