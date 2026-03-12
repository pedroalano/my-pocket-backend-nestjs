import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { AuthsService } from './auths.service';
import { ApiRegister, ApiLogin, ApiRefresh, ApiLogout } from './auths.swagger';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auths')
export class AuthsController {
  constructor(private readonly authsService: AuthsService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiRegister()
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authsService.register(registerDto);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiLogin()
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authsService.login(loginDto);
  }

  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiRefresh()
  async refresh(@Body() refreshDto: RefreshDto): Promise<AuthResponseDto> {
    return this.authsService.refresh(refreshDto.refresh_token);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiLogout()
  async logout(
    @Req() req: { user: { userId: string } },
  ): Promise<{ message: string }> {
    await this.authsService.logout(req.user.userId);
    return { message: 'Logged out successfully' };
  }
}
