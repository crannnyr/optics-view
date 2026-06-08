const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface SendEmailParams {
  type: string;
  to_email: string;
  to_name?: string;
  data?: Record<string, any>;
  bypass_limit?: boolean;
}

export async function sendEmail({ type, to_email, to_name, data = {}, bypass_limit = false }: SendEmailParams) {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ type, to_email, to_name, data, bypass_limit }),
    });
    return await res.json();
  } catch (err) {
    console.error(`[sendEmail] Failed to send ${type} to ${to_email}:`, err);
    return { success: false };
  }
}
