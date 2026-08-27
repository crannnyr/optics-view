-- Badge 4: extend email_type_controls (created in Badge 3 for the 3
-- marketing types) to cover every transactional type, default ON.
UPDATE app_settings
SET value = value || jsonb_build_object(
  'welcome', true,
  'password_reset', true,
  'order_placed', true,
  'notification', true,
  'order_confirmation', true,
  'order_shipped', true,
  'order_shipped_tracking', true,
  'order_delivered', true,
  'order_status_update', true,
  'new_order_alert', true,
  'payment_nudge', true,
  'retailer_application', true,
  'retailer_activated', true,
  'retailer_rejected', true,
  'commission_credited', true,
  'referral_commission', true,
  'withdrawal_processed', true,
  'withdrawal_requested', true,
  'new_product', true
)
WHERE key = 'email_type_controls';
