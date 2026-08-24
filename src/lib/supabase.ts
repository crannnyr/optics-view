import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_40fcd5db1faf26904bc078a6691e2ed71f6a0901';

// ── Session management utilities ──────────────────────────────────────────────
export function clearAuthTokens() {
  Object.keys(localStorage)
    .filter(key => key.startsWith('sb-'))
    .forEach(key => localStorage.removeItem(key));
}

let _intentionalSignOut = false;
export const markIntentionalSignOut = () => { _intentionalSignOut = true; };
export const wasIntentionalSignOut  = () => _intentionalSignOut;
export const resetSignOutFlag       = () => { _intentionalSignOut = false; };

// --- Database Types ---

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  compare_at_price?: number;
  cost_price?: number;
  wholesale_price?: number;
  wholesale_min_qty?: number;
  image_url: string;
  images: string[];
  stock: number;
  category: string;
  product_type?: string;
  supplier?: string;
  units_sold: number; 
  // Product variants
  color_options?: string[];
  type_options?: string[];
  size_options?: string[];
  video_urls?: string[];
  custom_delivery_fee?: number;

  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  owner_tag: 'Joshua' | 'Henry' | 'Company';
  is_active: boolean;
}

export interface Order {
  id: string;
  user_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_address: string;
  shipping_state?: string;
  shipping_city?: string;
  shipping_area?: string;
  payment_sender_name?: string;
  total_amount: number;
  status: 'pending' | 'approved' | 'shipped' | 'pickup' | 'delivered' | 'rejected';
  payment_type?: 'full' | 'installment';
  amount_paid?: number;
  remaining_balance?: number;
  is_fully_paid?: boolean;
  paystack_reference?: string;
  paystack_access_code?: string;
  payment_verified_via?: 'manual' | 'paystack';
  created_at: string;
  verified_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  rejected_at?: string;
}

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  payment_proof_url?: string;
  bank_account_id?: string;
  status: 'pending' | 'approved' | 'rejected';  // was 'verified' — DB only allows 'approved'
  payment_number?: number;
  is_balance_payment?: boolean;
  paystack_reference?: string;
  paystack_authorization_code?: string;
  created_at: string;
  verified_at?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  partner_name?: string;
  incurred_date: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  selected_color?: string;
  selected_type?: string;
  selected_size?: string;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedType?: string;
  selectedSize?: string;  // ← added
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
  paystack_reference?: string;
  payment_status: 'pending' | 'verified' | 'failed';
  subscription_status: 'trial' | 'active' | 'suspended';
  trial_ends_at?: string;
  created_at: string;
  verified_at?: string;
}

export interface RetailerSubscription {
  id: string;
  retailer_id: string;
  billing_period_start: string;
  billing_period_end: string;
  amount: number;
  paystack_reference?: string;
  payment_status: 'pending' | 'paid' | 'overdue';
  paid_at?: string;
  created_at: string;
}

export interface ComboProduct {
  id: string;
  name: string;
  description?: string;
  product_1_id: string;
  product_2_id: string;
  product_1_image_url: string;
  product_2_image_url: string;
  original_total_price: number;
  combo_price: number;
  discount_percentage: number;
  stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PickupStation {
  id: string;
  name: string;
  state: string;
  address: string;
  landmark?: string;
  latitude: number;
  longitude: number;
}

export const initializePaystack = (email: string, amount: number, reference: string, metadata?: any) => {
  return {
    key: PAYSTACK_PUBLIC_KEY,
    email,
    amount: amount * 100,
    ref: reference,
    metadata: metadata || {},
    currency: 'NGN',
  };
};
