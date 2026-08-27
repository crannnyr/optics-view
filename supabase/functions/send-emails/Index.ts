import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const LOGO_URL = 'https://dpioixansygkjdbphfdj.supabase.co/storage/v1/object/public/product-images/WhatsApp%20Image%202025-12-20%20at%2010.00.51%20AM.jpeg';
const BRAND = 'OPTICSVIEW';
const BRAND_COLOR = '#0d2818';
const ADMIN_EMAIL = 'opticsview1@gmail.com';
const WHATSAPP_NUMBER = '447404707531';
const FROM = 'OPTICSVIEW <support@opticsview.store>';
const SITE_URL = 'https://opticsview.store';

// CORS headers — must be attached to EVERY response the function returns,
// not just the OPTIONS preflight. Without this, the browser blocks the
// frontend from reading the response even when the server call succeeded,
// which is what was causing "Something went wrong" on password reset even
// though the email had actually already been sent.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Base Template ──────────────────────────────────────────────────
function baseTemplate(content: string, preheader = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${BRAND}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:${BRAND_COLOR};padding:28px 40px;text-align:center;">
            <img src="${LOGO_URL}" alt="${BRAND}" style="height:48px;width:auto;display:inline-block;" />
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.6);font-size:10px;letter-spacing:4px;text-transform:uppercase;">${BRAND}</p>
          </td>
        </tr>
        <tr><td style="padding:40px;">${content}</td></tr>
        <tr>
          <td style="background:#f9f9f9;border-top:1px solid #eeeeee;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 6px;font-size:11px;color:#999;letter-spacing:2px;text-transform:uppercase;">${BRAND}</p>
            <p style="margin:0;font-size:11px;color:#bbb;">Questions? <a href="mailto:${ADMIN_EMAIL}" style="color:${BRAND_COLOR};text-decoration:none;">${ADMIN_EMAIL}</a></p>
            <p style="margin:8px 0 0;font-size:10px;color:#ccc;">© ${new Date().getFullYear()} ${BRAND}. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const h = (text: string) => `<h1 style="margin:0 0 8px;font-size:24px;font-weight:300;color:${BRAND_COLOR};letter-spacing:1px;">${text}</h1>`;
const divider = () => `<hr style="border:none;border-top:1px solid #eeeeee;margin:24px 0;" />`;
const btn = (text: string, href: string) => `<a href="${href}" style="display:inline-block;background:${BRAND_COLOR};color:#ffffff;text-decoration:none;padding:14px 32px;font-size:12px;letter-spacing:3px;text-transform:uppercase;border-radius:4px;margin-top:8px;">${text}</a>`;
const btnGreen = (text: string, href: string) => `<a href="${href}" style="display:inline-block;background:#25D366;color:#ffffff;text-decoration:none;padding:14px 32px;font-size:12px;letter-spacing:2px;text-transform:uppercase;border-radius:4px;margin-top:8px;">${text}</a>`;
const p = (text: string, style = '') => `<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#555;${style}">${text}</p>`;
const row = (label: string, value: string) => `<tr><td style="padding:8px 0;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;width:140px;">${label}</td><td style="padding:8px 0;font-size:13px;color:#222;font-weight:500;">${value}</td></tr>`;
const table = (rows: string) => `<table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eee;border-bottom:1px solid #eee;margin:20px 0;">${rows}</table>`;

