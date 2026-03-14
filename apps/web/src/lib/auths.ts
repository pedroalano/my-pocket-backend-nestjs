import { ForgotPasswordDto, MessageResponse, ResetPasswordDto } from '@/types';
import { api } from './api';

export const authsApi = {
  forgotPassword: (data: ForgotPasswordDto) =>
    api.post<MessageResponse>('/auths/forgot-password', data),

  resetPassword: (data: ResetPasswordDto) =>
    api.post<MessageResponse>('/auths/reset-password', data),
};
