import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

export function ApiRegister() {
  return applyDecorators(
    ApiOperation({ summary: 'Register a new user' }),
    ApiBody({ type: RegisterDto }),
    ApiResponse({
      status: 201,
      description: 'User successfully registered',
      type: AuthResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - validation error or email already exists',
    }),
  );
}

export function ApiLogin() {
  return applyDecorators(
    ApiOperation({ summary: 'Login with email and password' }),
    ApiBody({ type: LoginDto }),
    ApiResponse({
      status: 200,
      description: 'Successfully authenticated',
      type: AuthResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Invalid credentials' }),
  );
}

export function ApiRefresh() {
  return applyDecorators(
    ApiOperation({ summary: 'Exchange a refresh token for new tokens' }),
    ApiBody({ type: RefreshDto }),
    ApiResponse({
      status: 200,
      description: 'Tokens refreshed successfully',
      type: AuthResponseDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Invalid or expired refresh token',
    }),
  );
}

export function ApiLogout() {
  return applyDecorators(
    ApiOperation({ summary: 'Logout and invalidate the refresh token' }),
    ApiResponse({ status: 200, description: 'Logged out successfully' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
