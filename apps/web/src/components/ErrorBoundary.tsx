'use client';

import React, { Component, ReactNode } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-2xl font-bold">
                Something went wrong
              </CardTitle>
              <CardDescription>
                An unexpected error occurred. Please try again or return to the
                home page.
              </CardDescription>
            </CardHeader>
            {this.state.error && (
              <CardContent>
                <div className="rounded-md bg-muted p-3">
                  <p className="text-sm text-muted-foreground font-mono break-all">
                    {this.state.error.message}
                  </p>
                </div>
              </CardContent>
            )}
            <CardFooter className="flex flex-col space-y-2">
              <Button onClick={this.handleRetry} className="w-full">
                Try Again
              </Button>
              <Link href="/categories" className="w-full">
                <Button variant="outline" className="w-full">
                  Go Home
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
