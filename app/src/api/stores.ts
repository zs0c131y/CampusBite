import api from './client';
import type { ApiResponse, Store, MenuItem } from './types';

export const storesApi = {
  list: () => api.get<ApiResponse<Store[]>>('/stores'),

  get: (id: string) => api.get<ApiResponse<Store>>(`/stores/${id}`),

  menu: (id: string) => api.get<ApiResponse<{ menu: MenuItem[] }>>(`/stores/${id}/menu`),

  update: (id: string, formData: FormData) =>
    api.put<ApiResponse<Store>>(`/stores/${id}`, formData),
};

export const menuApi = {
  create: (formData: FormData) => api.post<ApiResponse<MenuItem>>('/menu', formData),

  update: (id: string, formData: FormData) =>
    api.put<ApiResponse<MenuItem>>(`/menu/${id}`, formData),

  delete: (id: string) => api.delete(`/menu/${id}`),

  toggleAvailability: (id: string) =>
    api.patch<ApiResponse<MenuItem>>(`/menu/${id}/availability`),
};
