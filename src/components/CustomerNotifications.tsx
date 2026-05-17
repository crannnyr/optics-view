import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Bell, CheckCircle, AlertTriangle, Info, XCircle, X, Loader2 } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  order_id: string | null;
  created_at: string;
}

interface Props {
  user: any;
  onViewOrder?: (orderId: string) => void;
}

const TYPE_STYLES: Record<string, { bg: string; icon: React.ReactNode }> = {
  success: { bg: 'bg-green-50 border-green-200', icon: <CheckCircle size={16} className="text-green-600 shrink-0" /> },
  warning: { bg: 'bg-amber-50 border-amber-200', icon: <AlertTriangle size={16} className="text-amber-600 shrink-0" /> },
  error:   { bg: 'bg-red-50 border-red-200',    icon: <XCircle size={16} className="text-red-600 shrink-0" /> },
  info:    { bg: 'bg-blue-50 border-blue-200',  icon: <Info size={16} className="text-blue-600 shrink-0" /> },
};

export default function CustomerNotifications({ user, onViewOrder }: Props) {
  const [open, setOpen]                   = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading]             = useState(false);

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, payload => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);
    if (data) setNotifications(data);
    setLoading(false);
  };

  const markAllRead = async () => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!user) return null;

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        onClick={() => { setOpen(!open); if (!open && unreadCount > 0) markAllRead(); }}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white border shadow-xl rounded-xl z-40 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <p className="text-sm font-semibold text-[#0d2818]">Notifications</p>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X size={14} />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={20} className="animate-spin text-gray-300" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Bell size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map(n => {
                    const style = TYPE_STYLES[n.type] ?? TYPE_STYLES.info;
                    return (
                      <div
                        key={n.id}
                        onClick={() => {
                          markRead(n.id);
                          if (n.order_id && onViewOrder) { onViewOrder(n.order_id); setOpen(false); }
                        }}
                        className={`p-4 flex items-start gap-3 cursor-pointer hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50/40' : ''}`}
                      >
                        {style.icon}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${!n.read ? 'text-[#0d2818]' : 'text-gray-700'}`}>{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {new Date(n.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="border-t px-4 py-2 text-center">
                <button onClick={markAllRead} className="text-xs text-gray-400 hover:text-[#0d2818] transition-colors">
                  Mark all as read
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}