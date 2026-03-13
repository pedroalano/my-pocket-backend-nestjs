import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateEmailDto } from './dto/update-email.dto';

export function ApiGetProfile() {
  return applyDecorators(
    ApiOperation({ summary: 'Get current user profile' }),
    ApiResponse({
      status: 200,
      description: 'User profile returned successfully',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}

export function ApiUpdateProfile() {
  return applyDecorators(
    ApiOperation({ summary: 'Update user name' }),
    ApiBody({ type: UpdateProfileDto }),
    ApiResponse({ status: 200, description: 'Profile updated successfully' }),
    ApiResponse({ status: 400, description: 'Bad request' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}

export function ApiUpdatePassword() {
  return applyDecorators(
    ApiOperation({ summary: 'Update user password' }),
    ApiBody({ type: UpdatePasswordDto }),
    ApiResponse({ status: 200, description: 'Password updated successfully' }),
    ApiResponse({ status: 400, description: 'Bad request' }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - incorrect current password',
    }),
  );
}

export function ApiUpdateEmail() {
  return applyDecorators(
    ApiOperation({ summary: 'Update user email' }),
    ApiBody({ type: UpdateEmailDto }),
    ApiResponse({ status: 200, description: 'Email updated successfully' }),
    ApiResponse({ status: 400, description: 'Bad request' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 409, description: 'Email already exists' }),
  );
}

export function ApiDeleteAccount() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete user account' }),
    ApiResponse({ status: 204, description: 'Account deleted successfully' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
