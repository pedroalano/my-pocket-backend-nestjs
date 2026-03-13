import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { I18nService, I18nContext } from 'nestjs-i18n';
import { PrismaService } from '../shared/prisma.service';
import * as bcrypt from 'bcryptjs';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateEmailDto } from './dto/update-email.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  private get lang(): string {
    return I18nContext.current()?.lang ?? 'en';
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    if (!user) {
      throw new NotFoundException(
        this.i18n.t('users.errors.notFound', { lang: this.lang }),
      );
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException(
        this.i18n.t('users.errors.notFound', { lang: this.lang }),
      );
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { name: dto.name },
      select: { id: true, name: true, email: true, createdAt: true },
    });
  }

  async updatePassword(userId: string, dto: UpdatePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(
        this.i18n.t('users.errors.notFound', { lang: this.lang }),
      );
    }

    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        this.i18n.t('users.errors.incorrectPassword', { lang: this.lang }),
      );
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword, refreshToken: null },
    });
  }

  async updateEmail(userId: string, dto: UpdateEmailDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException(
        this.i18n.t('users.errors.notFound', { lang: this.lang }),
      );
    }

    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: { email: dto.email },
        select: { id: true, name: true, email: true, createdAt: true },
      });
    } catch (error) {
      const isPrismaError =
        error instanceof Prisma.PrismaClientKnownRequestError ||
        (typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          typeof (error as { code: unknown }).code === 'string');
      if (isPrismaError && (error as { code: string }).code === 'P2002') {
        throw new ConflictException(
          this.i18n.t('users.errors.emailAlreadyExists', { lang: this.lang }),
        );
      }
      throw error;
    }
  }

  async deleteAccount(userId: string): Promise<void> {
    await this.prisma.user.delete({ where: { id: userId } });
  }
}
