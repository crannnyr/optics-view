-- ============================================================
-- Badge 3 (part 1/3): CPC vendor ads system — backend
-- Replaces the old flat-fee, fixed-duration "Sponsorship" model
-- with pay-per-click: vendor funds a wallet (₦1,000 minimum),
-- picks ONE live product to promote at a time, gets charged ₦15
-- per click, and the ad auto-pauses when the wallet hits ₦0.
-- The old Sold Out Campaign (vendor_promotions) is NOT removed —
-- it's still reachable as a one-time offer, now surfaced from the
-- Ads tab (see part 2/3, the frontend).
-- ============================================================

CREATE TABLE public.vendor_ad_wallets (
  vendor_id uuid PRIMARY KEY REFERENCES public.vendor_registrations(id),
  balance numeric NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_topped_up numeric NOT NULL DEFAULT 0,
  total_spent numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.vendor_ad_wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendor_registrations(id),
  type text NOT NULL CHECK (type IN ('topup', 'click_charge')),
  amount numeric NOT NULL,
  balance_after numeric,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  paystack_reference text UNIQUE,
  product_id uuid REFERENCES public.products(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_vendor_ad_wallet_tx_vendor ON public.vendor_ad_wallet_transactions(vendor_id, created_at DESC);

CREATE TABLE public.vendor_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL UNIQUE REFERENCES public.vendor_registrations(id),
  product_id uuid NOT NULL REFERENCES public.products(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused_no_funds', 'paused_by_vendor')),
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  total_spent numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_ad_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_ad_wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendor can view own ad wallet" ON public.vendor_ad_wallets
  FOR SELECT USING (vendor_id IN (SELECT id FROM public.vendor_registrations WHERE profile_id = auth.uid()));
CREATE POLICY "admins manage vendor_ad_wallets" ON public.vendor_ad_wallets
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "vendor can view own ad transactions" ON public.vendor_ad_wallet_transactions
  FOR SELECT USING (vendor_id IN (SELECT id FROM public.vendor_registrations WHERE profile_id = auth.uid()));
CREATE POLICY "vendor can insert own pending topup" ON public.vendor_ad_wallet_transactions
  FOR INSERT WITH CHECK (
    vendor_id IN (SELECT id FROM public.vendor_registrations WHERE profile_id = auth.uid())
    AND type = 'topup' AND status = 'pending'
  );
CREATE POLICY "admins manage vendor_ad_wallet_transactions" ON public.vendor_ad_wallet_transactions
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "vendor can view own ads" ON public.vendor_ads
  FOR SELECT USING (vendor_id IN (SELECT id FROM public.vendor_registrations WHERE profile_id = auth.uid()));
CREATE POLICY "admins manage vendor_ads" ON public.vendor_ads
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Public-safe view: shoppers need to know which product is sponsored, but
-- should never see the vendor's spend, balance, or click count.
CREATE VIEW public.sponsored_products AS
  SELECT product_id FROM public.vendor_ads WHERE status = 'active';
GRANT SELECT ON public.sponsored_products TO anon, authenticated;

-- Confirms a wallet top-up after Paystack success. Matches this app's
-- existing pattern elsewhere (client confirms from Paystack's onSuccess
-- callback rather than a server-side webhook) — same trust model already
-- used for retailer registrations and the Sold Out Campaign.
CREATE OR REPLACE FUNCTION public.confirm_vendor_ad_topup(p_reference text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_tx record;
  v_new_balance numeric;
BEGIN
  SELECT * INTO v_tx FROM vendor_ad_wallet_transactions
    WHERE paystack_reference = p_reference AND type = 'topup' AND status = 'pending'
    FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'transaction_not_found');
  END IF;

  IF v_tx.vendor_id NOT IN (SELECT id FROM vendor_registrations WHERE profile_id = auth.uid()) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_owner');
  END IF;

  UPDATE vendor_ad_wallet_transactions SET status = 'completed' WHERE id = v_tx.id;

  INSERT INTO vendor_ad_wallets (vendor_id, balance, total_topped_up, updated_at)
  VALUES (v_tx.vendor_id, v_tx.amount, v_tx.amount, now())
  ON CONFLICT (vendor_id) DO UPDATE
    SET balance = vendor_ad_wallets.balance + v_tx.amount,
        total_topped_up = vendor_ad_wallets.total_topped_up + v_tx.amount,
        updated_at = now()
  RETURNING balance INTO v_new_balance;

  UPDATE vendor_ad_wallet_transactions SET balance_after = v_new_balance WHERE id = v_tx.id;

  UPDATE vendor_ads SET status = 'active', updated_at = now()
    WHERE vendor_id = v_tx.vendor_id AND status = 'paused_no_funds';

  RETURN jsonb_build_object('ok', true, 'balance', v_new_balance);
END;
$$;

-- Sets (or switches) the vendor's single promoted product. Switching resets
-- campaign stats to zero since it's a new campaign for a different product.
CREATE OR REPLACE FUNCTION public.set_vendor_ad_product(p_vendor_id uuid, p_product_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_owns boolean;
  v_is_live boolean;
  v_balance numeric;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM vendor_registrations WHERE id = p_vendor_id AND profile_id = auth.uid()
  ) INTO v_owns;
  IF NOT v_owns THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_owner');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM vendor_product_applications
    WHERE vendor_id = p_vendor_id AND product_id = p_product_id AND status = 'live'
  ) INTO v_is_live;
  IF NOT v_is_live THEN
    RETURN jsonb_build_object('ok', false, 'error', 'product_not_live_for_vendor');
  END IF;

  SELECT COALESCE(balance, 0) INTO v_balance FROM vendor_ad_wallets WHERE vendor_id = p_vendor_id;

  INSERT INTO vendor_ads (vendor_id, product_id, status, impressions, clicks, total_spent, updated_at)
  VALUES (p_vendor_id, p_product_id, CASE WHEN COALESCE(v_balance, 0) > 0 THEN 'active' ELSE 'paused_no_funds' END, 0, 0, 0, now())
  ON CONFLICT (vendor_id) DO UPDATE
    SET product_id = p_product_id,
        status = CASE WHEN COALESCE(v_balance, 0) > 0 THEN 'active' ELSE 'paused_no_funds' END,
        impressions = 0, clicks = 0, total_spent = 0,
        updated_at = now();

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Vendor can manually pause/resume without changing product or losing stats.
CREATE OR REPLACE FUNCTION public.set_vendor_ad_pause(p_vendor_id uuid, p_paused boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_owns boolean;
  v_balance numeric;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM vendor_registrations WHERE id = p_vendor_id AND profile_id = auth.uid()
  ) INTO v_owns;
  IF NOT v_owns THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_owner');
  END IF;

  IF p_paused THEN
    UPDATE vendor_ads SET status = 'paused_by_vendor', updated_at = now()
      WHERE vendor_id = p_vendor_id AND status = 'active';
  ELSE
    SELECT COALESCE(balance, 0) INTO v_balance FROM vendor_ad_wallets WHERE vendor_id = p_vendor_id;
    IF COALESCE(v_balance, 0) <= 0 THEN
      RETURN jsonb_build_object('ok', false, 'error', 'insufficient_funds');
    END IF;
    UPDATE vendor_ads SET status = 'active', updated_at = now()
      WHERE vendor_id = p_vendor_id AND status = 'paused_by_vendor';
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Called by anonymous shoppers when a sponsored product card renders.
-- No auth needed, no money moves — just a counter.
CREATE OR REPLACE FUNCTION public.record_ad_impression(p_product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  UPDATE vendor_ads SET impressions = impressions + 1, updated_at = now()
    WHERE product_id = p_product_id AND status = 'active';
END;
$$;

-- Called when a shopper clicks through to a sponsored product. Charges ₦15
-- from the vendor's ad wallet atomically (the WHERE balance >= 15 guard
-- makes this race-safe under concurrent clicks). Auto-pauses the ad the
-- moment the wallet can no longer cover another click. Never blocks the
-- shopper's navigation either way — charging failure just means the ad
-- stops being shown as sponsored going forward.
CREATE OR REPLACE FUNCTION public.record_ad_click(p_product_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_ad record;
  v_new_balance numeric;
  v_cost numeric := 15;
BEGIN
  SELECT * INTO v_ad FROM vendor_ads WHERE product_id = p_product_id AND status = 'active' FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('charged', false);
  END IF;

  UPDATE vendor_ad_wallets
    SET balance = balance - v_cost, total_spent = total_spent + v_cost, updated_at = now()
    WHERE vendor_id = v_ad.vendor_id AND balance >= v_cost
    RETURNING balance INTO v_new_balance;

  IF NOT FOUND THEN
    UPDATE vendor_ads SET status = 'paused_no_funds', updated_at = now() WHERE id = v_ad.id;
    RETURN jsonb_build_object('charged', false, 'paused', true);
  END IF;

  UPDATE vendor_ads
    SET clicks = clicks + 1, total_spent = total_spent + v_cost, updated_at = now(),
        status = CASE WHEN v_new_balance < v_cost THEN 'paused_no_funds' ELSE status END
    WHERE id = v_ad.id;

  INSERT INTO vendor_ad_wallet_transactions (vendor_id, type, amount, balance_after, status, product_id)
  VALUES (v_ad.vendor_id, 'click_charge', v_cost, v_new_balance, 'completed', p_product_id);

  RETURN jsonb_build_object('charged', true, 'balance', v_new_balance, 'paused', v_new_balance < v_cost);
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_ad_impression(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_ad_click(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_vendor_ad_topup(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_vendor_ad_product(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_vendor_ad_pause(uuid, boolean) TO authenticated;
