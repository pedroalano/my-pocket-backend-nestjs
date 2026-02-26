import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

function isSafeTestDatabaseUrl(databaseUrl: string) {
  const lower = databaseUrl.toLowerCase();

  try {
    const parsed = new URL(databaseUrl);
    const host = parsed.hostname.toLowerCase();
    const databaseName = parsed.pathname.replace('/', '').toLowerCase();

    return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.includes('test') ||
      databaseName.includes('test')
    );
  } catch {
    return (
      lower.includes('localhost') ||
      lower.includes('127.0.0.1') ||
      lower.includes('test')
    );
  }
}

function assertTestDatabaseUrl(databaseUrl: string | undefined) {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set for tests.');
  }

  if (!isSafeTestDatabaseUrl(databaseUrl)) {
    throw new Error(
      'Refusing to connect to a non-test database while NODE_ENV=test.',
    );
  }
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super();

    if (process.env.NODE_ENV === 'test') {
      assertTestDatabaseUrl(process.env.DATABASE_URL);
    }
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
