// supabase/functions/marketing-broadcast/index.ts
//
// Recurring buyer + retailer marketing sends (Badge 3).
//
// Deliberately does NOT sync a separate Resend contact list. Recipients are
// queried live from the DB on every run, so there's nothing to keep in sync
// when new buyers or retailers sign up — they're just included automatically
// the next time this runs, based on their current profiles/orders data.
//
// Invoked by pg_cron via pg_net at:
//   - 07:00 UTC (08:00 WAT) daily -> campaign=buyer_morning
//   - 17:00 UTC (18:00 WAT) daily -> campaign=buyer_evening
//   - 09:00 UTC (10:00 WAT) Saturdays -> campaign=retailer_weekly
//
// Each campaign type can be individually disabled via
// app_settings.email_type_controls (built here, extended by Badge 4's admin
// per-type stop toggle). Sends are logged to email_logs (type = campaign
// name) both for the existing admin "last sent" visibility and as a
// same-day/same-week duplicate-send guard.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const BRAND = 'OPTICSVIEW';
const BRAND_COLOR = '#0d2818';
const FROM = 'OPTICSVIEW <support@opticsview.store>';
const SITE_URL = 'https://opticsview.store';
const LOGO_URL = 'https://dpioixansygkjdbphfdj.supabase.co/storage/v1/object/public/product-images/WhatsApp%20Image%202025-12-20%20at%2010.00.51%20AM.jpeg';
const UNSUB_FOOTER_TEXT = `\n\nDon't want emails like this? Reply STOP and we'll take you off the list.`;
const UNSUB_FOOTER_HTML = `<p style="margin:10px 0 0;font-size:10px;color:#ccc;">Don't want emails like this? Reply <strong>STOP</strong> and we'll take you off the list.</p>`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function shell(bodyHtml: string, preheader: string) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>${BRAND}</title></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
<tr><td style="background:${BRAND_COLOR};padding:28px 40px;text-align:center;">
<img src="${LOGO_URL}" alt="${BRAND}" style="height:48px;width:auto;display:inline-block;" />
<p style="margin:8px 0 0;color:rgba(255,255,255,0.6);font-size:10px;letter-spacing:4px;text-transform:uppercase;">${BRAND}</p>
</td></tr>
<tr><td style="padding:36px 40px;">${bodyHtml}</td></tr>
<tr><td style="background:#f9f9f9;border-top:1px solid #eeeeee;padding:20px 40px;text-align:center;">
<p style="margin:0;font-size:11px;color:#bbb;">© ${new Date().getFullYear()} ${BRAND}</p>
${UNSUB_FOOTER_HTML}
</td></tr>
</table></td></tr></table></body></html>`;
}

const btn = (text: string, href: string, color = BRAND_COLOR) =>
  `<a href="${href}" style="display:inline-block;background:${color};color:#ffffff;text-decoration:none;padding:14px 32px;font-size:12px;letter-spacing:2px;text-transform:uppercase;border-radius:4px;margin-top:8px;">${text}</a>`;

// ── Recipient queries ──────────────────────────────────────────────

async function getBuyers(): Promise<{ email: string; name: string }[]> {
  const { data } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('role', 'customer')
    .not('email', 'is', null);
  return (data ?? []).map(r => ({ email: r.email!, name: r.full_name || 'there' }));
}

async function getRetailersWithNoSales(): Promise<{ email: string; name: string; slug: string }[]> {
  const { data: retailers } = await supabase
    .from('profiles')
    .select('id, email, full_name, store_slug')
    .eq('role', 'retailer')
    .not('email', 'is', null);

  if (!retailers?.length) return [];

  const results: { email: string; name: string; slug: string }[] = [];
  for (const r of retailers) {
    const { count } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('retailer_id', r.id)
      .in('status', ['approved', 'shipped', 'pickup', 'delivered']);
    if (!count || count === 0) {
      results.push({ email: r.email!, name: r.full_name || 'there', slug: r.store_slug || '' });
    }
  }
  return results;
}

// ── New-arrivals lookup for the buyer morning email ────────────────

async function getNewArrivals() {
  const { data } = await supabase
    .from('products')
    .select('id, name, price, image_url')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(4);
  return data ?? [];
}

// ── Templates ────────────────────────────────────────────────────

function buyerMorningTemplate(name: string, products: any[]) {
  const subject = `Good morning ${name.split(' ')[0]} — see what's new today`;
  const items = products.map(p => `
    <div style="display:inline-block;width:120px;vertical-align:top;margin:0 8px 12px 0;text-align:center;">
      <img src="${p.image_url || LOGO_URL}" style="width:120px;height:120px;object-fit:cover;border-radius:6px;border:1px solid #eee;" />
      <p style="margin:6px 0 0;font-size:11px;color:#333;">${(p.name || '').slice(0, 40)}</p>
      <p style="margin:2px 0 0;font-size:11px;color:${BRAND_COLOR};font-weight:600;">₦${Number(p.price || 0).toLocaleString()}</p>
    </div>`).join('');

  const html = shell(`
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:300;color:${BRAND_COLOR};">Good morning, ${name.split(' ')[0]}</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#555;line-height:1.6;">Here's a fresh look at what's new on ${BRAND} today.</p>
    <div style="margin:0 0 24px;">${items}</div>
    <div style="text-align:center;margin-top:8px;">${btn('Browse Today\u2019s Picks', SITE_URL)}</div>
  `, `Fresh arrivals waiting for you on ${BRAND}.`);

  const text = `Good morning, ${name.split(' ')[0]}\n\nHere's what's new on ${BRAND} today:\n${products.map(p => `- ${p.name} — ₦${Number(p.price || 0).toLocaleString()}`).join('\n')}\n\nShop now: ${SITE_URL}${UNSUB_FOOTER_TEXT}`;

  return { subject, html, text };
}

