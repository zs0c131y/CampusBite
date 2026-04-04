import api from './client';
import type { ApiResponse, User } from './types';

export const usersApi = {
  profile: () => api.get<ApiResponse<User>>('/users/profile'),

  update: (payload: Partial<Pick<User, 'name' | 'phone_number'>>) =>
    api.put<ApiResponse<User>>('/users/profile', payload),
};
