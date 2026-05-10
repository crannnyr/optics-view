import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Package, DollarSign, CheckCircle, X, ShoppingBag, AlertCircle, RefreshCw } from 'lucide-react';

interface TaskRequirement {
  id?: string;
  product_id: string;
  required_quantity: number;
  product?: { name: string };
}

interface Task {
  id: string;
  title: string;
  description: string;
  reward_type: 'product' | 'cash' | 'both';
  reward_product_id?: string;
  reward_cash_amount?: number;
  is_active: boolean;
  created_at: string;
  reward_product?: any;
  requirements?: TaskRequirement[];
}

interface TaskProgress {
  id: string;
  retailer_id: string;
  task_id: string;
  current_progress: number;
  status: string;
  delivery_address?: string;
  account_number?: string;
  bank_name?: string;
  admin_marked_sent: boolean;
  retailer?: any;
  task?: Task;
}

export default function AdminTasksTab() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pendingClaims, setPendingClaims] = useState<TaskProgress[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [autoDescription, setAutoDescription] = useState(true); // Toggle to allow manual override
  const [requirements, setRequirements] = useState<{ product_id: string; required_quantity: number }[]>([
    { product_id: '', required_quantity: 1 }
  ]);
  
  const [rewardType, setRewardType] = useState<'product' | 'cash' | 'both'>('product');
  const [rewardProductId, setRewardProductId] = useState('');
  const [rewardCashAmount, setRewardCashAmount] = useState(0);

  useEffect(() => {
    loadTasks();
    loadProducts();
    loadPendingClaims();
  }, []);

  // --- Auto-Generate Description Effect ---
  useEffect(() => {
    if (autoDescription && requirements.length > 0) {
      const parts = requirements
        .filter(req => req.product_id && req.required_quantity > 0)
        .map(req => {
          const prod = products.find(p => p.id === req.product_id);
          return prod ? `Sell ${req.required_quantity} of ${prod.name}` : '';
        })
        .filter(Boolean);

      if (parts.length > 0) {
        // Join with "and" for the last item, commas for others
        const desc = parts.length === 1 
          ? parts[0] 
          : parts.slice(0, -1).join(', ') + ' and ' + parts.slice(-1);
        setDescription(desc);
      }
    }
  }, [requirements, products, autoDescription]);

  const loadTasks = async () => {
    // Select tasks and join the requirements table
    const { data } = await supabase
      .from('retailer_tasks')
      .select(`
        *, 
        reward_product:products!retailer_tasks_reward_product_id_fkey(*),
        requirements:retailer_task_requirements(*, product:products(name))
      `)
      .order('created_at', { ascending: false });
    
    if (data) setTasks(data as any);
  };

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, price, image_url')
      .order('name');
    
    if (data) setProducts(data);
  };

  const loadPendingClaims = async () => {
    const { data } = await supabase
      .from('retailer_task_progress')
      .select(`
        *,
        retailer:profiles!retailer_task_progress_retailer_id_fkey(id, full_name, email, store_name),
        task:retailer_tasks(*, reward_product:products!retailer_tasks_reward_product_id_fkey(*))
      `)
      .eq('status', 'claiming')
      .order('completed_at', { ascending: true });
    
    if (data) setPendingClaims(data as any);
  };

  const handleAddRequirement = () => {
    setRequirements([...requirements, { product_id: '', required_quantity: 1 }]);
  };

  const handleRemoveRequirement = (index: number) => {
    const newReqs = requirements.filter((_, i) => i !== index);
    setRequirements(newReqs);
  };

  const updateRequirement = (index: number, field: string, value: any) => {
    const newReqs = [...requirements];
    newReqs[index] = { ...newReqs[index], [field]: value };
    setRequirements(newReqs);
  };

  const handleSubmit = async () => {
    // 1. Validation
    if (!title) return alert("Task title is required");
    if (requirements.some(r => !r.product_id || r.required_quantity < 1)) {
      return alert("Please ensure all product requirements are valid.");
    }

    // 2. Prepare Task Payload
    const taskPayload: any = {
      title,
      description,
      reward_type: rewardType,
      is_active: true,
      // Legacy columns (we set generic values just in case, but rely on requirements table)
      target_quantity: requirements.reduce((sum, r) => sum + r.required_quantity, 0),
      task_type: 'sales_target' 
    };

    if (rewardType === 'product' || rewardType === 'both') {
      taskPayload.reward_product_id = rewardProductId || null;
    }
    if (rewardType === 'cash' || rewardType === 'both') {
      taskPayload.reward_cash_amount = rewardCashAmount;
    }

    try {
      let taskId = editingTask?.id;

      if (editingTask) {
        // Update Task Details
        await supabase
          .from('retailer_tasks')
          .update(taskPayload)
          .eq('id', taskId);
        
        // Update Requirements: Simplest strategy is Delete All & Re-insert
        await supabase.from('retailer_task_requirements').delete().eq('task_id', taskId);
      } else {
        // Insert New Task
        const { data: newTask, error } = await supabase
          .from('retailer_tasks')
          .insert([taskPayload])
          .select()
          .single();
        
        if (error) throw error;
        taskId = newTask.id;
      }

      // 3. Insert Requirements
      const requirementsPayload = requirements.map(req => ({
        task_id: taskId,
        product_id: req.product_id,
        required_quantity: req.required_quantity
      }));

      const { error: reqError } = await supabase
        .from('retailer_task_requirements')
        .insert(requirementsPayload);

      if (reqError) throw reqError;

      resetForm();
      loadTasks();
      alert(editingTask ? "Task updated successfully" : "Task created successfully");

    } catch (error: any) {
      console.error(error);
      alert('Error saving task: ' + error.message);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setRewardType(task.reward_type);
    setRewardProductId(task.reward_product_id || '');
    setRewardCashAmount(task.reward_cash_amount || 0);
    
    // Load requirements into form
    if (task.requirements && task.requirements.length > 0) {
      setRequirements(task.requirements.map(r => ({
        product_id: r.product_id,
        required_quantity: r.required_quantity
      })));
    } else {
      setRequirements([{ product_id: '', required_quantity: 1 }]);
    }

    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this task? All retailer progress will be removed.')) {
      await supabase.from('retailer_tasks').delete().eq('id', id);
      loadTasks();
    }
  };

  const handleMarkAsSent = async (progressId: string) => {
    const { error } = await supabase
      .from('retailer_task_progress')
      .update({
        status: 'sent',
        admin_marked_sent: true
      })
      .eq('id', progressId);
    
    if (error) {
      alert("Error updating status");
    } else {
      loadPendingClaims();
      alert('Marked as sent! Retailer will be notified.');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAutoDescription(true);
    setRequirements([{ product_id: '', required_quantity: 1 }]);
    setRewardType('product');
    setRewardProductId('');
    setRewardCashAmount(0);
    setEditingTask(null);
    setIsModalOpen(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xl font-light">Task Management</h2>
          <p className="text-sm text-gray-500 mt-1">Create sales goals and assign rewards</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#0d2818] text-white px-4 py-2 text-xs tracking-widest hover:bg-opacity-90 flex items-center gap-2"
        >
          <Plus size={16} />
          NEW TASK
        </button>
      </div>

      {/* PENDING CLAIMS SECTION */}
      {pendingClaims.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-[#0d2818] mb-4 flex items-center gap-2">
            <AlertCircle className="text-yellow-600" size={20} />
            Pending Reward Claims
          </h3>
          <div className="space-y-4">
            {pendingClaims.map((claim) => (
              <div key={claim.id} className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg shadow-sm">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1">
                     <div className="flex justify-between items-start mb-2">
                        <div>
                           <p className="font-bold text-[#0d2818]">{claim.retailer?.store_name}</p>
                           <p className="text-xs text-gray-600">{claim.retailer?.full_name} • {claim.retailer?.email}</p>
                        </div>
                        <span className="px-2 py-1 bg-yellow-200 text-yellow-900 text-[10px] uppercase font-bold rounded">
                          Action Required
                        </span>
                     </div>
                     
                     <div className="bg-white p-3 rounded border border-yellow-100 text-sm">
                        <p className="font-medium mb-2">Task: {claim.task?.title}</p>
                        
                        {/* Delivery Info */}
                        {claim.delivery_address && (
                          <div className="mb-2">
                            <span className="text-xs font-bold text-gray-500 uppercase block">Delivery Address</span>
                            <span className="text-gray-800">{claim.delivery_address}</span>
                          </div>
                        )}
                        
                        {/* Bank Info */}
                        {claim.bank_name && (
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-xs font-bold text-gray-500 uppercase block">Bank Name</span>
                                <span className="text-gray-800">{claim.bank_name}</span>
                              </div>
                              <div>
                                <span className="text-xs font-bold text-gray-500 uppercase block">Account Number</span>
                                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{claim.account_number}</span>
                              </div>
                           </div>
                        )}
                     </div>
                  </div>

                  <div className="md:w-48 flex flex-col gap-2 justify-center border-l border-yellow-200 pl-4">
                     <div className="text-center mb-2">
                        <span className="text-xs text-gray-500 uppercase">Reward Due</span>
                        {claim.task?.reward_type === 'cash' && (
                           <p className="font-bold text-lg text-green-700">₦{claim.task.reward_cash_amount?.toLocaleString()}</p>
                        )}
                        {claim.task?.reward_type === 'product' && (
                           <p className="font-bold text-sm text-green-700">{claim.task.reward_product?.name}</p>
                        )}
                     </div>
                     <button
                       onClick={() => handleMarkAsSent(claim.id)}
                       className="bg-green-600 text-white py-2 text-xs font-bold rounded hover:bg-green-700 flex items-center justify-center gap-2"
                     >
                       <CheckCircle size={14} /> MARK SENT
                     </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TASK LIST */}
      <div className="space-y-4">
        {tasks.map((task) => (
          <div key={task.id} className="bg-white border border-gray-200 p-6 rounded-lg hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-[#0d2818] mb-1">{task.title}</h3>
                
                {/* Requirements Badge Area */}
                <div className="flex flex-wrap gap-2 mb-3">
                   {task.requirements && task.requirements.map(req => (
                     <div key={req.id} className="flex items-center gap-1 bg-blue-50 border border-blue-100 px-2 py-1 rounded text-xs text-blue-800">
                        <ShoppingBag size={10} />
                        <span className="font-bold">{req.required_quantity}x</span> {req.product?.name}
                     </div>
                   ))}
                </div>

                {task.description && (
                  <p className="text-sm text-gray-500 italic">"{task.description}"</p>
                )}
              </div>

              {/* Reward Badge */}
              <div className="flex flex-col items-end gap-2">
                {(task.reward_type === 'product' || task.reward_type === 'both') && task.reward_product && (
                  <span className="px-3 py-1 bg-green-50 text-green-800 border border-green-100 rounded text-xs font-medium flex items-center gap-1">
                    <Package size={12} />
                    {task.reward_product.name}
                  </span>
                )}
                {(task.reward_type === 'cash' || task.reward_type === 'both') && task.reward_cash_amount && (
                  <span className="px-3 py-1 bg-purple-50 text-purple-800 border border-purple-100 rounded text-xs font-medium flex items-center gap-1">
                    <DollarSign size={12} />
                    ₦{task.reward_cash_amount.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2 border-t pt-3">
              <button
                onClick={() => handleEdit(task)}
                className="flex items-center gap-1 px-3 py-1.5 hover:bg-gray-100 rounded text-xs text-gray-600 transition-colors"
              >
                <Edit2 size={14} /> Edit Task
              </button>
              <button
                onClick={() => handleDelete(task.id)}
                className="flex items-center gap-1 px-3 py-1.5 hover:bg-red-50 text-red-600 rounded text-xs transition-colors ml-auto"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="text-center py-20 bg-white border border-gray-200 rounded-lg border-dashed">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No tasks created yet</p>
            <p className="text-xs text-gray-400 mt-1">Create a task to incentivize your retailers.</p>
          </div>
        )}
      </div>

      {/* CREATE/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-light text-[#0d2818]">
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-black">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-8">
              
              {/* 1. Requirements Section */}
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold uppercase text-gray-500">Sales Requirements</h3>
                    <button onClick={handleAddRequirement} className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium">
                       <Plus size={14}/> Add Product
                    </button>
                 </div>
                 
                 <div className="space-y-3">
                    {requirements.map((req, index) => (
                       <div key={index} className="flex gap-3 items-start">
                          <div className="flex-1">
                             <select
                                value={req.product_id}
                                onChange={e => updateRequirement(index, 'product_id', e.target.value)}
                                className="w-full border p-2 text-sm rounded focus:border-[#0d2818] outline-none"
                             >
                                <option value="">Select Product...</option>
                                {products.map(p => (
                                   <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                             </select>
                          </div>
                          <div className="w-24">
                             <input 
                                type="number" 
                                min="1"
                                placeholder="Qty"
                                value={req.required_quantity}
                                onChange={e => updateRequirement(index, 'required_quantity', parseInt(e.target.value))}
                                className="w-full border p-2 text-sm rounded text-center focus:border-[#0d2818] outline-none"
                             />
                          </div>
                          {requirements.length > 1 && (
                             <button onClick={() => handleRemoveRequirement(index)} className="p-2 text-gray-400 hover:text-red-500">
                                <Trash2 size={16} />
                             </button>
                          )}
                       </div>
                    ))}
                 </div>
              </div>

              {/* 2. Task Details */}
              <div className="space-y-4">
                 <div>
                    <label className="block text-xs uppercase text-gray-500 mb-2">Task Title *</label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full border p-3 text-sm rounded focus:border-[#0d2818] outline-none"
                      placeholder="e.g., Weekend Sales Challenge"
                    />
                 </div>

                 <div>
                    <div className="flex justify-between mb-2">
                       <label className="text-xs uppercase text-gray-500">Description</label>
                       <button 
                         onClick={() => setAutoDescription(!autoDescription)}
                         className="text-[10px] flex items-center gap-1 text-blue-600"
                       >
                         <RefreshCw size={10} /> {autoDescription ? 'Disable Auto-Gen' : 'Enable Auto-Gen'}
                       </button>
                    </div>
                    <textarea
                      value={description}
                      onChange={e => { setDescription(e.target.value); setAutoDescription(false); }}
                      className={`w-full border p-3 text-sm rounded focus:border-[#0d2818] outline-none ${autoDescription ? 'bg-gray-50 text-gray-500' : ''}`}
                      rows={2}
                      placeholder="Auto-generated based on requirements..."
                    />
                 </div>
              </div>

              {/* 3. Rewards */}
              <div>
                <label className="block text-xs uppercase text-gray-500 mb-3">Reward Type *</label>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {(['product', 'cash', 'both'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setRewardType(type)}
                      className={`p-3 border text-sm capitalize transition-colors rounded ${
                        rewardType === type
                          ? 'bg-[#0d2818] text-white border-[#0d2818]'
                          : 'bg-white border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {(rewardType === 'product' || rewardType === 'both') && (
                    <div>
                      <label className="block text-xs uppercase text-gray-500 mb-2">Reward Product</label>
                      <select
                        value={rewardProductId}
                        onChange={e => setRewardProductId(e.target.value)}
                        className="w-full border p-3 text-sm rounded focus:border-[#0d2818] outline-none"
                      >
                        <option value="">Select Reward...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {(rewardType === 'cash' || rewardType === 'both') && (
                    <div>
                      <label className="block text-xs uppercase text-gray-500 mb-2">Cash Amount (₦)</label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={rewardCashAmount}
                        onChange={e => setRewardCashAmount(parseFloat(e.target.value))}
                        className="w-full border p-3 text-sm rounded focus:border-[#0d2818] outline-none"
                        placeholder="0.00"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 border border-gray-300 py-3 text-sm hover:bg-gray-50 rounded"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 bg-[#0d2818] text-white py-3 text-sm tracking-widest hover:bg-opacity-90 rounded"
                >
                  {editingTask ? 'UPDATE TASK' : 'CREATE TASK'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}