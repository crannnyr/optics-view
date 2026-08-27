-- Badge 2: bank the customer is transferring FROM (distinct from
-- bank_accounts, which holds OUR receiving accounts).
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS sender_bank_name text;
COMMENT ON COLUMN public.orders.sender_bank_name IS 'Bank the customer transferred FROM, selected from the app''s preset commercial-bank list (Badge 2). Distinct from bank_accounts, which holds OUR receiving accounts.';
