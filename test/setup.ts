import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const envFilePath = path.resolve(process.cwd(), '.env.test');

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Test env file not found at ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

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
      'Refusing to run tests against a non-test database URL. Check .env.test.',
    );
  }
}

async function assertTestSchema(prisma: PrismaClient) {
  const [transactionTable] = await prisma.$queryRawUnsafe<
    Array<{ table_name: string | null }>
  >('SELECT to_regclass(\'public."Transaction"\')::text AS table_name');

  if (!transactionTable?.table_name) {
    throw new Error(
      'Test database schema is missing. Run migrations against the test database before running e2e tests.',
    );
  }
}

/**
 * Reset database by deleting all records from tables in reverse dependency order
 * Called before e2e tests run to ensure clean state
 */
async function setupTestDatabase() {
  loadEnvFile(envFilePath);
  assertTestDatabaseUrl(process.env.DATABASE_URL);
  const prisma = new PrismaClient();

  try {
    console.log('🔧 Setting up test database...');

    // Test connection
    await prisma.$executeRawUnsafe('SELECT 1');
    console.log('✅ Database connection successful');

    await assertTestSchema(prisma);

    // Delete in reverse order of foreign key dependencies
    await prisma.transaction.deleteMany({});
    console.log('✅ Cleared transactions');

    await prisma.budget.deleteMany({});
    console.log('✅ Cleared budgets');

    await prisma.category.deleteMany({});
    console.log('✅ Cleared categories');

    await prisma.user.deleteMany({});
    console.log('✅ Cleared users');

    console.log('✅ Test database reset successfully');
  } catch (error) {
    console.error('❌ Error setting up test database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

beforeAll(async () => {
  await setupTestDatabase();
});
