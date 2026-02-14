-- Add missing tax parameters that were previously hardcoded in the codebase
-- These rates are legally significant and must be updatable per year

INSERT INTO system_parameters (key, year, value, description) VALUES

-- Räntebaserat utrymme (K10 interest-based allocation)
-- Rate set by SKV annually based on government bond rate + 9 percentage points
('rantebaserat_rate', 2024, '0.0976', 'Räntebaserat utrymme K10 (statslåneränta + 9 pp)'),
('rantebaserat_rate', 2025, '0.0976', 'Räntebaserat utrymme K10 (statslåneränta + 9 pp)'),

-- Periodiseringsfond max allocation (IL 30 kap)
-- AB: max 25% of taxable income
-- EF/Enskild: max 30% of adjusted taxable income
('periodiseringsfond_max_ab', 2024, '0.25', 'Max periodiseringsfond AB (25% av beskattningsbar inkomst)'),
('periodiseringsfond_max_ab', 2025, '0.25', 'Max periodiseringsfond AB (25% av beskattningsbar inkomst)'),
('periodiseringsfond_max_ef', 2024, '0.30', 'Max periodiseringsfond EF (30% av justerad inkomst)'),
('periodiseringsfond_max_ef', 2025, '0.30', 'Max periodiseringsfond EF (30% av justerad inkomst)'),

-- Approximate marginal tax rate for individual income
-- Used as fallback when municipality-specific rate is unavailable
-- Average Swedish municipal tax ~32% (kommunal + landsting)
('marginal_tax_rate_approx', 2024, '0.32', 'Genomsnittlig marginalskatt kommunal+landsting (approximation)'),
('marginal_tax_rate_approx', 2025, '0.32', 'Genomsnittlig marginalskatt kommunal+landsting (approximation)'),

-- Top marginal tax rate (for comparison calculations)
-- ~52% includes statlig inkomstskatt on income above brytpunkt
('top_marginal_tax_rate', 2024, '0.52', 'Högsta marginalskatt inkl. statlig skatt (approximation)'),
('top_marginal_tax_rate', 2025, '0.52', 'Högsta marginalskatt inkl. statlig skatt (approximation)'),

-- Drivmedelsförmån multiplier (SKV förmånsvärde for fuel benefit)
('drivmedel_formansvarde_multiplier', 2024, '1.2', 'Drivmedelsförmån 120% av marknadspris'),
('drivmedel_formansvarde_multiplier', 2025, '1.2', 'Drivmedelsförmån 120% av marknadspris'),

-- IBB for 2026 (missing from original seed)
('ibb', 2026, '58500', 'Inkomstbasbelopp för 2026 (prognostiserat)')

ON CONFLICT (key, year) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;
