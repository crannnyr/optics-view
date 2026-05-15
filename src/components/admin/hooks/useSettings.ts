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

export interface CategoryItemType {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  sort_order: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  created_at: string;
  item_types?: CategoryItemType[];
}

// ← 'hero' added to the union
export type SettingsActiveTab = 'delivery' | 'retailers' | 'payments' | 'categories' | 'hero';

export function useSettings() {
  const [activeTab, setActiveTab] = useState<SettingsActiveTab>('delivery');

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

  // Categories State
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newItemTypeInputs, setNewItemTypeInputs] = useState<Record<string, string>>({});
  const [categoryError, setCategoryError] = useState('');

  useEffect(() => {
    fetchDeliverySettings();
    fetchRetailers();
    fetchPaymentSettings();
    fetchCategories();
  }, []);

  // ─── Delivery ────────────────────────────────────────────────────────────────

  const fetchDeliverySettings = async () => {
    const { data } = await supabase
      .from('delivery_settings')
      .select('*')
      .order('state', { ascending: true });
    if (data) setDeliverySettings(data);
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
      if (!error) { fetchDeliverySettings(); setEditingDelivery(null); setNewDeliveryFee({}); }
    } else {
      const { error } = await supabase
        .from('delivery_settings')
        .insert([{ state, delivery_fee: fee }]);
      if (!error) { fetchDeliverySettings(); setEditingDelivery(null); setNewDeliveryFee({}); }
    }
  };

  const getDeliveryFee = (state: string) => {
    const setting = deliverySettings.find(d => d.state === state);
    return setting?.delivery_fee || 0;
  };

  // ─── Retailers ───────────────────────────────────────────────────────────────

  const fetchRetailers = async () => {
    setLoadingRetailers(true);
    const { data } = await supabase
      .from('retailer_registrations')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setRetailers(data);
    setLoadingRetailers(false);
  };

  // ─── Payments ────────────────────────────────────────────────────────────────

  const fetchPaymentSettings = async () => {
    const { data: methodData } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'payment_methods')
      .single();
    if (methodData?.value) setPaymentMethods(methodData.value);

    const { data: transferData } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'transfer_details')
      .single();
    if (transferData?.value) setTransferDetails(transferData.value);
  };

  const handleSavePaymentSettings = async () => {
    setPaymentLoading(true);
    try {
      await supabase.from('app_settings').upsert({ key: 'payment_methods', value: paymentMethods });
      await supabase.from('app_settings').upsert({ key: 'transfer_details', value: transferDetails });
      alert('Payment settings saved successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to save settings');
    } finally {
      setPaymentLoading(false);
    }
  };

  // ─── Categories ──────────────────────────────────────────────────────────────

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    const { data: cats } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (cats) {
      const { data: itemTypes } = await supabase
        .from('category_item_types')
        .select('*')
        .order('sort_order', { ascending: true });

      const merged = cats.map(cat => ({
        ...cat,
        item_types: (itemTypes || []).filter(it => it.category_id === cat.id)
      }));
      setCategories(merged);
    }
    setCategoriesLoading(false);
  };

  const slugify = (text: string) =>
    text.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    const slug = slugify(name);

    const exists = categories.find(c => c.slug === slug);
    if (exists) {
      setCategoryError('A category with this name already exists.');
      return;
    }

    const maxOrder = categories.reduce((max, c) => Math.max(max, c.sort_order), -1);
    const { error } = await supabase
      .from('categories')
      .insert([{ name, slug, sort_order: maxOrder + 1 }]);

    if (!error) {
      setNewCategoryName('');
      setCategoryError('');
      fetchCategories();
    } else {
      setCategoryError('Failed to create category.');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return;

    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category', cat.slug);

    if (count && count > 0) {
      alert(`Cannot delete: ${count} product(s) are assigned to this category. Reassign them first.`);
      return;
    }

    if (!confirm(`Delete category "${cat.name}"? This cannot be undone.`)) return;

    const { error } = await supabase.from('categories').delete().eq('id', categoryId);
    if (!error) fetchCategories();
  };

  const handleAddItemType = async (categoryId: string) => {
    const name = (newItemTypeInputs[categoryId] || '').trim();
    if (!name) return;
    const slug = slugify(name);

    const cat = categories.find(c => c.id === categoryId);
    const alreadyExists = cat?.item_types?.find(it => it.slug === slug);
    if (alreadyExists) {
      alert('This item type already exists in this category.');
      return;
    }

    const maxOrder = (cat?.item_types || []).reduce((max, it) => Math.max(max, it.sort_order), -1);

    const { error } = await supabase
      .from('category_item_types')
      .insert([{ category_id: categoryId, name, slug, sort_order: maxOrder + 1 }]);

    if (!error) {
      setNewItemTypeInputs(prev => ({ ...prev, [categoryId]: '' }));
      fetchCategories();
    }
  };

  const handleDeleteItemType = async (itemTypeId: string, itemTypeSlug: string) => {
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('product_type', itemTypeSlug);

    if (count && count > 0) {
      alert(`Cannot delete: ${count} product(s) use this item type. Reassign them first.`);
      return;
    }

    if (!confirm('Delete this item type?')) return;

    const { error } = await supabase.from('category_item_types').delete().eq('id', itemTypeId);
    if (!error) fetchCategories();
  };

  const handleMoveProduct = async (
    productId: string,
    newCategorySlug: string,
    newProductType: string
  ) => {
    const { error } = await supabase
      .from('products')
      .update({ category: newCategorySlug, product_type: newProductType })
      .eq('id', productId);
    return !error;
  };

  // ─── Shared Helpers ──────────────────────────────────────────────────────────

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending:   'bg-yellow-100 text-yellow-800 border-yellow-200',
      verified:  'bg-green-100 text-green-800 border-green-200',
      failed:    'bg-red-100 text-red-800 border-red-200',
      trial:     'bg-blue-100 text-blue-800 border-blue-200',
      active:    'bg-green-100 text-green-800 border-green-200',
      suspended: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  return {
    // Tab
    activeTab,
    setActiveTab,

    // Delivery
    deliverySettings,
    editingDelivery,
    setEditingDelivery,
    newDeliveryFee,
    setNewDeliveryFee,
    handleUpdateDeliveryFee,
    getDeliveryFee,

    // Retailers
    retailers,
    loadingRetailers,
    fetchRetailers,

    // Payments
    paymentLoading,
    paymentMethods,
    setPaymentMethods,
    transferDetails,
    setTransferDetails,
    handleSavePaymentSettings,

    // Categories
    categories,
    categoriesLoading,
    newCategoryName,
    setNewCategoryName,
    newItemTypeInputs,
    setNewItemTypeInputs,
    categoryError,
    setCategoryError,
    handleAddCategory,
    handleDeleteCategory,
    handleAddItemType,
    handleDeleteItemType,
    handleMoveProduct,
    fetchCategories,

    // Shared
    getStatusBadge,
    formatDate,
  };
}