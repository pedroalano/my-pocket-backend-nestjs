'use client';

import Link from 'next/link';
import { BudgetWithDetails, BudgetType } from '@/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface BudgetDetailsProps {
  budget: BudgetWithDetails;
}

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

function formatAmount(amount: string): string {
  const num = parseFloat(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}

function formatPeriod(month: number, year: number): string {
  const monthObj = MONTHS.find((m) => m.value === month);
  return `${monthObj?.label || month} ${year}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getUtilizationColor(
  percentage: number,
  budgetType: BudgetType,
): string {
  if (budgetType === BudgetType.INCOME) {
    // For INCOME: higher percentage is better (more earned toward goal)
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  }
  // For EXPENSE: lower percentage is better (less spent)
  if (percentage >= 100) return 'bg-red-500';
  if (percentage >= 75) return 'bg-yellow-500';
  return 'bg-green-500';
}

function getUtilizationTextColor(
  percentage: number,
  budgetType: BudgetType,
): string {
  if (budgetType === BudgetType.INCOME) {
    if (percentage >= 75) return 'text-green-600 dark:text-green-400';
    if (percentage >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  }
  if (percentage >= 100) return 'text-red-600 dark:text-red-400';
  if (percentage >= 75) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-green-600 dark:text-green-400';
}

function getProgressValue(budget: BudgetWithDetails): string {
  return budget.type === BudgetType.INCOME ? budget.earned : budget.spent;
}

function getProgressLabel(budgetType: BudgetType): string {
  return budgetType === BudgetType.INCOME ? 'Earned' : 'Spent';
}

export function BudgetDetails({ budget }: BudgetDetailsProps) {
  const utilizationColor = getUtilizationColor(
    budget.utilizationPercentage,
    budget.type,
  );
  const utilizationTextColor = getUtilizationTextColor(
    budget.utilizationPercentage,
    budget.type,
  );
  const progressWidth = Math.min(budget.utilizationPercentage, 100);
  const progressLabel = getProgressLabel(budget.type);
  const progressValue = getProgressValue(budget);

  return (
    <div className="space-y-6">
      {/* Budget Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle data-testid="budget-title">
                {budget.category?.name || 'Unknown Category'}
              </CardTitle>
              <CardDescription>
                {formatPeriod(budget.month, budget.year)}
              </CardDescription>
            </div>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                budget.type === BudgetType.INCOME
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}
              data-testid="budget-type-badge"
            >
              {budget.type}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Budget Amount */}
          <div>
            <p className="text-sm text-muted-foreground">Budget Amount</p>
            <p className="text-2xl font-bold" data-testid="budget-amount">
              {formatAmount(budget.amount)}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Utilization</span>
              <span
                className={`font-medium ${utilizationTextColor}`}
                data-testid="utilization-percentage"
              >
                {budget.utilizationPercentage.toFixed(1)}%
              </span>
            </div>
            <div
              className="h-3 w-full rounded-full bg-muted overflow-hidden"
              data-testid="progress-bar-container"
            >
              <div
                className={`h-full rounded-full transition-all ${utilizationColor}`}
                style={{ width: `${progressWidth}%` }}
                data-testid="progress-bar"
              />
            </div>
          </div>

          {/* Spent/Earned and Remaining */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">{progressLabel}</p>
              <p
                className="text-lg font-semibold text-foreground"
                data-testid="budget-progress-value"
              >
                {formatAmount(progressValue)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p
                className={`text-lg font-semibold ${
                  parseFloat(budget.remaining) < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-foreground'
                }`}
                data-testid="budget-remaining"
              >
                {formatAmount(budget.remaining)}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Link href={`/budgets/${budget.id}/edit`}>
              <Button variant="outline">Edit Budget</Button>
            </Link>
            <Link href="/budgets">
              <Button variant="ghost">Back to Budgets</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Related Transactions</CardTitle>
          <CardDescription>
            Transactions in {budget.category?.name || 'this category'} for{' '}
            {formatPeriod(budget.month, budget.year)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {budget.transactions.length === 0 ? (
            <div
              className="text-center py-8 text-muted-foreground"
              data-testid="no-transactions"
            >
              No transactions found for this budget period.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody data-testid="transactions-table">
                {budget.transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="text-muted-foreground">
                      {formatDate(transaction.date)}
                    </TableCell>
                    <TableCell>
                      {transaction.description || 'No description'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatAmount(transaction.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
