/*
  Warnings:

  - The values [SAVINGS] on the enum `BudgetType` will be renamed to INCOME.

*/
-- AlterEnum - Rename SAVINGS to INCOME in BudgetType
ALTER TYPE "BudgetType" RENAME VALUE 'SAVINGS' TO 'INCOME';
