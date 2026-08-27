-- Badge 3: buyer + retailer recurring marketing email automation.
-- Requires the marketing-broadcast edge function to be deployed.

INSERT INTO app_settings (key, value)
VALUES ('email_type_controls', '{"buyer_morning": true, "buyer_evening": true, "retailer_weekly": true}'::jsonb)
ON CONFLICT (key) DO NOTHING;

SELECT cron.schedule(
  'marketing-buyer-morning',
  '0 7 * * *', -- 07:00 UTC = 08:00 WAT, daily
  $$
  SELECT net.http_post(
    url := 'https://dpioixansygkjdbphfdj.supabase.co/functions/v1/marketing-broadcast',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('campaign', 'buyer_morning')
  );
  $$
);

SELECT cron.schedule(
  'marketing-buyer-evening',
  '0 17 * * *', -- 17:00 UTC = 18:00 WAT, daily
  $$
  SELECT net.http_post(
    url := 'https://dpioixansygkjdbphfdj.supabase.co/functions/v1/marketing-broadcast',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('campaign', 'buyer_evening')
  );
  $$
);

SELECT cron.schedule(
  'marketing-retailer-weekly',
  '0 9 * * 6', -- 09:00 UTC = 10:00 WAT, Saturdays
  $$
  SELECT net.http_post(
    url := 'https://dpioixansygkjdbphfdj.supabase.co/functions/v1/marketing-broadcast',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('campaign', 'retailer_weekly')
  );
  $$
);
