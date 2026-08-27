import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const FROM = 'OPTICSVIEW <support@opticsview.store>';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const bypassLimit = body.bypass_limit === true;

    // Get daily limit
    const { data: settingsRow } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'email_settings')
      .single();

    const settings = settingsRow?.value || { daily_limit: 95 };
    const dailyLimit = settings.daily_limit;

    const today = new Date().toISOString().split('T')[0];

    // Count already sent today
    const { count: sentToday } = await supabase
      .from('email_logs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'sent')
      .gte('created_at', `${today}T00:00:00Z`);

    const alreadySent = sentToday || 0;
    const remaining = bypassLimit ? 99999 : dailyLimit - alreadySent;

    if (remaining <= 0) {
      return new Response(
        JSON.stringify({ message: 'Daily limit already reached', sent: 0 }),
        { status: 200 }
      );
    }

    // Get pending emails scheduled for today or earlier
    const { data: pendingEmails } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', today)
      .order('created_at', { ascending: true })
      .limit(remaining);

    if (!pendingEmails || pendingEmails.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending emails', sent: 0 }),
        { status: 200 }
      );
    }

    // Badge 4: admin can stop any email type. Types that are stopped are
    // left untouched in the queue (still 'pending') rather than failed, so
    // they resume automatically once admin re-enables the type.
    const { data: controlsRow } = await supabase
      .from('app_settings').select('value').eq('key', 'email_type_controls').maybeSingle();
    const controls = controlsRow?.value ?? {};
    const emailsToProcess = pendingEmails.filter(e => controls[e.type] !== false);
    const skippedStopped = pendingEmails.length - emailsToProcess.length;

    let sent = 0;
    let failed = 0;

    for (const email of emailsToProcess) {
      try {
        await supabase
          .from('email_queue')
          .update({ attempts: email.attempts + 1 })
          .eq('id', email.id);

        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: FROM,
            to: [email.to_email],
            subject: email.subject,
            html: email.html,
          }),
        });

        const resendData = await resendRes.json();

        if (resendRes.ok) {
          await supabase.from('email_queue').update({
            status: 'sent',
            sent_at: new Date().toISOString(),
          }).eq('id', email.id);

          await supabase.from('email_logs').insert({
            queue_id: email.id,
            type: email.type,
            to_email: email.to_email,
            status: 'sent',
            resend_id: resendData.id,
          });

          sent++;
        } else {
          const newAttempts = email.attempts + 1;
          await supabase.from('email_queue').update({
            status: newAttempts >= 3 ? 'failed' : 'pending',
          }).eq('id', email.id);

          await supabase.from('email_logs').insert({
            queue_id: email.id,
            type: email.type,
            to_email: email.to_email,
            status: 'failed',
            error: JSON.stringify(resendData),
          });

          failed++;
        }
      } catch (err: any) {
        console.error(`Failed to send email ${email.id}:`, err);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent, failed, skipped_stopped: skippedStopped, bypass: bypassLimit }),
      { status: 200 }
    );

  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
