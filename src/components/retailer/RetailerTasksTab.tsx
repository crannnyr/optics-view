import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Gift, Package, DollarSign, CheckCircle, Loader2 } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  target_quantity: number;
  reward_type: 'product' | 'cash' | 'both';
  reward_product_id?: string;
  reward_cash_amount?: number;
  reward_product?: any;
}

interface TaskProgress {
  id: string;
  task_id: string;
  current_progress: number;
  status: 'in_progress' | 'completed' | 'claiming' | 'sent' | 'received';
  delivery_address?: string;
  account_number?: string;
  bank_name?: string;
  admin_marked_sent: boolean;
  task?: Task;
}

export default function RetailerTasksTab({ profile }: { profile: any }) {
  const [taskProgress, setTaskProgress] = useState<TaskProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingTask, setClaimingTask] = useState<string | null>(null);
  const [claimForm, setClaimForm] = useState({
    delivery_address: '',
    account_number: '',
    bank_name: ''
  });

  useEffect(() => {
    if (profile) loadTasks();
    const interval = setInterval(() => { if (profile) loadTasks(false); }, 60000);
    return () => clearInterval(interval);
  }, [profile]);

  const loadTasks = async (showLoading = true) => {
    if (showLoading) setLoading(true);

    // 1. Get active tasks
    const { data: tasks } = await supabase
      .from('retailer_tasks')
      .select('*, reward_product:products!retailer_tasks_reward_product_id_fkey(*)')
      .eq('is_active', true);

    if (tasks) {
      // 2. Ensure progress records exist
      for (const task of tasks) {
        const { data: existing } = await supabase
          .from('retailer_task_progress')
          .select('id')
          .eq('retailer_id', profile.id)
          .eq('task_id', task.id)
          .single();

        if (!existing) {
          await supabase.from('retailer_task_progress').insert({
            retailer_id: profile.id,
            task_id: task.id,
            current_progress: 0,
            status: 'in_progress'
          });
        }
      }

      // 3. Load full progress
      const { data: progressData } = await supabase
        .from('retailer_task_progress')
        .select('*, task:retailer_tasks(*, reward_product:products!retailer_tasks_reward_product_id_fkey(*))')
        .eq('retailer_id', profile.id);

      if (progressData) {
        setTaskProgress(progressData as any);
      }
    }
    if (showLoading) setLoading(false);
  };

  const handleClaimReward = async (progressId: string) => {
    const progress = taskProgress.find(p => p.id === progressId);
    if (!progress || !progress.task) return;

    const needsAddress = progress.task.reward_type === 'product' || progress.task.reward_type === 'both';
    const needsBank = progress.task.reward_type === 'cash' || progress.task.reward_type === 'both';

    if (needsAddress && !claimForm.delivery_address) return alert('Please enter delivery address');
    if (needsBank && (!claimForm.account_number || !claimForm.bank_name)) return alert('Please enter bank details');

    const { error } = await supabase
      .from('retailer_task_progress')
      .update({
        status: 'claiming',
        delivery_address: needsAddress ? claimForm.delivery_address : null,
        account_number: needsBank ? claimForm.account_number : null,
        bank_name: needsBank ? claimForm.bank_name : null
      })
      .eq('id', progressId);

    if (!error) {
      setClaimingTask(null);
      setClaimForm({ delivery_address: '', account_number: '', bank_name: '' });
      loadTasks();
      alert('Claim submitted!');
    }
  };

  if (loading) return <div className="p-8 text-center text-xs tracking-widest text-gray-400">LOADING TASKS...</div>;

  return (
    <div className="space-y-6">
       {taskProgress.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-200 rounded">
            <Gift size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No tasks available yet</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {taskProgress.map((progress) => {
              if (!progress.task) return null;
              const task = progress.task;
              const percentage = Math.min((progress.current_progress / task.target_quantity) * 100, 100);
              const isCompleted = progress.status === 'completed';
              
              return (
                <div key={progress.id} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-[#0d2818]">{task.title}</h3>
                      <p className="text-sm text-gray-600">{task.description}</p>
                    </div>
                    {/* Status Badge */}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      progress.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      progress.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {progress.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{progress.current_progress} / {task.target_quantity}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Rewards */}
                  <div className="flex gap-2 mb-4">
                     {task.reward_product && (
                       <div className="flex items-center gap-1 bg-green-50 text-green-800 px-2 py-1 rounded text-xs">
                         <Package size={12}/> {task.reward_product.name}
                       </div>
                     )}
                     {task.reward_cash_amount && (
                       <div className="flex items-center gap-1 bg-blue-50 text-blue-800 px-2 py-1 rounded text-xs">
                         <DollarSign size={12}/> ₦{task.reward_cash_amount.toLocaleString()}
                       </div>
                     )}
                  </div>

                  {/* Claim Form Logic (Simplified for brevity, functionality remains) */}
                  {isCompleted && !claimingTask && progress.status === 'completed' && (
                    <button 
                      onClick={() => setClaimingTask(progress.id)}
                      className="w-full bg-green-600 text-white py-2 rounded text-sm hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                      <Gift size={16}/> Claim Reward
                    </button>
                  )}
                  
                  {isCompleted && claimingTask === progress.id && (
                    <div className="bg-gray-50 p-4 rounded space-y-3 border border-gray-200">
                      <p className="text-xs font-bold text-gray-500 uppercase">Enter Details to Claim</p>
                      {(task.reward_type !== 'cash') && (
                        <input 
                          placeholder="Delivery Address" 
                          className="w-full border p-2 text-sm rounded"
                          value={claimForm.delivery_address}
                          onChange={e => setClaimForm({...claimForm, delivery_address: e.target.value})}
                        />
                      )}
                      {(task.reward_type !== 'product') && (
                        <div className="grid grid-cols-2 gap-2">
                           <input placeholder="Bank Name" className="border p-2 text-sm rounded" value={claimForm.bank_name} onChange={e => setClaimForm({...claimForm, bank_name: e.target.value})} />
                           <input placeholder="Account Number" className="border p-2 text-sm rounded" value={claimForm.account_number} onChange={e => setClaimForm({...claimForm, account_number: e.target.value})} />
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => handleClaimReward(progress.id)} className="flex-1 bg-[#0d2818] text-white py-2 text-sm rounded">Submit</button>
                        <button onClick={() => setClaimingTask(null)} className="px-4 border bg-white rounded text-sm">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}