'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
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
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CreateTransactionDto, Category } from '@/types';
import { toast } from 'sonner';
import { ApiException } from '@/lib/api';
import { categoriesApi } from '@/lib/categories';

interface TransactionFormProps {
  initialData?: {
    amount: number;
    categoryId: string;
    date: string;
    description?: string;
  };
  onSubmit: (data: CreateTransactionDto) => Promise<unknown>;
  title: string;
  submitLabel: string;
}

export function TransactionForm({
  initialData,
  onSubmit,
  title,
  submitLabel,
}: TransactionFormProps) {
  const [amount, setAmount] = useState<string>(
    initialData?.amount?.toString() || '',
  );
  const [categoryId, setCategoryId] = useState<string>(
    initialData?.categoryId || '',
  );
  const [date, setDate] = useState<string>(initialData?.date || '');
  const [description, setDescription] = useState<string>(
    initialData?.description || '',
  );
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const router = useRouter();
  const t = useTranslations('transactionForm');
  const tCommon = useTranslations('common');

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await categoriesApi.getAll();
        setCategories(data);
      } catch {
        toast.error(t('failedToLoadCategories'));
      } finally {
        setIsLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amountNum = parseFloat(amount);

    if (!amount || isNaN(amountNum)) {
      toast.error(t('amountRequired'));
      return;
    }

    if (amountNum <= 0) {
      toast.error(t('amountPositive'));
      return;
    }

    if (!categoryId) {
      toast.error(t('categoryRequired'));
      return;
    }

    if (!date) {
      toast.error(t('dateRequired'));
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({
        amount: amountNum,
        categoryId,
        date: new Date(date).toISOString(),
        description: description || undefined,
      });
      toast.success(initialData ? t('updateSuccess') : t('createSuccess'));
      router.push('/transactions');
    } catch (error) {
      if (error instanceof ApiException) {
        toast.error(error.message);
      } else {
        toast.error(tCommon('unexpectedError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">{tCommon('amount')}</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder={t('amountPlaceholder')}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">{tCommon('category')}</Label>
            {isLoadingCategories ? (
              <div className="text-sm text-muted-foreground">
                {t('loadingCategories')}
              </div>
            ) : (
              <Select
                value={categoryId}
                onValueChange={setCategoryId}
                disabled={isLoading}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder={t('selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">{tCommon('date')}</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('descriptionOptional')}</Label>
            <Input
              id="description"
              type="text"
              placeholder={t('descriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter className="mt-4 flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/transactions')}
            disabled={isLoading}
          >
            {tCommon('cancel')}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? tCommon('saving') : submitLabel}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