// ── Templates ──────────────────────────────────────────────────
const templates: Record<string, (data: any) => { subject: string; html: string }> = {

  welcome: (data) => ({
    subject: `Welcome to ${BRAND} — You're in early 🎉`,
    html: baseTemplate(`
      ${h(`Welcome, ${data.name || 'Friend'} 👋`)}
      ${divider()}
      ${p(`We're genuinely excited to have you here. You've just joined <strong style="color:${BRAND_COLOR};">OPTICSVIEW</strong> — a platform we're building to change how people in Nigeria access quality tech products.`)}
      ${p(`Here's what we're about:`)}
      <div style="background:#f9f9f9;border-left:3px solid ${BRAND_COLOR};padding:16px 20px;margin:0 0 20px;border-radius:0 4px 4px 0;">
        <p style="margin:0 0 10px;font-size:13px;color:#333;font-weight:600;">🇨🇳 Direct from China. No middlemen.</p>
        <p style="margin:0 0 10px;font-size:13px;color:#555;">We source directly from verified manufacturers — every product tested and quality-checked before it gets to you.</p>
        <p style="margin:0 0 10px;font-size:13px;color:#333;font-weight:600;">🤝 The Retailer Model</p>
        <p style="margin:0;font-size:13px;color:#555;">Our retailer program lets you sell our products through your own branded store, set your own prices, and earn on every sale — no inventory needed.</p>
      </div>
      ${p(`We're currently in <strong>beta</strong> — which means you're one of the first. That matters to us.`)}
      <div style="text-align:center;margin-top:28px;">${btn('Visit The Store', SITE_URL)}</div>
    `, `Welcome to OPTICSVIEW — you're in early.`)
  }),

  // ── Password reset: OTP CODE, not a clickable link ─────────
  // Sent as a 6-digit code the user types directly into the app.
  // No redirect URL, no hash-parsing, no dependency on any page
  // existing at a specific route — the whole flow lives in the
  // auth modal.
  password_reset: (data) => ({
    subject: `Your ${BRAND} password reset code: ${data.otp_code}`,
    html: baseTemplate(`
      ${h('Reset Your Password')}
      ${divider()}
      ${p(`Enter this code in the app to continue resetting your password:`)}
      <div style="text-align:center;margin:28px 0;">
        <div style="display:inline-block;background:#f9f9f9;border:1px solid #eee;border-radius:8px;padding:20px 36px;">
          <span style="font-size:32px;font-weight:600;letter-spacing:10px;color:${BRAND_COLOR};">${data.otp_code}</span>
        </div>
      </div>
      ${p(`This code expires in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email — your password will not be changed.`)}
      ${divider()}
      ${p(`Having trouble? Contact us at <a href="mailto:${ADMIN_EMAIL}" style="color:${BRAND_COLOR};">${ADMIN_EMAIL}</a>`, 'font-size:12px;color:#999;')}
    `, 'Your OPTICSVIEW password reset code.')
  }),

  order_confirmation: (data) => ({
    subject: `Order Confirmed — #${data.order_id?.slice(0, 8).toUpperCase()}`,
    html: baseTemplate(`
      ${h('Order Confirmed ✅')}
      ${divider()}
      ${p(`Hi ${data.customer_name}, thank you for your order! We've received it and it's being reviewed.`)}
      ${table(`
        ${row('Order ID', `#${data.order_id?.slice(0, 8).toUpperCase()}`)}
        ${row('Total', `₦${Number(data.total_amount).toLocaleString()}`)}
        ${row('Payment', data.payment_method === 'paystack' ? 'Card (Paystack)' : 'Bank Transfer')}
        ${row('Delivery', data.shipping_address)}
      `)}
      ${p(`We'll notify you once your order is approved and on its way.`)}
      <div style="text-align:center;margin-top:28px;">${btn('Track My Order', `${SITE_URL}/orders`)}</div>
    `, `Your order #${data.order_id?.slice(0, 8).toUpperCase()} has been confirmed.`)
  }),

  order_shipped: (data) => ({
    subject: `Your order is on the way! 🚚`,
    html: baseTemplate(`
      ${h('Your Order is Shipped 🚚')}
      ${divider()}
      ${p(`Great news, ${data.customer_name}! Your order has been dispatched and is on its way to you.`)}
      ${table(`
        ${row('Order ID', `#${data.order_id?.slice(0, 8).toUpperCase()}`)}
        ${row('Delivery To', data.shipping_address)}
      `)}
      ${p(`Our delivery partner will contact you on your provided phone number. Please ensure someone is available to receive the package.`)}
    `, 'Your OPTICSVIEW order is on its way!')
  }),

  // ── Shipped with tracking ───────────────────────────
  // Sent once per supplier when admin marks order as shipped.
  // Includes tracking ID and direct link to the supplier's tracking page.
  order_shipped_tracking: (data) => ({
    subject: `Your order is on the way! 🚚 ${data.tracking_id ? `Track: ${data.tracking_id}` : ''}`,
    html: baseTemplate(`
      ${h('Your Order is Shipped 🚚')}
      ${divider()}
      ${p(`Great news, ${data.customer_name}! Your order has been dispatched via <strong>${data.supplier_label}</strong> and is on its way to you.`)}
      ${table(`
        ${row('Order ID', `#${data.order_id?.slice(0, 8).toUpperCase()}`)}
        ${row('Delivery To', data.shipping_address)}
        ${row('Shipped via', data.supplier_label)}
        ${data.tracking_id ? row('Tracking ID', data.tracking_id) : ''}
      `)}
      ${data.tracking_url ? `
        <div style="text-align:center;margin:28px 0;">
          ${btn('Track My Order', data.tracking_url)}
        </div>
      ` : p(`Our delivery partner will contact you on your provided phone number.`)}
      ${p(`Please ensure someone is available to receive the package.`)}
    `, `Your OPTICSVIEW order is on its way via ${data.supplier_label}!`)
  }),

  order_delivered: (data) => ({
    subject: `Order Delivered — Hope you love it! 🎉`,
    html: baseTemplate(`
      ${h('Order Delivered! 🎉')}
      ${divider()}
      ${p(`Hi ${data.customer_name}, your order has been marked as delivered. We hope you love your new purchase!`)}
      ${table(`${row('Order ID', `#${data.order_id?.slice(0, 8).toUpperCase()}`)}`)}
      ${p(`If you have any issues, reach out at <a href="mailto:${ADMIN_EMAIL}" style="color:${BRAND_COLOR};">${ADMIN_EMAIL}</a>.`)}
    `, 'Your OPTICSVIEW order has been delivered.')
  }),

  order_status_update: (data) => ({
    subject: `Order Update — ${data.status?.toUpperCase()}`,
    html: baseTemplate(`
      ${h('Order Update')}
      ${divider()}
      ${p(`Hi ${data.customer_name}, here's the latest update on your order:`)}
      ${table(`
        ${row('Order ID', `#${data.order_id?.slice(0, 8).toUpperCase()}`)}
        ${row('New Status', data.status?.toUpperCase())}
      `)}
      ${p(`If you have any questions, we're always here to help.`)}
    `, `Your order status has been updated to ${data.status}.`)
  }),

  new_order_alert: (data) => ({
    subject: `🛒 New Order — ₦${Number(data.total_amount).toLocaleString()}`,
    html: baseTemplate(`
      ${h('New Order Received')}
      ${divider()}
      ${table(`
        ${row('Order ID', `#${data.order_id?.slice(0, 8).toUpperCase()}`)}
        ${row('Customer', data.customer_name)}
        ${row('Email', data.customer_email)}
        ${row('Phone', data.customer_phone || '—')}
        ${row('Total', `₦${Number(data.total_amount).toLocaleString()}`)}
        ${row('Payment', data.payment_method === 'paystack' ? 'Paystack' : 'Transfer')}
        ${row('Address', data.shipping_address)}
      `)}
      <div style="text-align:center;margin-top:28px;">${btn('View in Admin', `${SITE_URL}/admin`)}</div>
    `, `New order of ₦${Number(data.total_amount).toLocaleString()} received.`)
  }),

  // ── Payment nudge ───────────────────────────────────
  // Sent manually by admin to customers with unverified transfer orders.
  // Casual, friendly, includes WhatsApp link for quick resolution.
  payment_nudge: (data) => ({
    subject: `Did something go wrong? Your order is waiting 👀`,
    html: baseTemplate(`
      ${h(`Hey ${data.customer_name} 👋`)}
      ${divider()}
      ${p(`You recently placed an order with us but we haven't received your payment yet. No worries — it happens!`)}
      ${table(`
        ${row('Order ID', `#${data.order_id?.slice(0, 8).toUpperCase()}`)}
        ${row('Amount', `₦${Number(data.total_amount).toLocaleString()}`)}
        ${row('Payment', 'Bank Transfer — Pending')}
      `)}
      ${p(`If you had trouble with the transfer or need our account details again, just hit us on WhatsApp — we'll sort it out in minutes 👇`)}
      <div style="text-align:center;margin:28px 0;">
        ${btnGreen('Chat on WhatsApp', `https://wa.me/${WHATSAPP_NUMBER}?text=Hi%2C%20I%20need%20help%20with%20my%20order%20%23${data.order_id?.slice(0, 8).toUpperCase()}`)}
      </div>
      ${p(`If you've already sent the payment, just ignore this — we'll verify it shortly and get your order moving.`, 'font-size:12px;color:#999;')}
    `, `Your OPTICSVIEW order is still waiting for payment.`)
  }),

  retailer_application: (data) => ({
    subject: `We've received your application — ${BRAND}`,
    html: baseTemplate(`
      ${h('Application Received 📋')}
      ${divider()}
      ${p(`Hi ${data.store_name}, thank you for applying to become an OPTICSVIEW retailer!`)}
      ${p(`Our team is reviewing your application. Here's what happens next:`)}
      <ol style="padding-left:20px;margin:0 0 20px;">
        <li style="font-size:14px;color:#555;line-height:2;">We review your application</li>
        <li style="font-size:14px;color:#555;line-height:2;">You receive an activation confirmation</li>
        <li style="font-size:14px;color:#555;line-height:2;">Your store goes live and you start selling</li>
      </ol>
      ${p(`Questions? <a href="mailto:${ADMIN_EMAIL}" style="color:${BRAND_COLOR};">${ADMIN_EMAIL}</a>`)}
    `, 'Your OPTICSVIEW retailer application is under review.')
  }),

  retailer_activated: (data) => ({
    subject: `Your store is live! 🚀 Welcome to ${BRAND}`,
    html: baseTemplate(`
      ${h(`You're Live, ${data.store_name}! 🚀`)}
      ${divider()}
      ${p(`Congratulations! Your OPTICSVIEW retailer account has been activated.`)}
      ${table(`
        ${row('Store Name', data.store_name)}
        ${row('Store URL', data.store_url)}
      `)}
      <ol style="padding-left:20px;margin:0 0 20px;">
        <li style="font-size:14px;color:#555;line-height:2;">Log into your retailer dashboard</li>
        <li style="font-size:14px;color:#555;line-height:2;">Set your custom prices on products</li>
        <li style="font-size:14px;color:#555;line-height:2;">Share your store link and start earning</li>
      </ol>
      <div style="text-align:center;margin-top:28px;">${btn('Go to My Dashboard', `${SITE_URL}/retailer`)}</div>
    `, 'Your OPTICSVIEW retailer store is now live!')
  }),

  retailer_rejected: (data) => ({
    subject: `Update on your ${BRAND} application`,
    html: baseTemplate(`
      ${h('Application Update')}
      ${divider()}
      ${p(`Hi ${data.store_name}, thank you for your interest in becoming an OPTICSVIEW retailer.`)}
      ${p(`After reviewing your application, we're unable to approve it at this time. This could be due to incomplete information or eligibility requirements.`)}
      ${p(`If you believe this is an error, contact us at <a href="mailto:${ADMIN_EMAIL}" style="color:${BRAND_COLOR};">${ADMIN_EMAIL}</a>.`)}
    `, 'An update on your OPTICSVIEW retailer application.')
  }),

  commission_credited: (data) => ({
    subject: `💰 You earned ₦${Number(data.amount).toLocaleString()} from a sale!`,
    html: baseTemplate(`
      ${h('You Made a Sale! 💰')}
      ${divider()}
      ${p(`Great news, ${data.store_name}! A customer just purchased through your store.`)}
      ${table(`
        ${row('Amount Earned', `₦${Number(data.amount).toLocaleString()}`)}
        ${row('Order ID', `#${data.order_id?.slice(0, 8).toUpperCase()}`)}
        ${row('New Balance', `₦${Number(data.new_balance).toLocaleString()}`)}
      `)}
      <div style="text-align:center;margin-top:28px;">${btn('View My Earnings', `${SITE_URL}/retailer`)}</div>
    `, `You earned ₦${Number(data.amount).toLocaleString()} from a sale!`)
  }),

  referral_commission: (data) => ({
    subject: `🤝 Referral bonus — ₦${Number(data.amount).toLocaleString()} credited!`,
    html: baseTemplate(`
      ${h('Referral Bonus Credited! 🤝')}
      ${divider()}
      ${p(`Hi ${data.store_name}, someone you referred just activated their retailer account!`)}
      ${table(`
        ${row('Referred Store', data.referred_store)}
        ${row('Commission', `₦${Number(data.amount).toLocaleString()}`)}
        ${row('New Balance', `₦${Number(data.new_balance).toLocaleString()}`)}
      `)}
      <div style="text-align:center;margin-top:28px;">${btn('View Dashboard', `${SITE_URL}/retailer`)}</div>
    `, `You earned ₦${Number(data.amount).toLocaleString()} referral commission!`)
  }),

  withdrawal_processed: (data) => ({
    subject: `Withdrawal of ₦${Number(data.amount).toLocaleString()} processed ✅`,
    html: baseTemplate(`
      ${h('Withdrawal Processed ✅')}
      ${divider()}
      ${p(`Hi ${data.store_name}, your withdrawal has been processed successfully.`)}
      ${table(`
        ${row('Amount', `₦${Number(data.amount).toLocaleString()}`)}
        ${row('Bank', data.bank_name || '—')}
        ${row('Account', data.account_number || '—')}
        ${row('Remaining Balance', `₦${Number(data.new_balance).toLocaleString()}`)}
      `)}
      ${p(`Funds should reflect within 24 hours. Issues? <a href="mailto:${ADMIN_EMAIL}" style="color:${BRAND_COLOR};">${ADMIN_EMAIL}</a>`)}
    `, `Your withdrawal of ₦${Number(data.amount).toLocaleString()} has been processed.`)
  }),

  withdrawal_requested: (data) => ({
    subject: `💸 Withdrawal Request — ₦${Number(data.amount).toLocaleString()}`,
    html: baseTemplate(`
      ${h('Withdrawal Request')}
      ${divider()}
      ${p('A retailer has requested a withdrawal. Please process it promptly.')}
      ${table(`
        ${row('Store', data.store_name)}
        ${row('Amount', `₦${Number(data.amount).toLocaleString()}`)}
        ${row('Bank', data.bank_name || '—')}
        ${row('Account', data.account_number || '—')}
        ${row('Account Name', data.account_name || '—')}
      `)}
      <div style="text-align:center;margin-top:28px;">${btn('Go to Admin Panel', `${SITE_URL}/admin`)}</div>
    `, `Withdrawal of ₦${Number(data.amount).toLocaleString()} needs processing.`)
  }),

  new_product: (data) => ({
    subject: `🆕 New drop in your category — ${data.product_name}`,
    html: baseTemplate(`
      ${h('New Product Alert 🆕')}
      ${divider()}
      ${p(`Hi ${data.store_name}, a new product has just been added to your category!`)}
      <div style="text-align:center;margin:24px 0;">
        ${data.product_image ? `<img src="${data.product_image}" alt="${data.product_name}" style="max-width:240px;border-radius:8px;border:1px solid #eee;" />` : ''}
      </div>
      ${table(`
        ${row('Product', data.product_name)}
        ${row('Category', data.category)}
        ${row('Base Price', `₦${Number(data.price).toLocaleString()}`)}
      `)}
      ${p(`Log in to set your custom price and start selling.`)}
      <div style="text-align:center;margin-top:28px;">${btn('View in Dashboard', `${SITE_URL}/retailer`)}</div>
    `, `New product dropped: ${data.product_name}`)
  }),
};

// ── Main Handler ──────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { type, to_email, to_name, data, bypass_limit = false } = await req.json();

    if (!type || !to_email) {
      return new Response(JSON.stringify({ success: false, error: 'type and to_email are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const template = templates[type];
    if (!template) {
      return new Response(JSON.stringify({ success: false, error: `Unknown email type: ${type}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Badge 4: admin can stop any email type from the admin panel. Checked
    // here so the toggle takes effect for every direct (non-queued) send.
    const { data: controlsRow } = await supabase
      .from('app_settings').select('value').eq('key', 'email_type_controls').maybeSingle();
    if (controlsRow?.value?.[type] === false) {
      return new Response(JSON.stringify({ success: false, error: 'This email type is currently stopped by admin', skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let templateData = { ...data, to_name };

    if (type === 'password_reset') {
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: to_email,
        options: { redirectTo: `${SITE_URL}?reset=true` },
      });

      if (linkError) {
        console.error('generateLink (recovery) failed:', linkError.message);
        return new Response(JSON.stringify({
          success: false,
          error: linkError.message || 'Could not start password reset for this email.',
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const otp = linkData?.properties?.email_otp;
      if (!otp) {
        console.error('generateLink returned no email_otp for', to_email);
        return new Response(JSON.stringify({
          success: false,
          error: 'Could not generate a reset code. Please try again or contact support.',
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      templateData.otp_code = otp;
    }

    const { subject, html } = template(templateData);

    // Daily send-limit enforcement removed per request — emails now
    // always send immediately instead of being queued/blocked once a
    // daily count was hit. `bypass_limit` is kept as an accepted (but
    // now unused) param so existing callers don't break.

    // Send via Resend
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, to: [to_email], subject, html }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      await supabase.from('email_logs').insert({ type, to_email, status: 'failed', error: JSON.stringify(resendData) });
      return new Response(JSON.stringify({ success: false, error: resendData }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await supabase.from('email_logs').insert({ type, to_email, status: 'sent', resend_id: resendData.id });

    return new Response(JSON.stringify({ success: true, resend_id: resendData.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
