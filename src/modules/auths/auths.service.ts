import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../shared/prisma.service';

@Injectable()
export class AuthsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async generateToken(
    userId: string,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = { userId, email };
    const access_token = await this.jwtService.signAsync(payload);

    return { access_token };
  }
}
