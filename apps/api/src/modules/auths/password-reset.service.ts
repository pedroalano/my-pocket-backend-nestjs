import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nService, I18nContext } from 'nestjs-i18n';
import { Resend } from 'resend';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../shared/prisma.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class PasswordResetService {
  private _resend: Resend | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
  ) {}

  private get resend(): Resend {
    if (!this._resend) {
      const apiKey = this.configService.get<string>('resend.apiKey', '');
      this._resend = new Resend(apiKey);
    }
    return this._resend;
  }

  private get lang(): string {
    return I18nContext.current()?.lang ?? 'en';
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const successMessage = this.i18n.t('auth.success.passwordResetEmailSent', {
      lang: this.lang,
    });

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      return { message: successMessage };
    }

    const plainToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(plainToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const frontendUrl = this.configService.get<string>(
      'frontend.url',
      'http://localhost:3000',
    );
    const fromEmail = this.configService.get<string>(
      'resend.fromEmail',
      'noreply@yourdomain.com',
    );

    await this.resend.emails.send({
      from: fromEmail,
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <p><a href="${frontendUrl}/reset-password?token=${plainToken}">Reset Password</a></p>
        <p>This link expires in 1 hour. If you did not request this, please ignore this email.</p>
      `,
    });

    return { message: successMessage };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const tokenHash = this.hashToken(dto.token);

    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: { tokenHash },
    });

    const isValid =
      resetToken &&
      resetToken.usedAt === null &&
      resetToken.expiresAt > new Date();

    if (!isValid) {
      throw new BadRequestException(
        this.i18n.t('auth.errors.invalidOrExpiredResetToken', {
          lang: this.lang,
        }),
      );
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword, refreshToken: null },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return {
      message: this.i18n.t('auth.success.passwordResetSuccess', {
        lang: this.lang,
      }),
    };
  }
}
