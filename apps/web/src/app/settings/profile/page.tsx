'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { usersApi } from '@/lib/users';
import { ApiException } from '@/lib/api';
import { UserProfile } from '@/types';

export default function SettingsProfilePage() {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const { updateUser, logout } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Profile form state
  const [name, setName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  // Email form state
  const [email, setEmail] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Delete state
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    usersApi
      .getProfile()
      .then((data) => {
        setProfile(data);
        setName(data.name);
        setEmail(data.email);
      })
      .catch(() => {
        setLoadError(t('loadError'));
      });
  }, [t]);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingName(true);
    try {
      const updated = await usersApi.updateProfile({ name });
      setProfile(updated);
      updateUser({ name: updated.name });
      toast.success(t('nameUpdateSuccess'));
    } catch (err) {
      const message =
        err instanceof ApiException ? err.message : tCommon('unexpectedError');
      toast.error(message);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingEmail(true);
    try {
      const updated = await usersApi.updateEmail({ email });
      setProfile(updated);
      updateUser({ email: updated.email });
      toast.success(t('emailUpdateSuccess'));
    } catch (err) {
      const message =
        err instanceof ApiException ? err.message : tCommon('unexpectedError');
      toast.error(message);
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword !== confirmNewPassword) {
      setPasswordError(t('passwordMismatch'));
      return;
    }

    setIsChangingPassword(true);
    try {
      await usersApi.updatePassword({ currentPassword, newPassword });
      toast.success(t('passwordUpdateSuccess'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => {
        logout();
        router.push('/login');
      }, 2000);
    } catch (err) {
      const message =
        err instanceof ApiException ? err.message : tCommon('unexpectedError');
      toast.error(message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await usersApi.deleteAccount();
      logout();
      router.push('/');
    } catch (err) {
      const message =
        err instanceof ApiException ? err.message : tCommon('unexpectedError');
      toast.error(message);
      setIsDeleting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>

        {loadError && (
          <p className="text-destructive text-sm">{loadError}</p>
        )}

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('profileCard')}</CardTitle>
            <CardDescription>{t('profileDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveName} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('name')}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('namePlaceholder')}
                  disabled={!profile}
                />
              </div>
              <Button type="submit" disabled={isSavingName || !profile}>
                {isSavingName ? t('savingName') : t('saveName')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('accountCard')}</CardTitle>
            <CardDescription>{t('accountDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email section */}
            <form onSubmit={handleUpdateEmail} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('emailPlaceholder')}
                  disabled={!profile}
                />
              </div>
              <Button type="submit" disabled={isUpdatingEmail || !profile}>
                {isUpdatingEmail ? t('updatingEmail') : t('updateEmail')}
              </Button>
            </form>

            <Separator />

            {/* Password section */}
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">{t('currentPassword')}</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t('newPassword')}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword">
                  {t('confirmNewPassword')}
                </Label>
                <Input
                  id="confirmNewPassword"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                />
              </div>
              {passwordError && (
                <p className="text-destructive text-sm">{passwordError}</p>
              )}
              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? t('changingPassword') : t('changePassword')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Danger Zone Card */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">{t('dangerCard')}</CardTitle>
            <CardDescription>{t('dangerDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  {t('deleteAccount')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('deleteAccountTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('deleteAccountDescription')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {t('deleteAccountConfirm')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}
