'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { budgetsApi } from '@/lib/budgets';
import { BudgetDetails } from '@/components/BudgetDetails';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { BudgetWithDetails } from '@/types';
import { toast } from 'sonner';
import { ApiException } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

function BudgetDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function BudgetDetailsPage() {
  const [budget, setBudget] = useState<BudgetWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const budgetId = params.id as string;

  useEffect(() => {
    if (isAuthenticated && budgetId) {
      loadBudgetDetails();
    }
  }, [isAuthenticated, budgetId]);

  const loadBudgetDetails = async () => {
    try {
      const data = await budgetsApi.getDetails(budgetId);
      setBudget(data);
    } catch (error) {
      if (error instanceof ApiException) {
        if (error.statusCode === 404) {
          toast.error('Budget not found');
          router.push('/budgets');
          return;
        }
        if (error.statusCode === 401) {
          logout();
          router.push('/login');
          return;
        }
        toast.error(error.message);
      } else {
        toast.error('Failed to load budget details');
      }
      router.push('/budgets');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold text-foreground mb-6">
          Budget Details
        </h2>
        {isLoading ? (
          <BudgetDetailsSkeleton />
        ) : budget ? (
          <BudgetDetails budget={budget} />
        ) : null}
      </div>
    </AuthLayout>
  );
}
