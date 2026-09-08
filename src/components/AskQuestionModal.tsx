import { useState, useEffect } from 'react';
import { X, HelpCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AskQuestionModalProps {
  productId: string;
  productName: string;
  themeColor: string;
  onClose: () => void;
}

export default function AskQuestionModal({ productId, productName, themeColor, onClose }: AskQuestionModalProps) {
  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pastQuestions, setPastQuestions] = useState<any[]>([]);
  const [loadingPast, setLoadingPast] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoadingPast(false); return; }
      const { data } = await supabase
        .from('product_questions')
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setPastQuestions(data ?? []);
      setLoadingPast(false);
    };
    load();
  }, [productId]);

  const handleSubmit = async () => {
    if (!question.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please sign in to ask a question.');
        setSubmitting(false);
        return;
      }

      const { error: insertError } = await supabase.from('product_questions').insert({
        product_id: productId,
        user_id: user.id,
        customer_name: user.user_metadata?.full_name || null,
        customer_email: user.email,
        question: question.trim(),
      });

      if (insertError) throw insertError;
      setSubmitted(true);
      setQuestion('');
    } catch (err) {
      console.error('Question submit failed:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <HelpCircle size={18} style={{ color: themeColor }} /> Ask about this product
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="px-6 pb-6">
          <p className="text-xs text-gray-500 mb-4 line-clamp-1">{productName}</p>

          {submitted ? (
            <div className="text-center py-8">
              <CheckCircle2 size={32} className="mx-auto mb-3 text-green-500" />
              <p className="text-sm font-medium text-gray-800 mb-1">Question sent</p>
              <p className="text-xs text-gray-500">We'll email you the answer as soon as we reply.</p>
            </div>
          ) : (
            <>
              <textarea
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="e.g. Does this come in a bigger size? How long does delivery take?"
                rows={4}
                className="w-full border border-gray-200 p-3 text-sm rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-gray-400 resize-none"
              />
              {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
              <button
                onClick={handleSubmit}
                disabled={submitting || !question.trim()}
                className="w-full text-white py-3 text-sm font-medium rounded-full mt-3 hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: themeColor }}
              >
                {submitting ? 'Sending…' : 'Send Question'}
              </button>
            </>
          )}

          {!loadingPast && pastQuestions.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100 space-y-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Your questions</p>
              {pastQuestions.map(q => (
                <div key={q.id} className="text-sm">
                  <p className="text-gray-800">{q.question}</p>
                  {q.status === 'answered' ? (
                    <p className="text-gray-500 mt-1 pl-3 border-l-2" style={{ borderColor: themeColor }}>{q.answer}</p>
                  ) : (
                    <p className="text-xs text-amber-600 mt-1">Awaiting reply</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
