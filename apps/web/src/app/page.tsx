'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <p className="text-muted-foreground">Loading...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">My Pocket</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Personal Finance Management
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button variant="outline" size="lg">
              Sign in
            </Button>
          </Link>
          <Link href="/register">
            <Button size="lg">Get Started</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
