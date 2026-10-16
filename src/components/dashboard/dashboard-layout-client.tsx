'use client';

import { usePathname } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

export function DashboardLayoutClient({
  children,
  userEmail,
  fullName,
}: {
  children: React.ReactNode;
  userEmail: string | null;
  fullName: string | null;
}) {
  const pathname = usePathname();
  const active = pathname === '/dashboard' ? '/dashboard' : pathname;

  return (
    <DashboardShell active={active} userEmail={userEmail} fullName={fullName}>
      {children}
    </DashboardShell>
  );
}
