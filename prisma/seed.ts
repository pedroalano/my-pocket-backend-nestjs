import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create default user
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@example.com',
      password: 'password123', // Note: This is just for seeding. In production, use hashed passwords.
    },
  });
  console.log(`✓ Upserted user: ${user.email}`);

  // Income categories
  const incomeCategories = [
    { name: 'Salary', type: 'INCOME' },
    { name: 'Freelance', type: 'INCOME' },
    { name: 'Investments', type: 'INCOME' },
  ];

  // Expense categories
  const expenseCategories = [
    { name: 'Food', type: 'EXPENSE' },
    { name: 'Transport', type: 'EXPENSE' },
    { name: 'Housing', type: 'EXPENSE' },
    { name: 'Entertainment', type: 'EXPENSE' },
    { name: 'Healthcare', type: 'EXPENSE' },
    { name: 'Utilities', type: 'EXPENSE' },
    { name: 'Shopping', type: 'EXPENSE' },
    { name: 'Education', type: 'EXPENSE' },
  ];

  const allCategories = [...incomeCategories, ...expenseCategories];

  // Upsert categories
  for (const category of allCategories) {
    await prisma.category.upsert({
      where: {
        name_type_userId: {
          name: category.name,
          type: category.type as 'INCOME' | 'EXPENSE',
          userId: user.id,
        },
      },
      update: {},
      create: {
        name: category.name,
        type: category.type as 'INCOME' | 'EXPENSE',
        userId: user.id,
      },
    });
    console.log(`✓ Upserted category: ${category.name} (${category.type})`);
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
