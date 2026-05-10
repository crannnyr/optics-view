import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Gift, CheckCircle, Truck, MapPin, CreditCard, Loader2, User, Clock } from 'lucide-react';

export default function RewardClaimsTab() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    setLoading(true);
    // Fetch progress items where status is 'claiming' or 'sent'
    // We join with profiles (retailer info) and tasks (reward info)
    const { data, error } = await supabase
      .from('retailer_task_progress')
      .select(`
        *,
        profile:profiles(full_name, email, store_name, phone),
        task:retailer_tasks(title, reward_type, reward_cash_amount, reward_product_id),
        reward_product:products!retailer_task_progress_task_id_fkey(*)
      `)
      .in('status', ['claiming', 'sent']) // Show pending and recently sent
      .order('updated_at', { ascending: false });

    // Note: The join on 'reward_product' above is tricky via 'task'. 
    // Usually easier to rely on the task data we already fetched or do a second lookup.
    // For simplicity, we rely on the task's reward info.

    if (error) console.error('Error fetching claims:', error);
    setClaims(data || []);
    setLoading(false);
  };

  const markAsSent = async (id: string) => {
    setProcessingId(id);
    const { error } = await supabase
      .from('retailer_task_progress')
      .update({ 
        status: 'sent',
        admin_marked_sent: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (!error) {
      alert('Claim marked as SENT. The retailer has been notified.');
      fetchClaims();
    } else {
      alert('Error updating status');
    }
    setProcessingId(null);
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-light">Reward Claims</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage product shipments and cash transfers to retailers.
          </p>
        </div>
      </div>

      {claims.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded">
          <Gift size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No active claims found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {claims.map((claim) => {
            const isCash = claim.task?.reward_type === 'cash' || claim.task?.reward_type === 'both';
            const isProduct = claim.task?.reward_type === 'product' || claim.task?.reward_type === 'both';
            const isPending = claim.status === 'claiming';

            return (
              <div key={claim.id} className={`bg-white border p-6 rounded-lg shadow-sm ${isPending ? 'border-l-4 border-l-yellow-400' : 'border-l-4 border-l-green-500'}`}>
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  
                  {/* Retailer & Task Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                       {isPending ? (
                         <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-bold flex items-center gap-1">
                           <Clock size={12}/> PENDING ACTION
                         </span>
                       ) : (
                         <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-bold flex items-center gap-1">
                           <CheckCircle size={12}/> SENT
                         </span>
                       )}
                       <span className="text-xs text-gray-400">
                         {new Date(claim.updated_at).toLocaleDateString()}
                       </span>
                    </div>
                    
                    <h3 className="font-bold text-lg text-[#0d2818] mb-1">
                      {claim.task?.title}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                      <User size={14} /> 
                      <span className="font-medium">{claim.profile?.full_name}</span> 
                      <span className="opacity-50">({claim.profile?.store_name})</span>
                    </div>

                    {/* Claim Details Box */}
                    <div className="bg-gray-50 p-4 rounded border border-gray-200 space-y-3">
                      {/* Cash Details */}
                      {isCash && (
                        <div className="flex items-start gap-3">
                          <CreditCard className="text-blue-600 mt-1" size={18} />
                          <div>
                            <p className="text-xs font-bold text-gray-500 uppercase">Bank Details</p>
                            <p className="font-medium text-gray-900">{claim.bank_name}</p>
                            <p className="font-mono text-sm">{claim.account_number}</p>
                            <p className="text-blue-600 font-bold mt-1">Amount: ₦{claim.task?.reward_cash_amount?.toLocaleString()}</p>
                          </div>
                        </div>
                      )}

                      {isCash && isProduct && <div className="border-t border-gray-200 my-2"></div>}

                      {/* Product Details */}
                      {isProduct && (
                        <div className="flex items-start gap-3">
                          <MapPin className="text-orange-600 mt-1" size={18} />
                          <div>
                            <p className="text-xs font-bold text-gray-500 uppercase">Shipping Address</p>
                            <p className="text-sm text-gray-900 whitespace-pre-wrap">{claim.delivery_address}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col justify-center min-w-[200px]">
                    {isPending ? (
                      <button
                        onClick={() => markAsSent(claim.id)}
                        disabled={!!processingId}
                        className="w-full bg-[#0d2818] text-white py-3 rounded text-sm hover:opacity-90 flex items-center justify-center gap-2"
                      >
                        {processingId === claim.id ? (
                          <Loader2 className="animate-spin" size={16}/>
                        ) : (
                          <Truck size={16} />
                        )}
                        MARK AS SENT
                      </button>
                    ) : (
                      <div className="text-center p-4 bg-green-50 rounded border border-green-100">
                        <p className="text-green-700 text-sm font-medium flex items-center justify-center gap-2">
                          <CheckCircle size={16} /> Fulfillment Recorded
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}