'use client';

import { transactionsApi } from '@/lib/transactions';
import { TransactionForm } from '@/components/TransactionForm';
import { AuthLayout } from '@/components/layouts/AuthLayout';

export default function NewTransactionPage() {
  return (
    <AuthLayout>
      <div className="flex justify-center">
        <TransactionForm
          title="Create Transaction"
          submitLabel="Create"
          onSubmit={transactionsApi.create}
        />
      </div>
    </AuthLayout>
  );
}
