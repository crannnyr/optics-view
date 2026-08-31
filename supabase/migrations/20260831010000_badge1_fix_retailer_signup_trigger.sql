-- Badge 1 (round 2): fix "Failed to create registration" on retailer application.
--
-- Root cause: sync_retailer_registration_to_profile() copied
-- retailer_registrations.subscription_status straight into
-- profiles.subscription_status on every INSERT/UPDATE. retailer_registrations
-- allows 'pending' and 'closed' in addition to the four values profiles allows
-- ('trial' | 'active' | 'suspended' | 'inactive'). Every fresh application is
-- inserted with subscription_status = 'pending', which always violated
-- profiles_subscription_status_check inside this AFTER INSERT trigger and
-- rolled back the entire registration insert — 100% reproducible on every
-- application, not an intermittent issue.
--
-- Fix: map any retailer_registrations status outside the profiles-allowed set
-- to 'inactive'. Also now keeps subscription_status in sync on conflict
-- (previously omitted from the ON CONFLICT DO UPDATE, so a profile's status
-- never advanced past its first sync even after payment was verified).

CREATE OR REPLACE FUNCTION public.sync_retailer_registration_to_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role, store_slug, store_name, subscription_status, trial_ends_at, registration_verified_at)
  SELECT u.id, NEW.email, NEW.full_name, NEW.phone, 'retailer', NEW.store_slug, NEW.full_name,
    CASE WHEN NEW.subscription_status IN ('trial','active','suspended','inactive')
         THEN NEW.subscription_status
         ELSE 'inactive'
    END,
    NEW.trial_ends_at, NEW.verified_at
  FROM auth.users u
  WHERE u.email = NEW.email
  ON CONFLICT (id) DO UPDATE
  SET role = 'retailer',
      store_slug = EXCLUDED.store_slug,
      store_name = EXCLUDED.store_name,
      subscription_status = EXCLUDED.subscription_status;

  RETURN NEW;
END;
$function$;

-- Second, related bug found while fixing the above: there was no UPDATE
-- policy letting a regular authenticated user update their own
-- retailer_registrations row — only admin_can_update_retailer (is_admin()).
-- This silently blocked (supabase-js doesn't throw on RLS-blocked updates by
-- default, it just no-ops): (a) the Paystack-retry reference rotation in
-- checkApplicationStatus/handleSubmitDetails, meaning a retried payment could
-- succeed on Paystack's side but never get matched back to the registration
-- row, and (b) submitting sender_name on manual bank transfer, meaning admin
-- would see a blank sender name to verify against.
CREATE POLICY "Users update own registration"
ON public.retailer_registrations
FOR UPDATE
USING (
  email = (SELECT profiles.email FROM public.profiles WHERE profiles.id = (SELECT auth.uid()))
)
WITH CHECK (
  email = (SELECT profiles.email FROM public.profiles WHERE profiles.id = (SELECT auth.uid()))
);
