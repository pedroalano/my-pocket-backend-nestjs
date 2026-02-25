import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Reset database by deleting all records from tables in reverse dependency order
 * Called before e2e tests run to ensure clean state
 */
async function setupTestDatabase() {
  try {
    console.log('🔧 Setting up test database...');

    // Test connection
    await prisma.$executeRawUnsafe('SELECT 1');
    console.log('✅ Database connection successful');

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
