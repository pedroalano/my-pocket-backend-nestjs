import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { I18nModule, AcceptLanguageResolver } from 'nestjs-i18n';
import { LoggerModule } from 'nestjs-pino';
import { IncomingMessage } from 'http';
import * as path from 'path';
import { configurations, envValidationSchema } from './modules/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './modules/health/health.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { BudgetModule } from './modules/budgets/budget.module';
import { AuthsModule } from './modules/auths/auths.module';
import { SharedModule } from './modules/shared';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { UsersModule } from './modules/users/users.module';

const envFileMap: Record<string, string> = {
  test: '.env.test',
  docker: '.env.docker',
};

const resolveEnvFilePath = () =>
  envFileMap[process.env.NODE_ENV ?? ''] ?? '.env';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolveEnvFilePath(),
      load: configurations,
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false,
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProduction = config.get('app.nodeEnv') === 'production';
        return {
          pinoHttp: {
            level: config.get<string>('app.logging.level', 'info'),
            transport: isProduction
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: { colorize: true, singleLine: true },
                },
            customProps: (
              req: IncomingMessage & { user?: { userId?: string } },
            ) => ({
              userId: req.user?.userId ?? undefined,
            }),
            autoLogging: {
              ignore: (req: IncomingMessage) => req.url === '/health',
            },
          },
        };
      },
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [AcceptLanguageResolver],
    }),
    SharedModule,
    HealthModule,
    CategoriesModule,
    TransactionsModule,
    BudgetModule,
    AuthsModule,
    DashboardModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
