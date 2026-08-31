-- Badge 4: vendor onboarding overhaul — new fields captured at registration.
ALTER TABLE vendor_registrations
  ADD COLUMN selected_categories text[] NOT NULL DEFAULT '{}',
  ADD COLUMN selected_subcategories text[] NOT NULL DEFAULT '{}',
  ADD COLUMN terms_agreed_at timestamptz;
