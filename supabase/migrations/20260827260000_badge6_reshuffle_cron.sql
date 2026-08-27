-- Badge 6: fair reshuffle of product listing order, every 4 hours.
-- Uniform random display_order across all active products — every product,
-- regardless of sales, gets an equal chance at a top position each cycle
-- (6 cycles/day), rather than bestsellers permanently dominating the top.
-- Sponsored/boosted listings (is_boosted, from boosted_until) still sort
-- above this per useHome.ts, so paid boosts are unaffected.
-- One UPDATE here covers both the "All" page and every category-filtered
-- section, since both query the same products_feed view ordered by the
-- same display_order column.
SELECT cron.schedule(
  'products-reshuffle',
  '0 */4 * * *', -- every 4 hours, on the hour
  $$
  UPDATE public.products
  SET display_order = floor(random() * 1000000)::int
  WHERE is_active = true;
  $$
);
