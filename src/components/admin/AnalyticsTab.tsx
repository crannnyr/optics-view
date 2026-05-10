import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { PieChart, Histogram } from './Charts';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Plus, 
  Trash2, 
  Wallet,
  ArrowRightLeft,
  Loader2,
  CheckCircle,
  Truck,
  HandCoins
} from 'lucide-react';

export default function AnalyticsTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [deliveryExpenses, setDeliveryExpenses] = useState<any[]>([]);
  const [partnerTransactions, setPartnerTransactions] = useState<any[]>([]);
  const [timeFilter, setTimeFilter] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('monthly');
  const [loading, setLoading] = useState(true);

  // Forms State
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: 'General' });
  const [newDelivery, setNewDelivery] = useState({ partner_name: 'Henry', amount: '', description: '' });
  const [newPartnerPay, setNewPartnerPay] = useState({ from_partner: 'Henry', to_partner: 'Joshua', amount: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const { data: ordersData } = await supabase
      .from('orders')
      .select('*, items:order_items(*, products(name, cost_price))')
      .neq('status', 'rejected')
      .order('created_at', { ascending: true });

    const { data: paymentsData } = await supabase
      .from('payments')
      .select('*, bank_accounts(owner_tag, bank_name)')
      .eq('status', 'verified');

    const { data: expensesData } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: deliveryData } = await supabase
      .from('delivery_expenses')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: partnerData } = await supabase
      .from('partner_transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordersData) setOrders(ordersData);
    if (paymentsData) setPayments(paymentsData);
    if (expensesData) setExpenses(expensesData);
    if (deliveryData) setDeliveryExpenses(deliveryData);
    if (partnerData) setPartnerTransactions(partnerData);
    setLoading(false);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.description || !newExpense.amount) return;
    setSubmitting(true);

    const { data, error } = await supabase
      .from('expenses')
      .insert([{
        description: newExpense.description,
        amount: parseFloat(newExpense.amount),
        category: newExpense.category,
        incurred_date: new Date().toISOString()
      }])
      .select()
      .single();

    if (!error && data) {
      setExpenses([data, ...expenses]);
      setNewExpense({ description: '', amount: '', category: 'General' });
      setShowExpenseForm(false);
    }
    setSubmitting(false);
  };

  const handleAddDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDelivery.amount) return;
    setSubmitting(true);

    const { data, error } = await supabase
      .from('delivery_expenses')
      .insert([{
        partner_name: newDelivery.partner_name,
        amount: parseFloat(newDelivery.amount),
        description: newDelivery.description || `Delivery expense by ${newDelivery.partner_name}`
      }])
      .select()
      .single();

    if (!error && data) {
      setDeliveryExpenses([data, ...deliveryExpenses]);
      setNewDelivery({ partner_name: 'Henry', amount: '', description: '' });
      setShowDeliveryForm(false);
    }
    setSubmitting(false);
  };

  const handleAddPartnerTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerPay.amount) return;
    
    const amount = parseFloat(newPartnerPay.amount);
    const maxOwed = Math.abs(financials.partnerStats.henryNet - financials.partnerStats.joshuaNet);
    
    if (amount > maxOwed) {
      alert(`Cannot pay more than owed amount: ₦${maxOwed.toLocaleString()}`);
      return;
    }

    setSubmitting(true);

    const { data, error } = await supabase
      .from('partner_transactions')
      .insert([{
        from_partner: newPartnerPay.from_partner,
        to_partner: newPartnerPay.to_partner,
        amount: amount,
        description: newPartnerPay.description || `Balance payment from ${newPartnerPay.from_partner} to ${newPartnerPay.to_partner}`
      }])
      .select()
      .single();

    if (!error && data) {
      setPartnerTransactions([data, ...partnerTransactions]);
      setNewPartnerPay({ from_partner: 'Henry', to_partner: 'Joshua', amount: '', description: '' });
      setShowPartnerForm(false);
    }
    setSubmitting(false);
  };

  const handleDeleteExpense = async (id: string) => {
    if(!confirm('Delete this expense?')) return;
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (!error) setExpenses(expenses.filter(e => e.id !== id));
  };

  const filterByDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    if (timeFilter === 'all') return true;
    if (timeFilter === 'daily') return date.toDateString() === now.toDateString();
    if (timeFilter === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return date >= weekAgo;
    }
    if (timeFilter === 'monthly') {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }
    return true;
  };

  const financials = useMemo(() => {
    const filteredPayments = payments.filter(p => filterByDate(p.created_at));
    const revenue = filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const filteredOrders = orders.filter(o => filterByDate(o.created_at));
    const cogs = filteredOrders.reduce((sum, order) => {
       const orderCost = order.items.reduce((iSum: number, item: any) => {
         const cost = item.products?.cost_price || 0;
         return iSum + (cost * item.quantity);
       }, 0);
       return sum + orderCost;
    }, 0);

    const filteredExpenses = expenses.filter(e => filterByDate(e.incurred_date));
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // Delivery expenses (NOT filtered by time, always cumulative)
    const henryDelivery = deliveryExpenses
      .filter(d => d.partner_name === 'Henry')
      .reduce((sum, d) => sum + Number(d.amount), 0);
    
    const joshuaDelivery = deliveryExpenses
      .filter(d => d.partner_name === 'Joshua')
      .reduce((sum, d) => sum + Number(d.amount), 0);

    const totalDeliveryExpenses = henryDelivery + joshuaDelivery;

    const netProfit = revenue - cogs - totalExpenses - totalDeliveryExpenses;

    // Cash held by each partner
    const joshuaCash = filteredPayments
      .filter(p => p.bank_accounts?.owner_tag === 'Joshua')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const henryCash = filteredPayments
      .filter(p => p.bank_accounts?.owner_tag === 'Henry')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    // Each partner's share (50/50 of net profit)
    const eachShare = netProfit / 2;

    // Subtract their delivery expenses from their share
    const henryNet = eachShare - henryDelivery;
    const joshuaNet = eachShare - joshuaDelivery;

    // Partner transactions (who paid whom) - NOT filtered
    const henryPaidJoshua = partnerTransactions
      .filter(t => t.from_partner === 'Henry' && t.to_partner === 'Joshua')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const joshuaPaidHenry = partnerTransactions
      .filter(t => t.from_partner === 'Joshua' && t.to_partner === 'Henry')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Adjust net with transactions
    const henryFinal = henryNet - henryPaidJoshua + joshuaPaidHenry;
    const joshuaFinal = joshuaNet - joshuaPaidHenry + henryPaidJoshua;

    const settlementAmount = Math.abs(henryFinal - joshuaFinal);
    const whoOwes = henryFinal > joshuaFinal ? 'Henry' : 'Joshua';
    const whoReceives = henryFinal > joshuaFinal ? 'Joshua' : 'Henry';

    return {
      revenue,
      cogs,
      totalExpenses,
      totalDeliveryExpenses,
      netProfit,
      filteredOrders,
      filteredExpenses,
      partnerStats: {
        henryCash,
        joshuaCash,
        henryDelivery,
        joshuaDelivery,
        henryNet: henryFinal,
        joshuaNet: joshuaFinal,
        settlementAmount,
        whoOwes,
        whoReceives,
        isBalanced: settlementAmount < 100
      }
    };
  }, [orders, payments, expenses, deliveryExpenses, partnerTransactions, timeFilter]);

  const bestSellers = useMemo(() => {
    const counts: Record<string, number> = {};
    financials.filteredOrders.forEach(o => {
      o.items.forEach((i: any) => {
        const name = i.products?.name || 'Unknown';
        counts[name] = (counts[name] || 0) + i.quantity;
      });
    });
    return Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map((item, i) => ({
        ...item,
        color: ['#0d2818', '#1a3d28', '#265238', '#336648', '#407b58'][i] || '#ccc'
      }));
  }, [financials.filteredOrders]);

  const salesHistory = useMemo(() => {
    const history: Record<string, number> = {};
    financials.filteredOrders.forEach(o => {
      const date = new Date(o.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      history[date] = (history[date] || 0) + o.total_amount;
    });
    return Object.entries(history).map(([label, value]) => ({ label, value }));
  }, [financials.filteredOrders]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#0d2818]"/></div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-light text-[#0d2818] flex items-center gap-2">
           <TrendingUp size={24} /> Financial Dashboard
        </h2>
        <div className="flex bg-white border p-1 rounded-md shadow-sm">
          {(['daily', 'weekly', 'monthly', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setTimeFilter(f)}
              className={`px-4 py-1.5 text-xs uppercase tracking-wider rounded transition-all ${
                timeFilter === f
                  ? 'bg-[#0d2818] text-white shadow-md'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 border rounded-sm shadow-sm relative overflow-hidden">
           <div className="absolute right-0 top-0 p-4 opacity-5"><DollarSign size={64}/></div>
           <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Total Revenue</p>
           <p className="text-2xl font-bold text-[#0d2818]">₦{financials.revenue.toLocaleString()}</p>
        </div>
        
        <div className="bg-white p-6 border rounded-sm shadow-sm">
           <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Cost of Goods</p>
           <p className="text-2xl font-medium text-orange-600">-₦{financials.cogs.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 border rounded-sm shadow-sm">
           <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Total Expenses</p>
           <p className="text-2xl font-medium text-red-600">-₦{(financials.totalExpenses + financials.totalDeliveryExpenses).toLocaleString()}</p>
        </div>

        <div className={`p-6 border rounded-sm shadow-sm text-white ${financials.netProfit >= 0 ? 'bg-[#0d2818]' : 'bg-red-700'}`}>
           <p className="text-[10px] uppercase tracking-widest opacity-80 mb-1">Net Profit</p>
           <p className="text-2xl font-bold">₦{financials.netProfit.toLocaleString()}</p>
        </div>
      </div>

      {/* PARTNER BALANCING */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 rounded-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-bold text-[#0d2818] uppercase tracking-widest flex items-center gap-2">
            <Users size={16} /> Partner Balancing
          </h3>
          <button
            onClick={() => setShowPartnerForm(!showPartnerForm)}
            className="text-xs bg-[#0d2818] text-white px-3 py-1.5 rounded hover:opacity-90 flex items-center gap-1"
          >
            <HandCoins size={12} /> Record Payment
          </button>
        </div>

        {showPartnerForm && (
          <form onSubmit={handleAddPartnerTransaction} className="mb-6 bg-white p-4 rounded border flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-[10px] uppercase text-gray-500 mb-1">From</label>
              <select value={newPartnerPay.from_partner} onChange={e => setNewPartnerPay({...newPartnerPay, from_partner: e.target.value as any, to_partner: e.target.value === 'Henry' ? 'Joshua' : 'Henry'})} className="w-full border p-2 text-sm outline-none bg-white">
                <option value="Henry">Henry</option>
                <option value="Joshua">Joshua</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-[10px] uppercase text-gray-500 mb-1">Amount (₦)</label>
              <input required type="number" value={newPartnerPay.amount} onChange={e => setNewPartnerPay({...newPartnerPay, amount: e.target.value})} className="w-full border p-2 text-sm outline-none" placeholder="0.00" />
            </div>
            <button disabled={submitting} className="bg-[#0d2818] text-white px-4 py-2 rounded hover:opacity-90">
              {submitting ? <Loader2 className="animate-spin" size={14}/> : 'Save'}
            </button>
          </form>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="text-center bg-white p-4 rounded shadow-sm">
             <div className="w-12 h-12 bg-purple-100 text-purple-800 rounded-full flex items-center justify-center mx-auto mb-2 font-bold text-lg">H</div>
             <p className="text-xs uppercase text-gray-500">Henry Net</p>
             <p className="text-xl font-mono font-bold text-[#0d2818]">₦{financials.partnerStats.henryNet.toLocaleString()}</p>
             <p className="text-[10px] text-gray-400 mt-1">Delivery: -₦{financials.partnerStats.henryDelivery.toLocaleString()}</p>
          </div>

          <div className="flex flex-col items-center justify-center bg-white p-4 rounded shadow-sm border-2 border-[#0d2818]">
             {financials.partnerStats.isBalanced ? (
                <div className="text-green-600 font-bold flex items-center gap-2">
                  <CheckCircle size={20} /> BALANCED
                </div>
             ) : (
                <>
                  <p className="text-[10px] uppercase text-gray-400 mb-2">Settlement Required</p>
                  <div className="flex items-center gap-3 text-[#0d2818] font-bold text-sm">
                    <span className="text-red-600">{financials.partnerStats.whoOwes}</span>
                    <ArrowRightLeft size={16} />
                    <span className="text-green-600">{financials.partnerStats.whoReceives}</span>
                  </div>
                  <div className="mt-2 bg-yellow-50 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold border border-yellow-200">
                    Pay ₦{financials.partnerStats.settlementAmount.toLocaleString()}
                  </div>
                </>
             )}
          </div>

          <div className="text-center bg-white p-4 rounded shadow-sm">
             <div className="w-12 h-12 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center mx-auto mb-2 font-bold text-lg">J</div>
             <p className="text-xs uppercase text-gray-500">Joshua Net</p>
             <p className="text-xl font-mono font-bold text-[#0d2818]">₦{financials.partnerStats.joshuaNet.toLocaleString()}</p>
             <p className="text-[10px] text-gray-400 mt-1">Delivery: -₦{financials.partnerStats.joshuaDelivery.toLocaleString()}</p>
          </div>
        </div>

        {/* Transaction History */}
        {partnerTransactions.length > 0 && (
          <div className="mt-4 bg-white p-3 rounded">
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Recent Settlements</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {partnerTransactions.slice(0, 5).map(t => (
                <div key={t.id} className="flex justify-between text-xs border-b border-gray-100 pb-1">
                  <span>{t.from_partner} → {t.to_partner}</span>
                  <span className="font-mono font-bold">₦{t.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* DELIVERY EXPENSES */}
      <div className="bg-white border rounded-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-[#0d2818] uppercase tracking-widest flex items-center gap-2">
            <Truck size={16} /> Delivery Expenses
          </h3>
          <button onClick={() => setShowDeliveryForm(!showDeliveryForm)} className="text-xs bg-gray-100 hover:bg-[#0d2818] hover:text-white px-3 py-1 rounded transition-colors">
            <Plus size={12} className="inline mr-1"/> Add Delivery
          </button>
        </div>

        {showDeliveryForm && (
          <form onSubmit={handleAddDelivery} className="mb-4 bg-gray-50 p-3 rounded border flex gap-3 items-end">
            <div>
              <label className="block text-[10px] uppercase text-gray-500 mb-1">Partner</label>
              <select value={newDelivery.partner_name} onChange={e => setNewDelivery({...newDelivery, partner_name: e.target.value as any})} className="border p-2 text-sm outline-none bg-white">
                <option value="Henry">Henry</option>
                <option value="Joshua">Joshua</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-[10px] uppercase text-gray-500 mb-1">Amount (₦)</label>
              <input required type="number" value={newDelivery.amount} onChange={e => setNewDelivery({...newDelivery, amount: e.target.value})} className="w-full border p-2 text-sm outline-none" placeholder="0.00" />
            </div>
            <button disabled={submitting} className="bg-[#0d2818] text-white px-4 py-2 rounded hover:opacity-90">
              {submitting ? <Loader2 className="animate-spin" size={14}/> : 'Save'}
            </button>
          </form>
        )}

        <div className="grid grid-cols-2 gap-4">
          {deliveryExpenses.slice(0, 10).map(d => (
            <div key={d.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-xs border">
              <div>
                <p className="font-medium">{d.partner_name}</p>
                <p className="text-[10px] text-gray-400">{new Date(d.created_at).toLocaleDateString()}</p>
              </div>
              <span className="font-mono font-bold text-red-600">-₦{d.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* EXPENSES & CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border rounded-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-[#0d2818] uppercase tracking-widest flex items-center gap-2">
              <Wallet size={16} /> Operational Expenses
            </h3>
            <button onClick={() => setShowExpenseForm(!showExpenseForm)} className="flex items-center gap-1 text-[10px] bg-gray-100 hover:bg-[#0d2818] hover:text-white px-3 py-1 rounded transition-colors uppercase tracking-wider">
              <Plus size={12} /> Add Expense
            </button>
          </div>

          {showExpenseForm && (
            <form onSubmit={handleAddExpense} className="mb-6 bg-gray-50 p-4 rounded border border-gray-200 flex gap-4 items-end animate-in slide-in-from-top-2">
              <div className="flex-1">
                 <label className="block text-[10px] uppercase text-gray-500 mb-1">Description</label>
                 <input required value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} className="w-full border p-2 text-sm outline-none" placeholder="e.g. Facebook Ads" />
              </div>
              <div className="w-32">
                 <label className="block text-[10px] uppercase text-gray-500 mb-1">Amount (₦)</label>
                 <input required type="number" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} className="w-full border p-2 text-sm outline-none" placeholder="0.00" />
              </div>
              <button disabled={submitting} className="bg-[#0d2818] text-white p-2.5 rounded hover:bg-opacity-90">
                {submitting ? <Loader2 className="animate-spin" size={16}/> : <Plus size={16} />}
              </button>
            </form>
          )}

          {financials.filteredExpenses.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs italic">No expenses recorded.</div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {financials.filteredExpenses.map(exp => (
                <div key={exp.id} className="flex justify-between items-center p-3 border-b border-gray-50 hover:bg-gray-50 group">
                  <div>
                    <p className="font-medium text-sm text-gray-800">{exp.description}</p>
                    <p className="text-[10px] text-gray-400">{new Date(exp.incurred_date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-red-600 font-medium">-₦{exp.amount.toLocaleString()}</span>
                    <button onClick={() => handleDeleteExpense(exp.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border rounded-sm p-6">
           <h3 className="text-sm font-bold text-[#0d2818] uppercase tracking-widest mb-6">Sales Trend</h3>
           {salesHistory.length > 0 ? <Histogram data={salesHistory} /> : <div className="h-40 flex items-center justify-center text-xs text-gray-400">No data</div>}
           
           <div className="mt-8">
             <h3 className="text-sm font-bold text-[#0d2818] uppercase tracking-widest mb-4">Top Products</h3>
             <PieChart data={bestSellers} />
           </div>
        </div>
      </div>

    </div>
  );
}