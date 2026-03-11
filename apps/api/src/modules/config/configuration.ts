import { registerAs } from '@nestjs/config';

const parseNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  server: {
    port: parseNumber(process.env.PORT, 3000),
  },
}));

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  expiresInSeconds: parseNumber(process.env.JWT_EXPIRATION, 900),
  refreshExpiresInSeconds: parseNumber(
    process.env.JWT_REFRESH_EXPIRATION,
    604800,
  ),
}));

export const configurations = [appConfig, databaseConfig, jwtConfig];
