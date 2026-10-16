import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getStripeSafe } from '@/lib/stripe';
import type { Plan } from '@/lib/types';

const PRICE_IDS: Record<Plan, string | null> = {
  STARTER: null,
  PRO: process.env.STRIPE_PRO_PRICE_ID ?? null,
  ENTERPRISE: process.env.STRIPE_ENTERPRISE_PRICE_ID ?? null,
};

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const plan = body.plan as Plan;

    if (!plan || !['PRO', 'ENTERPRISE'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const priceId = PRICE_IDS[plan];
    if (!priceId) {
      return NextResponse.json(
        { error: 'Stripe price ID not configured for this plan' },
        { status: 500 }
      );
    }

    const stripe = getStripeSafe();
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Add STRIPE_SECRET_KEY to your environment.' },
        { status: 500 }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .maybeSingle();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || user.email || undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin}/dashboard/billing?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin}/dashboard/billing?checkout=cancelled`,
      metadata: { supabase_user_id: user.id, plan },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
