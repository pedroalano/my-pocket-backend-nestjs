'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { categoriesApi } from '@/lib/categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { ApiException } from '@/lib/api';

const PRESETS = [
  { key: 'Salary', type: 'INCOME' },
  { key: 'Freelance', type: 'INCOME' },
  { key: 'Investments', type: 'INCOME' },
  { key: 'Food', type: 'EXPENSE' },
  { key: 'Transport', type: 'EXPENSE' },
  { key: 'Housing', type: 'EXPENSE' },
  { key: 'Entertainment', type: 'EXPENSE' },
  { key: 'Healthcare', type: 'EXPENSE' },
  { key: 'Utilities', type: 'EXPENSE' },
  { key: 'Shopping', type: 'EXPENSE' },
  { key: 'Education', type: 'EXPENSE' },
] as const;

type PresetKey = (typeof PRESETS)[number]['key'];

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'register' | 'presets'>('register');
  const [selectedPresets, setSelectedPresets] = useState<Set<PresetKey>>(
    () => new Set(PRESETS.map((p) => p.key)),
  );
  const { register } = useAuth();
  const router = useRouter();
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const tPreset = useTranslations('presetCategories');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await register({ name, email, password });
      toast.success(t('registerSuccess'));
      setStep('presets');
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

  const togglePreset = (key: PresetKey) => {
    setSelectedPresets((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleGetStarted = async () => {
    if (selectedPresets.size === 0) {
      router.push('/dashboard');
      return;
    }

    setIsLoading(true);
    try {
      const payload = PRESETS.filter((p) => selectedPresets.has(p.key)).map(
        (p) => ({
          name: tPreset(`names.${p.key}`),
          type: p.type,
        }),
      );

      await categoriesApi.batchCreate(payload);
      toast.success(tPreset('successToast'));
      router.push('/dashboard');
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

  const handleSkip = () => {
    router.push('/dashboard');
  };

  if (step === 'presets') {
    const incomePresets = PRESETS.filter((p) => p.type === 'INCOME');
    const expensePresets = PRESETS.filter((p) => p.type === 'EXPENSE');

    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {tPreset('stepTitle')}
            </CardTitle>
            <CardDescription className="text-center">
              {tPreset('stepSubtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {tPreset('incomeGroup')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {incomePresets.map((preset) => {
                  const selected = selectedPresets.has(preset.key);
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => togglePreset(preset.key)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        selected
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground border-border hover:bg-muted'
                      }`}
                    >
                      {selected && <Check className="h-3 w-3" />}
                      {tPreset(`names.${preset.key}`)}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {tPreset('expenseGroup')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {expensePresets.map((preset) => {
                  const selected = selectedPresets.has(preset.key);
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => togglePreset(preset.key)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        selected
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground border-border hover:bg-muted'
                      }`}
                    >
                      {selected && <Check className="h-3 w-3" />}
                      {tPreset(`names.${preset.key}`)}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <Button
              className="w-full"
              onClick={handleGetStarted}
              disabled={isLoading}
            >
              {isLoading ? tPreset('creating') : tPreset('getStarted')}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={handleSkip}
              disabled={isLoading}
            >
              {tPreset('skip')}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {t('createAccount')}
          </CardTitle>
          <CardDescription className="text-center">
            {t('enterDetails')}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('fullName')}</Label>
              <Input
                id="name"
                type="text"
                placeholder={t('namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                  aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="mt-4 flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('creatingAccount') : t('createAccount')}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              {t('alreadyHaveAccount')}{' '}
              <Link href="/login" className="text-primary hover:underline">
                {t('signIn')}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
