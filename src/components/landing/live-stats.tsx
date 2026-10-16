'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase-client';
import { Activity, MessageSquare, ShieldCheck } from 'lucide-react';

interface Stats {
  activeBots: number;
  totalMessages: number;
}

export function LiveStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    let active = true;

    async function fetchStats() {
      const [{ count: activeBots }, { count: totalMessages }] = await Promise.all([
        supabase
          .from('bots')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'connected'),
        supabase
          .from('messages_log')
          .select('*', { count: 'exact', head: true }),
      ]);

      if (!active) return;
      setStats({
        activeBots: activeBots ?? 0,
        totalMessages: totalMessages ?? 0,
      });
      setLoading(false);
    }

    fetchStats();

    const channel = supabase
      .channel('public-stats')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bots' },
        fetchStats
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages_log' },
        fetchStats
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const items = [
    {
      label: 'Active Bots',
      value: stats?.activeBots ?? 0,
      icon: Activity,
      live: true,
    },
    {
      label: 'Messages Processed',
      value: stats?.totalMessages ?? 0,
      icon: MessageSquare,
      live: true,
    },
    {
      label: 'Uptime Target',
      value: '99.9%',
      icon: ShieldCheck,
      live: false,
    },
  ];

  return (
    <section className="border-y border-border/40 bg-muted/10">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {items.map((item) => (
            <div key={item.label} className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <item.icon className="h-6 w-6" />
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl font-bold tracking-tight tabular-nums">
                  {loading ? (
                    <span className="inline-block h-9 w-20 animate-pulse rounded-md bg-muted" />
                  ) : (
                    typeof item.value === 'number'
                      ? item.value.toLocaleString()
                      : item.value
                  )}
                </span>
                {item.live && !loading && (
                  <span className="flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                    Live
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.label}
                {item.label === 'Uptime Target' && (
                  <span className="block text-xs text-muted-foreground/70">
                    (target, not a live metric)
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