function buyerEveningTemplate(name: string) {
  const first = name.split(' ')[0];
  const subject = `${first}, oya no dull yourself tonight 👀`;
  const html = shell(`
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:300;color:${BRAND_COLOR};">Evening don reach, ${first} 🌆</h1>
    <p style="margin:0 0 16px;font-size:14px;color:#555;line-height:1.7;">
      No let this evening pass you by o. We still get plenty affordable, quality items waiting for you —
      why you go sleep without checking wetin dey trend?
    </p>
    <p style="margin:0 0 20px;font-size:14px;color:#555;line-height:1.7;">
      Oya, go grab something for yourself before stock finish. Fast delivery, better price, no wahala.
    </p>
    <div style="text-align:center;margin-top:8px;">${btn('Shop Before You Sleep', SITE_URL)}</div>
  `, `${first}, still time to grab something good tonight.`);

  const text = `Evening don reach, ${first}\n\nNo let this evening pass you by — we still get plenty quality items waiting for you. Oya, go grab something before stock finish.\n\nShop now: ${SITE_URL}${UNSUB_FOOTER_TEXT}`;

  return { subject, html, text };
}

// Retailer presets — persona: Joshua Lawrence from OpticsView, addressing
// retailers who have zero verified sales so far. Rotates weekly by ISO week
// number so the same store doesn't see the same message every Saturday.
const RETAILER_PRESETS: ((first: string, slug: string) => { subject: string; body: string })[] = [
  (first, slug) => ({
    subject: `${first}, let's get your first sale`,
    body: `Hello, ${first}. I'm Joshua Lawrence from OpticsView.<br/><br/>
      I'm reaching out because I noticed your store hasn't recorded a sale yet — and I want to help change that.<br/><br/>
      <strong>Step one: get your custom domain.</strong> This is what sells your brand the most — customers trust
      "yourbrand.com" far more than a generic link. Visit your retailer dashboard, follow through, and purchase a
      fitting domain for your store today.`,
  }),
  (first) => ({
    subject: `${first}, is your store set up right?`,
    body: `Hello, ${first}. Joshua here again from OpticsView.<br/><br/>
      A lot of stores lose sales simply because the storefront doesn't look ready. If you're having any trouble
      with your hero section or finding your way around the dashboard, reach out to me directly and I'll personally
      help you get it set up the correct way.`,
  }),
  (first) => ({
    subject: `${first}, are you actually earning on every sale?`,
    body: `Hello, ${first}. It's Joshua from OpticsView.<br/><br/>
      Once your store is fully set up, the next step is making sure your markup is applied to every product you
      carry. Without it, you could be selling at cost and earning nothing. Head to your dashboard and confirm your
      pricing is set the way you want it.`,
  }),
  (first) => ({
    subject: `${first}, your store link needs an audience`,
    body: `Hello, ${first}. Joshua Lawrence here from OpticsView.<br/><br/>
      Your store won't sell itself — it needs eyes on it. Connect your store link to your social media accounts
      and start posting content that shows off what you carry. Share it with friends and family too; that first
      wave of support is often where the first sale comes from.`,
  }),
  (first) => ({
    subject: `${first}, here's what's possible`,
    body: `Hello, ${first}. Joshua from OpticsView again.<br/><br/>
      Some of our retailers started exactly where you are — zero sales, a fresh store, unsure where to begin.
      A number of them are now running consistent stores simply by following the basics: custom domain, a clean
      hero section, correct markup, and steady social sharing. It works. It just needs to be done.`,
  }),
  (first) => ({
    subject: `${first}, quick recap of what moves the needle`,
    body: `Hello, ${first}. Joshua here.<br/><br/>
      If you've been putting off the setup steps, here's the short version: custom domain first, then fix your
      hero section, then confirm your markup, then connect social media. In that order. Reply to this email if
      you get stuck on any of it — I'll walk you through it personally.`,
  }),
];

function isoWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function retailerWeeklyTemplate(name: string, slug: string) {
  const first = name.split(' ')[0];
  const preset = RETAILER_PRESETS[isoWeekNumber(new Date()) % RETAILER_PRESETS.length](first, slug);
  const html = shell(`
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:300;color:${BRAND_COLOR};">${preset.subject}</h1>
    <p style="margin:16px 0 20px;font-size:14px;color:#555;line-height:1.7;">${preset.body}</p>
    <div style="text-align:center;margin-top:8px;">${btn('Go to My Dashboard', `${SITE_URL}/retailer`)}</div>
    <p style="margin:20px 0 0;font-size:12px;color:#999;">Reach out anytime — I'm here to help you get this store moving.<br/>— Joshua Lawrence, OpticsView</p>
  `, preset.subject);

  const text = `${preset.subject}\n\n${preset.body.replace(/<br\/>/g, '\n').replace(/<[^>]+>/g, '')}\n\nDashboard: ${SITE_URL}/retailer\n\n— Joshua Lawrence, OpticsView${UNSUB_FOOTER_TEXT}`;

  return { subject: preset.subject, html, text };
}

// ── Sending ──────────────────────────────────────────────────────

async function alreadySentToday(type: string): Promise<boolean> {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const { count } = await supabase
    .from('email_logs')
    .select('id', { count: 'exact', head: true })
    .eq('type', type)
    .gte('created_at', startOfDay.toISOString());
  return (count ?? 0) > 0;
}

async function isCampaignEnabled(campaign: string): Promise<boolean> {
  const { data } = await supabase.from('app_settings').select('value').eq('key', 'email_type_controls').maybeSingle();
  const controls = data?.value ?? {};
  return controls[campaign] !== false; // default ON unless explicitly disabled
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { campaign } = await req.json();
    if (!['buyer_morning', 'buyer_evening', 'retailer_weekly'].includes(campaign)) {
      return new Response(JSON.stringify({ error: 'Unknown campaign' }), { status: 400, headers: corsHeaders });
    }

    if (!(await isCampaignEnabled(campaign))) {
      return new Response(JSON.stringify({ success: true, skipped: 'disabled_by_admin' }), { headers: corsHeaders });
    }
    if (await alreadySentToday(campaign)) {
      return new Response(JSON.stringify({ success: true, skipped: 'already_sent_today' }), { headers: corsHeaders });
    }

    let sentCount = 0;

    if (campaign === 'buyer_morning') {
      const [buyers, products] = await Promise.all([getBuyers(), getNewArrivals()]);
      const emails = buyers.map(b => {
        const t = buyerMorningTemplate(b.name, products);
        return { email: b.email, ...t };
      });
      sentCount = await sendBatchAndLog(emails, 'buyer_morning');
    } else if (campaign === 'buyer_evening') {
      const buyers = await getBuyers();
      const emails = buyers.map(b => {
        const t = buyerEveningTemplate(b.name);
        return { email: b.email, ...t };
      });
      sentCount = await sendBatchAndLog(emails, 'buyer_evening');
    } else if (campaign === 'retailer_weekly') {
      const retailers = await getRetailersWithNoSales();
      const emails = retailers.map(r => {
        const t = retailerWeeklyTemplate(r.name, r.slug);
        return { email: r.email, ...t };
      });
      sentCount = await sendBatchAndLog(emails, 'retailer_weekly');
    }

    return new Response(JSON.stringify({ success: true, campaign, sent: sentCount }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function sendBatchAndLog(
  recipients: { email: string; subject: string; html: string; text: string }[],
  logType: string
): Promise<number> {
  let sent = 0;
  for (let i = 0; i < recipients.length; i += 100) {
    const chunk = recipients.slice(i, i + 100);
    const payload = chunk.map(r => ({
      from: FROM,
      to: [r.email],
      subject: r.subject,
      html: r.html,
      text: r.text,
      headers: { 'List-Unsubscribe': '<mailto:support@opticsview.store?subject=unsubscribe>' },
    }));

    const res = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      sent += chunk.length;
      await supabase.from('email_logs').insert(
        chunk.map(c => ({ type: logType, to_email: c.email, status: 'sent' }))
      );
    } else {
      const errData = await res.json().catch(() => ({}));
      await supabase.from('email_logs').insert(
        chunk.map(c => ({ type: logType, to_email: c.email, status: 'failed', error: JSON.stringify(errData) }))
      );
    }
    await new Promise(r => setTimeout(r, 600));
  }
  return sent;
}
