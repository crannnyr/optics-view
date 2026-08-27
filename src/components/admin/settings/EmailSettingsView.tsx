import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  Mail, Send, Clock, CheckCircle, XCircle, Loader2,
  ChevronUp, ChevronDown, Zap, Settings, RefreshCw
} from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

type QueueTab = 'queue' | 'sent' | 'failed' | 'types';

const EMAIL_TYPE_LABELS: Record<string, string> = {
  welcome:              'Welcome',
  password_reset:       'Password Reset',
  order_placed:         'Order Placed',
  notification:         'Notification',
  order_confirmation:   'Order Confirmation',
  order_shipped:        'Order Shipped',
  order_shipped_tracking: 'Order Shipped (Tracking)',
  order_delivered:      'Order Delivered',
  order_status_update:  'Order Status Update',
  new_order_alert:      'New Order Alert',
  payment_nudge:        'Payment Nudge',
  retailer_application: 'Retailer Application',
  retailer_activated:   'Retailer Activated',
  retailer_rejected:    'Retailer Rejected',
  commission_credited:  'Commission Credited',
  referral_commission:  'Referral Commission',
  withdrawal_processed: 'Withdrawal Processed',
  withdrawal_requested: 'Withdrawal Requested',
  new_product:          'New Product Drop',
  buyer_morning:        'Buyer — Morning Broadcast',
  buyer_evening:        'Buyer — Evening Broadcast',
  retailer_weekly:      'Retailer — Weekly (No Sales)',
};

