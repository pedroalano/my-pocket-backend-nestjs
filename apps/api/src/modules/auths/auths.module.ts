import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthsService } from './auths.service';
import { PasswordResetService } from './password-reset.service';
import { AuthsController } from './auths.controller';
import { SharedModule } from '../shared/shared.module';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [
    SharedModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.getOrThrow<string>('jwt.secret');
        const expiresIn = configService.getOrThrow<number>(
          'jwt.expiresInSeconds',
        );

        return {
          secret,
          signOptions: {
            expiresIn,
          },
        };
      },
    }),
  ],
  controllers: [AuthsController],
  providers: [AuthsService, PasswordResetService, JwtStrategy, JwtAuthGuard],
  exports: [AuthsService, JwtAuthGuard],
})
export class AuthsModule {}
