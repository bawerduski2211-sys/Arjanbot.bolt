'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, CreditCard, ExternalLink, Check, Sparkles } from 'lucide-react';
import type { Profile, Plan } from '@/lib/types';

const planInfo: Record<Plan, { name: string; price: string; features: string[] }> = {
  STARTER: {
    name: 'Starter',
    price: '$0/mo',
    features: ['1 bot', 'AI responses', '7-day log retention', 'Community support'],
  },
  PRO: {
    name: 'Pro',
    price: '$49/mo',
    features: ['Up to 5 bots', 'AI responses', '90-day log retention', 'Email support'],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: '$199/mo',
    features: ['Unlimited bots', 'AI responses', 'Extended retention', 'Priority support'],
  },
};

export function BillingContent({ profile }: { profile: Profile | null }) {
  const [portalLoading, setPortalLoading] = useState(false);

  const currentPlan: Plan = profile?.plan ?? 'STARTER';
  const currentInfo = planInfo[currentPlan];

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/create-portal-session', { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to open billing portal');
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to open billing portal');
      setPortalLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your subscription and billing details.
        </p>
      </div>

      {/* Current plan */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">Current Plan</h2>
              <Badge variant="outline" className="gap-1.5 bg-primary/10 text-primary border-primary/30">
                <Sparkles className="h-3 w-3" />
                {currentInfo.name}
              </Badge>
            </div>
            <p className="mt-1 text-2xl font-bold">{currentInfo.price}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Bot limit</p>
            <p className="text-lg font-semibold">
              {profile?.bot_limit === 999 ? 'Unlimited' : profile?.bot_limit ?? 1}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {currentInfo.features.map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-success" />
              {feature}
            </div>
          ))}
        </div>

        {currentPlan !== 'STARTER' && (
          <div className="mt-6 border-t border-border/40 pt-6">
            <Button onClick={handlePortal} disabled={portalLoading} variant="outline" className="gap-2">
              {portalLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Open Stripe Customer Portal
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              Manage payment methods, update billing details, or cancel your subscription.
            </p>
          </div>
        )}
      </div>

      {/* Available plans */}
      <div>
        <h3 className="mb-4 text-base font-semibold">Available Plans</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {(Object.keys(planInfo) as Plan[]).map((plan) => {
            const info = planInfo[plan];
            const isCurrent = plan === currentPlan;
            return (
              <div
                key={plan}
                className={`rounded-xl border p-5 ${
                  isCurrent ? 'border-primary bg-primary/5' : 'border-border bg-card'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">{info.name}</h4>
                  {isCurrent && (
                    <Badge variant="outline" className="text-xs">
                      Current
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-xl font-bold">{info.price}</p>
                <ul className="mt-4 space-y-1.5">
                  {info.features.map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Check className="h-3 w-3 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
                {!isCurrent && plan !== 'STARTER' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4 w-full gap-2"
                    onClick={() => {
                      fetch('/api/checkout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ plan }),
                      })
                        .then((r) => r.json())
                        .then((d) => d.url && (window.location.href = d.url))
                        .catch(() => toast.error('Failed to start checkout'));
                    }}
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    Upgrade
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
