'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { transactionsApi } from '@/lib/transactions';
import { TransactionForm } from '@/components/TransactionForm';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { Transaction, UpdateTransactionDto } from '@/types';
import { toast } from 'sonner';
import { ApiException } from '@/lib/api';

export default function EditTransactionPage() {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoadingTransaction, setIsLoadingTransaction] = useState(true);
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const transactionId = params.id as string;
  const t = useTranslations('transactions');
  const tCommon = useTranslations('common');

  useEffect(() => {
    if (isAuthenticated && transactionId) {
      loadTransaction();
    }
  }, [isAuthenticated, transactionId]);

  const loadTransaction = async () => {
    try {
      const data = await transactionsApi.getById(transactionId);
      setTransaction(data);
    } catch (error) {
      if (error instanceof ApiException) {
        if (error.statusCode === 404) {
          toast.error(t('failedToLoadSingle'));
          router.push('/transactions');
          return;
        }
        if (error.statusCode === 401) {
          logout();
          router.push('/login');
          return;
        }
        toast.error(error.message);
      } else {
        toast.error(t('failedToLoadSingle'));
      }
      router.push('/transactions');
    } finally {
      setIsLoadingTransaction(false);
    }
  };

  const handleUpdate = async (data: UpdateTransactionDto) => {
    await transactionsApi.update(transactionId, data);
  };

  // Convert ISO date to YYYY-MM-DD format for the date input
  const formatDateForInput = (isoDate: string): string => {
    const date = new Date(isoDate);
    return date.toISOString().split('T')[0];
  };

  return (
    <AuthLayout>
      <div className="flex justify-center">
        {isLoadingTransaction ? (
          <p className="text-gray-500">{tCommon('loading')}</p>
        ) : transaction ? (
          <TransactionForm
            title={t('editTitle')}
            submitLabel={tCommon('save')}
            initialData={{
              amount: parseFloat(transaction.amount),
              categoryId: transaction.categoryId,
              date: formatDateForInput(transaction.date),
              description: transaction.description,
            }}
            onSubmit={handleUpdate}
          />
        ) : null}
      </div>
    </AuthLayout>
  );
}
