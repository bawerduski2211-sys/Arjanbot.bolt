import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { BillingContent } from '@/components/dashboard/billing-content';
import type { Profile, Plan } from '@/lib/types';

export default async function BillingPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <BillingContent profile={profile as Profile | null} />
  );
}
