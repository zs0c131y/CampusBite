// ── Shared ────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// ── User ─────────────────────────────────────────────────────────────────────

export type UserRole = 'student' | 'faculty' | 'store_employee';
export type TrustTier = 'good' | 'watch' | 'restricted';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  register_number?: string;
  employee_id?: string;
  phone_number?: string;
  is_email_verified: boolean;
  no_show_count: number;
  trust_tier: TrustTier;
  ordering_restricted_until?: string;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export interface OperatingHours {
  open?: string;
  close?: string;
  opening_time?: string;
  closing_time?: string;
}

export interface Store {
  _id: string;
  name: string;
  description?: string;
  upi_id: string;
  owner_id: string;
  is_active: boolean;
  operating_hours?: OperatingHours | string;
  image_url?: string;
  qr_code_url?: string;
  created_at: string;
  updated_at: string;
}

// ── Menu ─────────────────────────────────────────────────────────────────────

export interface MenuItem {
  _id: string;
  store_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category?: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

// ── Cart ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  menuItemId: string;
  storeId: string;
  storeName: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

export interface Cart {
  storeId: string | null;
  storeName: string | null;
  items: CartItem[];
}

// ── Order ─────────────────────────────────────────────────────────────────────

export type PaymentStatus = 'pending' | 'success' | 'failed';
export type OrderStatus =
  | 'placed'
  | 'accepted'
  | 'processing'
  | 'ready'
  | 'picked_up'
  | 'cancelled';

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Order {
  _id: string;
  order_number: string;
  payment_reference: string;
  user_id: string;
  store_id: string | { _id: string; name: string; upi_id: string };
  items: OrderItem[];
  total_amount: number;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  payment_method: string;
  transaction_id?: string;
  special_instructions?: string;
  is_commitment_confirmed: boolean;
  commitment_deadline_at?: string;
  ready_at?: string;
  ready_expires_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  otp?: string;
  otp_expires_at?: string;
  is_otp_verified: boolean;
  created_at: string;
  updated_at: string;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  register_number?: string;
  employee_id?: string;
}

export interface CheckoutSession {
  order_number: string;
  payment_reference: string;
  upi_id: string;
  total_amount: number;
  store_name: string;
}
