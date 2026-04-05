import api from './client';
import type { ApiResponse, Order, CheckoutSession, CartItem } from './types';

export interface CreateOrderPayload {
  checkoutToken: string;
  transaction_id?: string;
}

export const ordersApi = {
  checkoutSession: (storeId: string, items: { menuItemId: string; quantity: number }[], specialInstructions?: string) =>
    api.post<ApiResponse<CheckoutSession>>('/orders/checkout-session', { storeId, items, specialInstructions }),

  create: (payload: CreateOrderPayload) =>
    api.post<ApiResponse<Order>>('/orders', payload),

  list: (params?: { status?: string }) =>
    api.get<ApiResponse<Order[]>>('/orders', { params }),

  get: (id: string) => api.get<ApiResponse<Order>>(`/orders/${id}`),

  pollStatus: (id: string) =>
    api.get<ApiResponse<{ order_status: string; payment_status: string; otp?: string }>>(`/orders/${id}/poll-status`),

  confirmPayment: (id: string, transactionId?: string) =>
    api.patch<ApiResponse<Order>>(`/orders/${id}/payment-status`, { transaction_id: transactionId }),

  updateStatus: (id: string, status: string) =>
    api.patch<ApiResponse<Order>>(`/orders/${id}/status`, { status }),

  verifyOtp: (id: string, otp: string) =>
    api.post<ApiResponse<Order>>(`/orders/${id}/verify-otp`, { otp }),

  confirmCommitment: (id: string) =>
    api.post<ApiResponse<Order>>(`/orders/${id}/confirm-commitment`),
};
