import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle, XCircle, Truck, MapPin, Users, Mail, Phone, Globe, Calendar, CreditCard, Save, Smartphone, Loader2 } from 'lucide-react';

// Nigerian States
const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", 
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", 
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", 
  "Taraba", "Yobe", "Zamfara"
];

interface DeliverySetting {
  id: string;
  state: string;
  delivery_fee: number;
}

interface RetailerRegistration {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  domain_type: 'subdomain' | 'custom';
  custom_domain?: string;
  store_slug: string;
  registration_fee: number;
  payment_status: 'pending' | 'verified' | 'failed';
  subscription_status: 'trial' | 'active' | 'suspended';
  created_at: string;
  verified_at?: string;
  trial_ends_at?: string;
}

export default function SettingsTab() {
  const [activeTab, setActiveTab] = useState<'delivery' | 'retailers' | 'payments'>('delivery'); // Added 'payments'
  
  // Delivery Settings State
  const [deliverySettings, setDeliverySettings] = useState<DeliverySetting[]>([]);
  const [editingDelivery, setEditingDelivery] = useState<string | null>(null);
  const [newDeliveryFee, setNewDeliveryFee] = useState<Record<string, string>>({});

  // Retailer Applications State
  const [retailers, setRetailers] = useState<RetailerRegistration[]>([]);
  const [loadingRetailers, setLoadingRetailers] = useState(false);

  // Payment Settings State (NEW)
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState({
    enable_paystack: true,
    enable_transfer: true
  });
  const [transferDetails, setTransferDetails] = useState({
    bank: 'OPay',
    number: '9069149803',
    name: 'Optics View Store'
  });

  useEffect(() => {
    fetchDeliverySettings();
    fetchRetailers();
    fetchPaymentSettings(); // New fetch
  }, []);

  const fetchDeliverySettings = async () => {
    const { data } = await supabase
      .from('delivery_settings')
      .select('*')
      .order('state', { ascending: true });
    
    if (data) setDeliverySettings(data);
  };

  const fetchRetailers = async () => {
    setLoadingRetailers(true);
    const { data } = await supabase
      .from('retailer_registrations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setRetailers(data);
    setLoadingRetailers(false);
  };

  const fetchPaymentSettings = async () => {
    // 1. Fetch Payment Toggles
    const { data: methodData } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'payment_methods')
      .single();

    if (methodData?.value) {
      setPaymentMethods(methodData.value);
    }

    // 2. Fetch Transfer Details
    const { data: transferData } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'transfer_details')
      .single();

    if (transferData?.value) {
      setTransferDetails(transferData.value);
    }
  };

  const handleSavePaymentSettings = async () => {
    setPaymentLoading(true);
    try {
      // Update Methods
      await supabase
        .from('app_settings')
        .upsert({ key: 'payment_methods', value: paymentMethods });

      // Update Transfer Details
      await supabase
        .from('app_settings')
        .upsert({ key: 'transfer_details', value: transferDetails });

      alert('Payment settings saved successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to save settings');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleUpdateDeliveryFee = async (state: string) => {
    const fee = parseFloat(newDeliveryFee[state]);
    if (isNaN(fee) || fee < 0) {
      alert('Please enter a valid amount');
      return;
    }

    const existing = deliverySettings.find(d => d.state === state);

    if (existing) {
      const { error } = await supabase
        .from('delivery_settings')
        .update({ delivery_fee: fee, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      
      if (!error) {
        fetchDeliverySettings();
        setEditingDelivery(null);
        setNewDeliveryFee({});
      }
    } else {
      const { error } = await supabase
        .from('delivery_settings')
        .insert([{ state, delivery_fee: fee }]);
      
      if (!error) {
        fetchDeliverySettings();
        setEditingDelivery(null);
        setNewDeliveryFee({});
      }
    }
  };

  const getDeliveryFee = (state: string) => {
    const setting = deliverySettings.find(d => d.state === state);
    return setting?.delivery_fee || 0;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      verified: 'bg-green-100 text-green-800 border-green-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
      trial: 'bg-blue-100 text-blue-800 border-blue-200',
      active: 'bg-green-100 text-green-800 border-green-200',
      suspended: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-6xl">
      {/* Tab Navigation */}
      <div className="flex gap-6 border-b border-gray-200 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('delivery')}
          className={`text-sm uppercase tracking-widest pb-3 transition-colors whitespace-nowrap ${
            activeTab === 'delivery'
              ? 'border-b-2 border-[#0d2818] font-bold text-[#0d2818]'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <Truck size={16} />
            Delivery Settings
          </div>
        </button>
        <button
          onClick={() => setActiveTab('retailers')}
          className={`text-sm uppercase tracking-widest pb-3 transition-colors whitespace-nowrap ${
            activeTab === 'retailers'
              ? 'border-b-2 border-[#0d2818] font-bold text-[#0d2818]'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users size={16} />
            Retailer Applications ({retailers.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`text-sm uppercase tracking-widest pb-3 transition-colors whitespace-nowrap ${
            activeTab === 'payments'
              ? 'border-b-2 border-[#0d2818] font-bold text-[#0d2818]'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <CreditCard size={16} />
            Payment Gateways
          </div>
        </button>
      </div>

      {/* Delivery Settings Tab */}
      {activeTab === 'delivery' && (
        <div className="animate-in fade-in duration-300">
          <div className="flex items-center gap-3 mb-8">
            <Truck size={24} className="text-[#0d2818]" />
            <h2 className="text-xl font-light text-[#0d2818]">State-Specific Delivery Fees</h2>
          </div>

          <div className="bg-white border rounded-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {NIGERIAN_STATES.map(state => {
                const currentFee = getDeliveryFee(state);
                const isEditing = editingDelivery === state;

                return (
                  <div key={state} className="border p-4 rounded hover:border-[#0d2818] transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin size={14} className="text-gray-400" />
                      <span className="font-medium text-sm">{state}</span>
                    </div>
                    
                    {isEditing ? (
                      <div className="flex gap-2 items-center mt-2">
                        <input
                          type="number"
                          placeholder="0"
                          value={newDeliveryFee[state] || ''}
                          onChange={(e) => setNewDeliveryFee({...newDeliveryFee, [state]: e.target.value})}
                          className="flex-1 border p-2 text-sm outline-none focus:border-[#0d2818]"
                        />
                        <button
                          onClick={() => handleUpdateDeliveryFee(state)}
                          className="bg-[#0d2818] text-white p-2 rounded hover:opacity-90"
                        >
                          <CheckCircle size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingDelivery(null);
                            setNewDeliveryFee({});
                          }}
                          className="bg-gray-200 text-gray-600 p-2 rounded hover:bg-gray-300"
                        >
                          <XCircle size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-mono text-lg text-[#0d2818]">
                          ₦{currentFee.toLocaleString()}
                        </span>
                        <button
                          onClick={() => {
                            setEditingDelivery(state);
                            setNewDeliveryFee({[state]: currentFee.toString()});
                          }}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Retailer Applications Tab */}
      {activeTab === 'retailers' && (
        <div className="animate-in fade-in duration-300">
          <div className="flex items-center gap-3 mb-8">
            <Users size={24} className="text-[#0d2818]" />
            <h2 className="text-xl font-light text-[#0d2818]">Retailer Applications</h2>
          </div>

          {loadingRetailers ? (
            <div className="text-center py-12 text-gray-400">Loading...</div>
          ) : retailers.length === 0 ? (
            <div className="bg-white border rounded-sm p-12 text-center text-gray-400">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-sm">No retailer applications yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {retailers.map((retailer) => (
                <div key={retailer.id} className="bg-white border rounded-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-[#0d2818] mb-1">{retailer.full_name}</h3>
                      <div className="flex gap-2">
                        <span className={`text-[10px] px-2 py-1 rounded border uppercase tracking-wide ${getStatusBadge(retailer.payment_status)}`}>
                          {retailer.payment_status}
                        </span>
                        <span className={`text-[10px] px-2 py-1 rounded border uppercase tracking-wide ${getStatusBadge(retailer.subscription_status)}`}>
                          {retailer.subscription_status}
                        </span>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-[#0d2818]">
                      ₦{retailer.registration_fee.toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail size={14} />
                      <a href={`mailto:${retailer.email}`} className="hover:text-[#0d2818]">{retailer.email}</a>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={14} />
                      <a href={`tel:${retailer.phone}`} className="hover:text-[#0d2818]">{retailer.phone}</a>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Globe size={14} />
                      <span>
                        {retailer.domain_type === 'subdomain' 
                          ? `${retailer.store_slug}.opticsview.store`
                          : `${retailer.custom_domain || retailer.store_slug}.store`
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={14} />
                      <span>Applied: {formatDate(retailer.created_at)}</span>
                    </div>
                  </div>

                  {retailer.verified_at && (
                    <div className="bg-green-50 border border-green-200 p-3 rounded text-xs">
                      <div className="flex items-center gap-2 text-green-800">
                        <CheckCircle size={14} />
                        <span className="font-medium">Verified on {formatDate(retailer.verified_at)}</span>
                      </div>
                      {retailer.trial_ends_at && (
                        <p className="text-green-700 mt-1 ml-6">
                          Trial ends: {formatDate(retailer.trial_ends_at)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Payment Settings Tab (NEW) */}
      {activeTab === 'payments' && (
        <div className="animate-in fade-in duration-300">
           <div className="flex justify-between items-center mb-8">
             <div className="flex items-center gap-3">
                <CreditCard size={24} className="text-[#0d2818]" />
                <h2 className="text-xl font-light text-[#0d2818]">Payment Gateways</h2>
             </div>
             <button
               onClick={handleSavePaymentSettings}
               disabled={paymentLoading}
               className="bg-[#0d2818] text-white px-6 py-2.5 text-xs tracking-widest hover:bg-opacity-90 flex items-center gap-2 rounded"
             >
               {paymentLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
               SAVE CHANGES
             </button>
           </div>

           <div className="grid gap-6 max-w-2xl">
              
              {/* Payment Methods Toggle */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                 <h3 className="text-sm font-bold uppercase text-gray-500 mb-4">Enabled Methods</h3>
                 <div className="space-y-4">
                    {/* Paystack */}
                    <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg bg-gray-50">
                       <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentMethods.enable_paystack ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'}`}>
                             <CreditCard size={20} />
                          </div>
                          <div>
                             <p className="font-bold text-sm text-gray-800">Paystack (Card)</p>
                             <p className="text-xs text-gray-500">Automated card payments</p>
                          </div>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                             type="checkbox" 
                             className="sr-only peer"
                             checked={paymentMethods.enable_paystack}
                             onChange={e => setPaymentMethods({...paymentMethods, enable_paystack: e.target.checked})}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0d2818]"></div>
                       </label>
                    </div>

                    {/* Transfer */}
                    <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg bg-gray-50">
                       <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentMethods.enable_transfer ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}`}>
                             <Smartphone size={20} />
                          </div>
                          <div>
                             <p className="font-bold text-sm text-gray-800">Bank Transfer</p>
                             <p className="text-xs text-gray-500">Manual verification required</p>
                          </div>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                             type="checkbox" 
                             className="sr-only peer"
                             checked={paymentMethods.enable_transfer}
                             onChange={e => setPaymentMethods({...paymentMethods, enable_transfer: e.target.checked})}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0d2818]"></div>
                       </label>
                    </div>
                 </div>
              </div>

              {/* Transfer Details Form */}
              {paymentMethods.enable_transfer && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 animate-in fade-in slide-in-from-top-4">
                  <h3 className="text-sm font-bold uppercase text-gray-500 mb-4">Transfer Account Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase text-gray-500 mb-2">Bank Name</label>
                      <input 
                        type="text"
                        value={transferDetails.bank}
                        onChange={e => setTransferDetails({...transferDetails, bank: e.target.value})}
                        className="w-full border p-3 text-sm rounded outline-none focus:border-[#0d2818]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase text-gray-500 mb-2">Account Number</label>
                      <input 
                        type="text"
                        value={transferDetails.number}
                        onChange={e => setTransferDetails({...transferDetails, number: e.target.value})}
                        className="w-full border p-3 text-sm rounded outline-none focus:border-[#0d2818]"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs uppercase text-gray-500 mb-2">Account Name</label>
                      <input 
                        type="text"
                        value={transferDetails.name}
                        onChange={e => setTransferDetails({...transferDetails, name: e.target.value})}
                        className="w-full border p-3 text-sm rounded outline-none focus:border-[#0d2818]"
                      />
                    </div>
                  </div>
                </div>
              )}

           </div>
        </div>
      )}
    </div>
  );
}