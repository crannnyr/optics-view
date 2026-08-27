-- Badge 5: backfill profiles for auth.users that never got a row.
--
-- Root cause found: a signup spike between Aug 18-24 2026 (up to ~1,748
-- signups in a single day, vs a normal ~7/day) landed while the
-- create_profile_on_signup trigger was evidently not yet in place / not
-- firing correctly. Every signup from Aug 25 onward already has a matching
-- profile, so this is a one-time backlog, not an ongoing bug — no trigger
-- code change needed, just the backfill.
INSERT INTO public.profiles (id, email, full_name, role)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  'customer'
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;
