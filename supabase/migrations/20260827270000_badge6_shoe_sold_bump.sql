-- Badge 6 part 2: one-time manual sold-count bump for all footwear (shoes)
-- products. Adds a random amount between 1976-2907 ON TOP of each
-- product's existing units_sold (per instruction: "increase once instead
-- of doing separately just add").
--
-- Note: this pushes every shoe past the 1000-sold auto-Trending badge
-- threshold (see ProductCard.tsx isPopular), so all 42 shoes now show as
-- Trending rather than a single one. Confirmed with the client to leave
-- this as-is rather than add a dedicated single-item trending flag.
UPDATE public.products
SET units_sold = units_sold + (1976 + floor(random() * (2907 - 1976 + 1)))::int
WHERE category = 'footwears' AND is_active = true;
