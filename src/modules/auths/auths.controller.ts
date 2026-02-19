import { Body, Controller, Post } from '@nestjs/common';
import { AuthsService } from './auths.service';
import { RegisterDto } from './dto/register.dto';

@Controller('auths')
export class AuthsController {
  constructor(private readonly authsService: AuthsService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authsService.register(registerDto);
  }
}
