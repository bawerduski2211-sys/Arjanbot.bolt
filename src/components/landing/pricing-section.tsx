'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { Plan } from '@/lib/types';

const plans = [
  {
    name: 'Starter' as Plan,
    price: '$0',
    period: '/mo',
    description: 'For testing the waters with a single bot',
    features: [
      '1 bot (WhatsApp or Telegram)',
      'AI-powered responses',
      '7-day message log retention',
      'Community support',
    ],
    cta: 'Start for free',
    highlighted: false,
  },
  {
    name: 'Pro' as Plan,
    price: '$49',
    period: '/mo',
    description: 'For teams running multiple bots in production',
    features: [
      'Up to 5 bots',
      'AI-powered responses',
      '90-day message log retention',
      'Realtime dashboard metrics',
      'Email support',
    ],
    cta: 'Upgrade to Pro',
    highlighted: true,
  },
  {
    name: 'Enterprise' as Plan,
    price: '$199',
    period: '/mo',
    description: 'For organizations with high-volume needs',
    features: [
      'Unlimited bots',
      'AI-powered responses',
      'Extended message retention',
      'Priority processing & support',
      'Custom webhooks & integrations',
    ],
    cta: 'Go Enterprise',
    highlighted: false,
  },
];

export function PricingSection() {
  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null);

  async function handleCheckout(plan: Plan) {
    if (plan === 'STARTER') {
      window.location.href = '/signup';
      return;
    }

    setLoadingPlan(plan);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to start checkout');
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Checkout failed');
      setLoadingPlan(null);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {plans.map((plan) => (
        <div
          key={plan.name}
          className={`glass relative flex flex-col rounded-2xl p-6 transition-all ${
            plan.highlighted
              ? 'border-primary/30 bg-primary/5 shadow-xl shadow-primary/10 glow-primary lg:scale-105'
              : 'hover:border-white/15'
          }`}
        >
          {plan.highlighted && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-md">
                <Sparkles className="h-3 w-3" />
                Most Popular
              </span>
            </div>
          )}

          <div className="mb-5">
            <h3 className="text-lg font-bold">{plan.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {plan.description}
            </p>
          </div>

          <div className="mb-6">
            <span className="text-4xl font-bold tracking-tight">
              {plan.price}
            </span>
            <span className="text-sm text-muted-foreground">
              {plan.period}
            </span>
          </div>

          <ul className="mb-8 space-y-3">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span className="text-sm text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mt-auto">
            <Button
              className="w-full"
              variant={plan.highlighted ? 'default' : 'outline'}
              size="lg"
              disabled={loadingPlan !== null}
              onClick={() => handleCheckout(plan.name)}
            >
              {loadingPlan === plan.name ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecting...
                </>
              ) : (
                plan.cta
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
