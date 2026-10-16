import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { DashboardLayoutClient } from '@/components/dashboard/dashboard-layout-client';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', user.id)
    .maybeSingle();

  const email = profile?.email ?? user.email ?? null;
  const fullName = profile?.full_name ?? null;

  return (
    <DashboardLayoutClient userEmail={email} fullName={fullName}>
      {children}
    </DashboardLayoutClient>
  );
}
