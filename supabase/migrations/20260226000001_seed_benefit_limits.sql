-- Seed benefit limits into system_parameters for yearly updates without code deploys.
-- Values per Skatteverket 2025/2026 rules.

INSERT INTO system_parameters (key, year, value, description)
VALUES
  ('benefit_limit_friskvard',      2025, '5000',  'Friskvårdsbidrag max (SKV)'),
  ('benefit_limit_friskvard',      2026, '5000',  'Friskvårdsbidrag max (SKV)'),
  ('benefit_limit_julgava',        2025, '550',   'Julgåva max (SKV)'),
  ('benefit_limit_julgava',        2026, '550',   'Julgåva max (SKV)'),
  ('benefit_limit_jubileumsgava',  2025, '1650',  'Jubileumsgåva max (SKV)'),
  ('benefit_limit_jubileumsgava',  2026, '1650',  'Jubileumsgåva max (SKV)'),
  ('benefit_limit_minnesgava',     2025, '15000', 'Minnesgåva max (SKV)'),
  ('benefit_limit_minnesgava',     2026, '15000', 'Minnesgåva max (SKV)'),
  ('benefit_limit_cykel_skattefri',2025, '3000',  'Cykelförmån skattefri max (SKV)'),
  ('benefit_limit_cykel_skattefri',2026, '3000',  'Cykelförmån skattefri max (SKV)')
ON CONFLICT (key, year) DO NOTHING;
