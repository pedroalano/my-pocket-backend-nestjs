import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
  ApiGetProfile,
  ApiUpdateProfile,
  ApiUpdatePassword,
  ApiUpdateEmail,
  ApiDeleteAccount,
} from './users.swagger';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { JwtAuthGuard } from '../auths/jwt-auth.guard';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiGetProfile()
  async getProfile(@Req() req: { user: { userId: string } }) {
    return this.usersService.getProfile(req.user.userId);
  }

  @Patch('me')
  @ApiUpdateProfile()
  async updateProfile(
    @Req() req: { user: { userId: string } },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.userId, dto);
  }

  @Patch('me/password')
  @HttpCode(HttpStatus.OK)
  @ApiUpdatePassword()
  async updatePassword(
    @Req() req: { user: { userId: string } },
    @Body() dto: UpdatePasswordDto,
  ): Promise<void> {
    return this.usersService.updatePassword(req.user.userId, dto);
  }

  @Patch('me/email')
  @ApiUpdateEmail()
  async updateEmail(
    @Req() req: { user: { userId: string } },
    @Body() dto: UpdateEmailDto,
  ) {
    return this.usersService.updateEmail(req.user.userId, dto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDeleteAccount()
  async deleteAccount(@Req() req: { user: { userId: string } }): Promise<void> {
    return this.usersService.deleteAccount(req.user.userId);
  }
}
