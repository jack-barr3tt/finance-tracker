INSERT INTO bank (
  name,
  short_name,
  fixed_products,
  csv_import_enabled,
  api_import_enabled
)
VALUES
  ('Monzo', 'monzo', false, true, false),
  ('Nationwide', 'nationwide', false, true, false),
  ('Barclaycard', 'barclaycard', false, true, false),
  ('Trading 212', 't212', true, true, false),
  ('Tesco Bank', 'tescobank', false, true, false)
ON CONFLICT (short_name) DO NOTHING;
