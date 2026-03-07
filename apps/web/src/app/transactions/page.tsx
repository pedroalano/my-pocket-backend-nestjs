'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { transactionsApi } from '@/lib/transactions';
import { categoriesApi } from '@/lib/categories';
import { Transaction, Category, TransactionType } from '@/types';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { TransactionsTableSkeleton } from '@/components/TransactionsTableSkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ApiException } from '@/lib/api';

type FilterType = 'ALL' | TransactionType;
type FilterCategory = 'ALL' | string;

function formatAmount(amount: string): string {
  const num = parseFloat(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function parseFilterDate(dateString: string): Date | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTransaction, setDeleteTransaction] =
    useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('ALL');
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      const [transactionsData, categoriesData] = await Promise.all([
        transactionsApi.getAll(),
        categoriesApi.getAll(),
      ]);
      setTransactions(transactionsData);
      setCategories(categoriesData);
    } catch (error) {
      if (error instanceof ApiException) {
        if (error.statusCode === 401) {
          logout();
          router.push('/login');
          return;
        }
        toast.error(error.message);
      } else {
        toast.error('Failed to load transactions');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const categoryMap = useMemo(() => {
    return categories.reduce(
      (acc, cat) => {
        acc[cat.id] = cat.name;
        return acc;
      },
      {} as Record<string, string>,
    );
  }, [categories]);

  const filteredTransactions = useMemo(() => {
    const startDate = parseFilterDate(filterStartDate);
    const endDate = parseFilterDate(filterEndDate);

    return transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);

      const matchesStartDate = !startDate || transactionDate >= startDate;
      const matchesEndDate =
        !endDate ||
        transactionDate <=
          new Date(endDate.getTime() + 24 * 60 * 60 * 1000 - 1);
      const matchesType =
        filterType === 'ALL' || transaction.type === filterType;
      const matchesCategory =
        filterCategory === 'ALL' || transaction.categoryId === filterCategory;

      return (
        matchesStartDate && matchesEndDate && matchesType && matchesCategory
      );
    });
  }, [
    transactions,
    filterStartDate,
    filterEndDate,
    filterType,
    filterCategory,
  ]);

  const clearFilters = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterType('ALL');
    setFilterCategory('ALL');
  };

  const handleDelete = async () => {
    if (!deleteTransaction) return;

    setIsDeleting(true);
    try {
      await transactionsApi.delete(deleteTransaction.id);
      setTransactions((prev) =>
        prev.filter((t) => t.id !== deleteTransaction.id),
      );
      toast.success('Transaction deleted successfully');
      setDeleteTransaction(null);
    } catch (error) {
      if (error instanceof ApiException) {
        toast.error(error.message);
      } else {
        toast.error('Failed to delete transaction');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Transactions</h2>
        <Link href="/transactions/new">
          <Button>New Transaction</Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <div className="space-y-1">
          <Label htmlFor="start-date">Start Date</Label>
          <Input
            id="start-date"
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            className="w-[150px]"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="end-date">End Date</Label>
          <Input
            id="end-date"
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            className="w-[150px]"
          />
        </div>

        <Select
          value={filterType}
          onValueChange={(value) => setFilterType(value as FilterType)}
        >
          <SelectTrigger className="w-[150px]" data-testid="type-filter">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="INCOME">Income</SelectItem>
            <SelectItem value="EXPENSE">Expense</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filterCategory}
          onValueChange={(value) => setFilterCategory(value as FilterCategory)}
        >
          <SelectTrigger className="w-[180px]" data-testid="category-filter">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={clearFilters}>
          Clear Filters
        </Button>
      </div>

      <div className="bg-card rounded-lg shadow">
        {isLoading ? (
          <TransactionsTableSkeleton />
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No transactions yet. Create your first transaction to get started.
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No transactions match your filters.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="text-muted-foreground">
                    {formatDate(transaction.date)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {transaction.description || '-'}
                  </TableCell>
                  <TableCell>
                    {categoryMap[transaction.categoryId] || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.type === 'INCOME'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {transaction.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatAmount(transaction.amount)}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Link href={`/transactions/${transaction.id}/edit`}>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteTransaction(transaction)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog
        open={!!deleteTransaction}
        onOpenChange={() => setDeleteTransaction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTransaction(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthLayout>
  );
}
