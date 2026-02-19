import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthsService } from './auths.service';
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
        const secret = configService.get<string>('JWT_SECRET');
        const expiresIn = configService.get<number>('JWT_EXPIRATION');

        if (!secret) {
          throw new Error('JWT_SECRET is not defined in environment variables');
        }

        if (!expiresIn) {
          throw new Error(
            'JWT_EXPIRATION is not defined in environment variables',
          );
        }

        return {
          secret,
          signOptions: {
            expiresIn: `${expiresIn}s`,
          },
        };
      },
    }),
  ],
  controllers: [AuthsController],
  providers: [AuthsService, JwtStrategy, JwtAuthGuard],
  exports: [AuthsService, JwtAuthGuard],
})
export class AuthsModule {}
