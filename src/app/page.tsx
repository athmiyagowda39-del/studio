
'use client';

import { useAuthContext } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import DashboardPage from './dashboard/page';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home({ children }: { children?: React.ReactNode }) {
  const { user, isUserLoading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  // If there are children, render them, otherwise default to DashboardPage
  return children || <DashboardPage />;
}
