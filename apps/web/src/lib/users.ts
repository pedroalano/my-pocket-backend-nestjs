import { api } from './api';
import {
  UserProfile,
  UpdateProfileDto,
  UpdateEmailDto,
  UpdatePasswordDto,
} from '@/types';

export const usersApi = {
  getProfile: () => api.get<UserProfile>('/users/me'),

  updateProfile: (data: UpdateProfileDto) =>
    api.patch<UserProfile>('/users/me', data),

  updatePassword: (data: UpdatePasswordDto) =>
    api.patch<void>('/users/me/password', data),

  updateEmail: (data: UpdateEmailDto) =>
    api.patch<UserProfile>('/users/me/email', data),

  deleteAccount: () => api.delete<void>('/users/me'),
};
