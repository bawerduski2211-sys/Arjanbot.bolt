import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getStripeSafe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle();

    const customerId = profile?.stripe_customer_id;

    if (!customerId) {
      return NextResponse.json(
        { error: 'No Stripe customer account found. Please subscribe to a plan first.' },
        { status: 400 }
      );
    }

    const stripe = getStripeSafe();
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Add STRIPE_SECRET_KEY to your environment.' },
        { status: 500 }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin}/dashboard/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create portal session';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