export default function EmailSettingsView() {
  const [activeTab, setActiveTab] = useState<QueueTab>('queue');
  const [queuedEmails, setQueuedEmails] = useState<any[]>([]);
  const [sentEmails, setSentEmails] = useState<any[]>([]);
  const [failedEmails, setFailedEmails] = useState<any[]>([]);
  const [dailyLimit, setDailyLimit] = useState(95);
  const [newLimit, setNewLimit] = useState('');
  const [todayCount, setTodayCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingLimit, setSavingLimit] = useState(false);
  const [sendingAll, setSendingAll] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [typeControls, setTypeControls] = useState<Record<string, boolean>>({});
  const [togglingType, setTogglingType] = useState<string | null>(null);
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [typeLastSent, setTypeLastSent] = useState<Record<string, any[]>>({});
  const [loadingTypeLogs, setLoadingTypeLogs] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchSettings(), fetchQueue(), fetchLogs()]);
    setLoading(false);
  };

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'email_settings')
      .single();
    if (data?.value?.daily_limit) {
      setDailyLimit(data.value.daily_limit);
      setNewLimit(String(data.value.daily_limit));
    }

    const { data: controlsRow } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'email_type_controls')
      .maybeSingle();
    setTypeControls(controlsRow?.value || {});
  };

  const fetchQueue = async () => {
    const { data } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    if (data) setQueuedEmails(data);
  };

  const fetchLogs = async () => {
    const today = new Date().toISOString().split('T')[0];

    // Today's sent count
    const { count } = await supabase
      .from('email_logs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'sent')
      .gte('created_at', `${today}T00:00:00Z`);
    setTodayCount(count || 0);

    // Sent logs
    const { data: sent } = await supabase
      .from('email_logs')
      .select('*')
      .eq('status', 'sent')
      .order('created_at', { ascending: false })
      .limit(100);
    if (sent) setSentEmails(sent);

    // Failed logs
    const { data: failed } = await supabase
      .from('email_logs')
      .select('*')
      .eq('status', 'failed')
      .order('created_at', { ascending: false })
      .limit(50);
    if (failed) setFailedEmails(failed);
  };

  const saveLimit = async () => {
    const val = parseInt(newLimit);
    if (isNaN(val) || val < 1) return;
    setSavingLimit(true);

    const { data: existing } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'email_settings')
      .single();

    await supabase
      .from('app_settings')
      .update({ value: { ...(existing?.value || {}), daily_limit: val } })
      .eq('key', 'email_settings');

    setDailyLimit(val);
    setSavingLimit(false);
  };

  const sendAll = async () => {
    if (!confirm(`Send all ${queuedEmails.length} queued emails now? This bypasses the daily limit.`)) return;
    setSendingAll(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`${SUPABASE_URL}/functions/v1/process-email-queue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ bypass_limit: true }),
      });
      await fetchAll();
    } catch (err) {
      console.error('Send all error:', err);
      alert('Failed to process queue. Please try again.');
    }
    setSendingAll(false);
  };

  const cancelEmail = async (id: string) => {
    setProcessingId(id);
    await supabase.from('email_queue').update({ status: 'cancelled' }).eq('id', id);
    await fetchQueue();
    setProcessingId(null);
  };

  const retryEmail = async (email: any) => {
    setProcessingId(email.id);
    // Re-queue as pending scheduled for today
    await supabase
      .from('email_queue')
      .update({ status: 'pending', scheduled_for: new Date().toISOString().split('T')[0], attempts: 0 })
      .eq('id', email.queue_id);
    await fetchAll();
    setProcessingId(null);
  };

  const toggleEmailType = async (type: string) => {
    const nextValue = typeControls[type] === false ? true : false;
    setTogglingType(type);

    // Optimistic update
    setTypeControls(prev => ({ ...prev, [type]: nextValue }));

    const { data: existing } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'email_type_controls')
      .maybeSingle();

    const { error } = await supabase
      .from('app_settings')
      .update({ value: { ...(existing?.value || {}), [type]: nextValue } })
      .eq('key', 'email_type_controls');

    if (error) {
      // Roll back on failure
      setTypeControls(prev => ({ ...prev, [type]: !nextValue }));
    }
    setTogglingType(null);
  };

  const toggleExpandType = async (type: string) => {
    if (expandedType === type) {
      setExpandedType(null);
      return;
    }
    setExpandedType(type);
    if (!typeLastSent[type]) {
      setLoadingTypeLogs(type);
      const { data } = await supabase
        .from('email_logs')
        .select('*')
        .eq('type', type)
        .order('created_at', { ascending: false })
        .limit(50);
      setTypeLastSent(prev => ({ ...prev, [type]: data || [] }));
      setLoadingTypeLogs(null);
    }
  };

  const usagePercent = Math.min(100, Math.round((todayCount / dailyLimit) * 100));
  const usageColor = usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-orange-400' : 'bg-[#0d2818]';

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">

      {/* ── Stats Row ─────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Sent Today',   value: todayCount,            icon: <Send size={16} />,        color: 'text-[#0d2818]' },
          { label: 'Daily Limit',  value: dailyLimit,            icon: <Settings size={16} />,    color: 'text-gray-600' },
          { label: 'Queued',       value: queuedEmails.length,   icon: <Clock size={16} />,       color: 'text-orange-500' },
          { label: 'Failed',       value: failedEmails.length,   icon: <XCircle size={16} />,     color: 'text-red-500' },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className={`flex items-center gap-2 mb-1 ${stat.color}`}>
              {stat.icon}
              <span className="text-[10px] uppercase tracking-wider text-gray-400">{stat.label}</span>
            </div>
            <p className={`text-2xl font-light ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── Usage Bar ─────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs uppercase tracking-wider text-gray-400">Today's Usage</p>
          <p className="text-xs font-medium text-gray-600">{todayCount} / {dailyLimit} sent ({usagePercent}%)</p>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${usageColor}`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        {usagePercent >= 90 && (
          <p className="text-xs text-red-500 mt-2">⚠️ Approaching daily limit — new emails will be queued for tomorrow.</p>
        )}
      </div>

      {/* ── Daily Limit Control ───────────────────── */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <p className="text-xs uppercase tracking-wider text-gray-400 mb-4">Daily Send Limit</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setNewLimit(String(Math.max(1, parseInt(newLimit || '0') - 5)))}
            className="p-2 border border-gray-200 rounded hover:bg-gray-50"
          >
            <ChevronDown size={16} />
          </button>
          <input
            type="number"
            value={newLimit}
            onChange={e => setNewLimit(e.target.value)}
            className="w-24 border border-gray-200 rounded p-2 text-center text-sm font-medium outline-none focus:border-[#0d2818]"
            min={1}
          />
          <button
            onClick={() => setNewLimit(String(parseInt(newLimit || '0') + 5))}
            className="p-2 border border-gray-200 rounded hover:bg-gray-50"
          >
            <ChevronUp size={16} />
          </button>
          <button
            onClick={saveLimit}
            disabled={savingLimit || parseInt(newLimit) === dailyLimit}
            className="px-4 py-2 bg-[#0d2818] text-white text-xs tracking-widest rounded hover:opacity-90 disabled:opacity-40 flex items-center gap-2"
          >
            {savingLimit ? <Loader2 size={12} className="animate-spin" /> : null}
            SAVE
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Emails exceeding this limit are automatically queued for the next day. Increase this when you upgrade to Resend Pro.
        </p>
      </div>

      {/* ── Queue / Sent / Failed Tabs ────────────── */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">

        {/* Tab Header */}
        <div className="flex border-b border-gray-200">
          {([
            { key: 'queue',  label: `Queue (${queuedEmails.length})`,  icon: <Clock size={14} /> },
            { key: 'sent',   label: `Sent (${sentEmails.length})`,     icon: <CheckCircle size={14} /> },
            { key: 'failed', label: `Failed (${failedEmails.length})`, icon: <XCircle size={14} /> },
            { key: 'types',  label: 'By Type',                         icon: <Settings size={14} /> },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-wider transition-colors ${
                activeTab === tab.key
                  ? 'border-b-2 border-[#0d2818] text-[#0d2818] font-bold'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 pr-4">
            <button
              onClick={fetchAll}
              className="p-2 text-gray-400 hover:text-[#0d2818] transition-colors"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
            {activeTab === 'queue' && queuedEmails.length > 0 && (
              <button
                onClick={sendAll}
                disabled={sendingAll}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0d2818] text-white text-[10px] tracking-widest rounded hover:opacity-90 disabled:opacity-50"
              >
                {sendingAll
                  ? <Loader2 size={11} className="animate-spin" />
                  : <Zap size={11} />
                }
                SEND ALL
              </button>
            )}
          </div>
        </div>

        {/* Queue Tab */}
        {activeTab === 'queue' && (
          <div>
            {queuedEmails.length === 0 ? (
              <div className="text-center py-12">
                <Clock size={28} className="mx-auto text-gray-200 mb-3" />
                <p className="text-xs text-gray-400">No emails in queue</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {queuedEmails.map(email => (
                  <div key={email.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] bg-orange-50 text-orange-600 border border-orange-100 px-2 py-0.5 rounded">
                          {EMAIL_TYPE_LABELS[email.type] || email.type}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          Scheduled: {email.scheduled_for}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 truncate">{email.to_email}</p>
                      <p className="text-[10px] text-gray-400 truncate">{email.subject}</p>
                    </div>
                    <button
                      onClick={() => cancelEmail(email.id)}
                      disabled={processingId === email.id}
                      className="ml-4 text-[10px] text-red-400 hover:text-red-600 border border-red-100 px-2 py-1 rounded hover:bg-red-50"
                    >
                      {processingId === email.id ? <Loader2 size={10} className="animate-spin" /> : 'Cancel'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sent Tab */}
        {activeTab === 'sent' && (
          <div>
            {sentEmails.length === 0 ? (
              <div className="text-center py-12">
                <Mail size={28} className="mx-auto text-gray-200 mb-3" />
                <p className="text-xs text-gray-400">No sent emails yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {sentEmails.map(email => (
                  <div key={email.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
                    <CheckCircle size={14} className="text-green-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded">
                          {EMAIL_TYPE_LABELS[email.type] || email.type}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 truncate">{email.to_email}</p>
                    </div>
                    <p className="text-[10px] text-gray-400 shrink-0">{formatDate(email.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Failed Tab */}
        {activeTab === 'failed' && (
          <div>
            {failedEmails.length === 0 ? (
              <div className="text-center py-12">
                <XCircle size={28} className="mx-auto text-gray-200 mb-3" />
                <p className="text-xs text-gray-400">No failed emails</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {failedEmails.map(email => (
                  <div key={email.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
                    <XCircle size={14} className="text-red-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded">
                          {EMAIL_TYPE_LABELS[email.type] || email.type}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 truncate">{email.to_email}</p>
                      <p className="text-[10px] text-red-400 truncate">{email.error}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <p className="text-[10px] text-gray-400">{formatDate(email.created_at)}</p>
                      {email.queue_id && (
                        <button
                          onClick={() => retryEmail(email)}
                          disabled={processingId === email.id}
                          className="text-[10px] text-[#0d2818] border border-[#0d2818]/20 px-2 py-1 rounded hover:bg-[#0d2818]/5"
                        >
                          {processingId === email.id ? <Loader2 size={10} className="animate-spin" /> : 'Retry'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* By Type Tab — every email category, individually stoppable, with
            last 50 sent visible per type */}
        {activeTab === 'types' && (
          <div className="divide-y divide-gray-50">
            {Object.entries(EMAIL_TYPE_LABELS).map(([type, label]) => {
              const isStopped = typeControls[type] === false;
              const isExpanded = expandedType === type;
              return (
                <div key={type}>
                  <div className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                    <button
                      onClick={() => toggleExpandType(type)}
                      className="flex items-center gap-2 flex-1 min-w-0 text-left"
                    >
                      {isExpanded ? <ChevronUp size={14} className="text-gray-400 shrink-0" /> : <ChevronDown size={14} className="text-gray-400 shrink-0" />}
                      <span className="text-xs font-medium text-gray-700 truncate">{label}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0 ${
                        isStopped ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'
                      }`}>
                        {isStopped ? 'Stopped' : 'Active'}
                      </span>
                    </button>
                    <button
                      onClick={() => toggleEmailType(type)}
                      disabled={togglingType === type}
                      className={`ml-4 shrink-0 text-[10px] px-3 py-1.5 rounded border tracking-widest uppercase disabled:opacity-50 ${
                        isStopped
                          ? 'border-[#0d2818]/20 text-[#0d2818] hover:bg-[#0d2818]/5'
                          : 'border-red-200 text-red-500 hover:bg-red-50'
                      }`}
                    >
                      {togglingType === type
                        ? <Loader2 size={11} className="animate-spin" />
                        : isStopped ? 'Resume' : 'Stop'
                      }
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="bg-gray-50/50 px-5 py-3 border-t border-gray-100">
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">Last 50 sent</p>
                      {loadingTypeLogs === type ? (
                        <div className="flex justify-center py-6">
                          <Loader2 size={16} className="animate-spin text-gray-300" />
                        </div>
                      ) : (typeLastSent[type]?.length ?? 0) === 0 ? (
                        <p className="text-xs text-gray-400 py-3">No emails of this type have been sent yet.</p>
                      ) : (
                        <div className="space-y-1 max-h-64 overflow-y-auto">
                          {typeLastSent[type].map(log => (
                            <div key={log.id} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-100 last:border-0">
                              <div className="flex items-center gap-2 min-w-0">
                                {log.status === 'sent'
                                  ? <CheckCircle size={11} className="text-green-500 shrink-0" />
                                  : <XCircle size={11} className="text-red-400 shrink-0" />
                                }
                                <span className="text-gray-600 truncate">{log.to_email}</span>
                              </div>
                              <span className="text-[10px] text-gray-400 shrink-0 ml-3">{formatDate(log.created_at)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
