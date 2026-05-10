import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

// Constants & Interfaces
export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", 
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", 
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", 
  "Taraba", "Yobe", "Zamfara"
];

export interface DeliverySetting {
  id: string;
  state: string;
  delivery_fee: number;
}

export interface RetailerRegistration {
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

export function useSettings() {
  const [activeTab, setActiveTab] = useState<'delivery' | 'retailers' | 'payments'>('delivery');

  // Delivery Settings State
  const [deliverySettings, setDeliverySettings] = useState<DeliverySetting[]>([]);
  const [editingDelivery, setEditingDelivery] = useState<string | null>(null);
  const [newDeliveryFee, setNewDeliveryFee] = useState<Record<string, string>>({});

  // Retailer Applications State
  const [retailers, setRetailers] = useState<RetailerRegistration[]>([]);
  const [loadingRetailers, setLoadingRetailers] = useState(false);

  // Payment Settings State
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
    fetchPaymentSettings();
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

  return {
    activeTab,
    setActiveTab,
    deliverySettings,
    editingDelivery,
    setEditingDelivery,
    newDeliveryFee,
    setNewDeliveryFee,
    retailers,
    loadingRetailers,
    paymentLoading,
    paymentMethods,
    setPaymentMethods,
    transferDetails,
    setTransferDetails,
    handleSavePaymentSettings,
    handleUpdateDeliveryFee,
    getDeliveryFee,
    getStatusBadge,
    formatDate
  };
}
