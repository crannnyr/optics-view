import { useState, useEffect } from 'react';
import { MessageCircleQuestion, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { sendEmail } from '../../lib/email';

const CANNED_TEMPLATES = [
  {
    label: 'In stock, ships as usual',
    text: 'Thanks for asking — yes, this item is in stock and will ship on the usual timeline shown on the product page.',
  },
  {
    label: 'Check size/variant options',
    text: 'Great question — please check the size and color options on the product page; all available variants are listed there. If what you need isn\'t shown, it may not be available for this item.',
  },
  {
    label: 'Delivery timing',
    text: 'Import orders typically arrive within the timeframe shown on the product page. You can also check "Shipping calculation" on the product page for more detail.',
  },
];

export default function AdminProductQuestionsTab() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'answered'>('pending');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => { fetchQuestions(); }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('product_questions')
      .select('*, products(name, images, image_url)')
      .order('created_at', { ascending: false });
    setQuestions(data ?? []);
    setLoading(false);
  };

  const handleReply = async (question: any, answerText: string) => {
    if (!answerText.trim()) return;
    setSending(question.id);

    try {
      await supabase
        .from('product_questions')
        .update({ answer: answerText.trim(), status: 'answered', answered_at: new Date().toISOString() })
        .eq('id', question.id);

      await sendEmail({
        type: 'notification',
        to_email: question.customer_email,
        to_name: question.customer_name || 'there',
        data: {
          subject: `Answer to your question about ${question.products?.name || 'a product'}`,
          title: 'We answered your question',
          message: `You asked: "${question.question}"\n\nOur answer: ${answerText.trim()}`,
        },
      });

      await fetchQuestions();
      setReplyDrafts(prev => ({ ...prev, [question.id]: '' }));
    } catch (err) {
      console.error('Reply failed:', err);
      alert('Failed to send reply. Please try again.');
    } finally {
      setSending(null);
    }
  };

  const filtered = questions.filter(q => q.status === filter);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-light text-[#0d2818]">Product Questions</h2>

      <div className="flex gap-1.5">
        {(['pending', 'answered'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filter === f ? 'bg-[#0d2818] text-white border-[#0d2818]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            {f === 'pending' ? 'Pending' : 'Answered'} ({questions.filter(q => q.status === f).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-300" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-200 rounded bg-gray-50">
          <MessageCircleQuestion size={28} className="mx-auto mb-2 text-gray-300" />
          <p className="text-gray-400 text-xs italic">No {filter} questions.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(q => (
            <div key={q.id} className="bg-white border border-gray-200 rounded p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-100 rounded shrink-0 overflow-hidden">
                  {(q.products?.images?.[0] || q.products?.image_url) && (
                    <img src={q.products.images?.[0] || q.products.image_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400">{q.products?.name || 'Product'}</p>
                  <p className="text-sm font-medium text-gray-800">{q.customer_name || q.customer_email}</p>
                  <p className="text-[10px] text-gray-400">{new Date(q.created_at).toLocaleDateString('en-NG')}</p>
                </div>
                {q.status === 'answered' ? (
                  <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                ) : (
                  <Clock size={16} className="text-amber-500 shrink-0" />
                )}
              </div>

              <p className="text-sm text-gray-700 bg-gray-50 rounded p-3 mb-3">{q.question}</p>

              {q.status === 'answered' ? (
                <p className="text-sm text-gray-600 border-l-2 border-green-400 pl-3">{q.answer}</p>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {CANNED_TEMPLATES.map(t => (
                      <button
                        key={t.label}
                        onClick={() => setReplyDrafts(prev => ({ ...prev, [q.id]: t.text }))}
                        className="text-[10px] px-2 py-1 rounded-full border border-gray-200 text-gray-600 hover:border-gray-400"
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={replyDrafts[q.id] ?? ''}
                    onChange={e => setReplyDrafts(prev => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder="Write a reply or pick a template above…"
                    rows={3}
                    className="w-full border border-gray-200 p-2.5 text-sm rounded resize-none outline-none focus:border-gray-400"
                  />
                  <button
                    onClick={() => handleReply(q, replyDrafts[q.id] ?? '')}
                    disabled={sending === q.id || !(replyDrafts[q.id] ?? '').trim()}
                    className="px-4 py-2 text-xs bg-[#0d2818] text-white rounded hover:opacity-90 disabled:opacity-50"
                  >
                    {sending === q.id ? 'Sending…' : 'Send Reply'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
