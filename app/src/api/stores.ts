import api from './client';
import type { ApiResponse, Store, MenuItem, StoresResponse, MenuListResponse, MenuMutationResponse } from './types';

export const storesApi = {
  list: () => api.get<ApiResponse<StoresResponse>>('/stores'),

  get: (id: string) => api.get<ApiResponse<{ store: Store } | Store>>('/stores/' + id),

  menu: (id: string) => api.get<ApiResponse<MenuListResponse>>('/stores/' + id + '/menu'),

  update: (id: string, formData: FormData) =>
    api.put<ApiResponse<Store>>('/stores/' + id, formData),
};

export const menuApi = {
  create: (formData: FormData) => api.post<ApiResponse<MenuMutationResponse>>('/menu', formData),

  update: (id: string, formData: FormData) =>
    api.put<ApiResponse<MenuMutationResponse>>('/menu/' + id, formData),

  delete: (id: string) => api.delete('/menu/' + id),

  toggleAvailability: (id: string) =>
    api.patch<ApiResponse<MenuMutationResponse>>('/menu/' + id + '/availability'),
};

function resolveStores(raw: StoresResponse | Store[] | Record<string, Store[]>): Store[] {
  if (Array.isArray(raw)) return raw;
  if ('stores' in raw) return raw.stores;
  return [];
}

function resolveMenuItems(raw: MenuListResponse | MenuItem[] | undefined): MenuItem[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if ('menuItems' in raw) return raw.menuItems ?? [];
  return [];
}

export { resolveStores, resolveMenuItems };