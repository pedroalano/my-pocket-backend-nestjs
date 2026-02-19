import { ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../shared/prisma.service';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ access_token: string }> {
    const { name, email, password } = registerDto;

    // Hash password with bcrypt (10 salt rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      // Create user in database
      const user = await this.prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      // Generate and return JWT token
      return this.generateToken(user.id, user.email);
    } catch (error: any) {
      // Handle Prisma unique constraint violation (P2002)
      if (error.code === 'P2002') {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async generateToken(
    userId: string,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = { userId, email };
    const access_token = await this.jwtService.signAsync(payload);

    return { access_token };
  }
}
