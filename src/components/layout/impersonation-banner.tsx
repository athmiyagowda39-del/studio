
'use client';

import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { UserCheck } from 'lucide-react';

export default function ImpersonationBanner() {
  const { user, isImpersonating, stopImpersonation } = useApp();

  if (!isImpersonating) {
    return null;
  }

  return (
    <div className="bg-yellow-400 text-yellow-900 p-3 flex items-center justify-center gap-4 text-sm font-semibold sticky top-16 z-20 shadow-md">
      <UserCheck className="h-5 w-5" />
      <span>
        You are currently viewing the dashboard as{' '}
        <span className="font-bold">{user?.username}</span>.
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={stopImpersonation}
        className="text-yellow-900 hover:bg-yellow-500 hover:text-yellow-950 h-auto py-1 px-3"
      >
        Return to Admin View
      </Button>
    </div>
  );
}
