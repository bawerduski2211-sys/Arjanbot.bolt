'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase-client';
import type { Bot, MessageLog } from '@/lib/types';
import { Activity, MessageSquare, Clock, AlertTriangle } from 'lucide-react';

interface OverviewData {
  activeBots: number;
  totalMessages24h: number;
  avgLatencyMs: number | null;
  errorRate: number;
}

export function OverviewCards() {
  const [data, setData] = useState<OverviewData>({
    activeBots: 0,
    totalMessages24h: 0,
    avgLatencyMs: null,
    errorRate: 0,
  });
  const [loading, setLoading] = useState(true);

  const computeStats = useCallback(
    (bots: Bot[], messages: MessageLog[]) => {
      const activeBots = bots.filter((b) => b.status === 'connected').length;
      const now = Date.now();
      const dayAgo = now - 24 * 60 * 60 * 1000;

      const recentMessages = messages.filter((m) => {
        const ts = new Date(m.request_timestamp).getTime();
        return ts >= dayAgo;
      });

      const totalMessages24h = recentMessages.length;
      const failedCount = recentMessages.filter((m) => m.status === 'failed').length;
      const errorRate = totalMessages24h > 0 ? (failedCount / totalMessages24h) * 100 : 0;

      const latencies = recentMessages
        .filter((m) => m.request_timestamp && m.response_timestamp)
        .map((m) => {
          const req = new Date(m.request_timestamp).getTime();
          const res = new Date(m.response_timestamp!).getTime();
          return res - req;
        })
        .filter((l) => l >= 0);

      const avgLatencyMs =
        latencies.length > 0
          ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
          : null;

      return { activeBots, totalMessages24h, avgLatencyMs, errorRate };
    },
    []
  );

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    let active = true;

    async function fetchAll() {
      const [
        { data: bots, error: botsError },
        { data: messages, error: msgError },
      ] = await Promise.all([
        supabase.from('bots').select('*'),
        supabase
          .from('messages_log')
          .select('*')
          .gte('request_timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      ]);

      if (!active) return;
      if (botsError || msgError) {
        setLoading(false);
        return;
      }

      setData(computeStats(bots ?? [], messages ?? []));
      setLoading(false);
    }

    fetchAll();

    const channel = supabase
      .channel('overview-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bots' },
        () => fetchAll()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages_log' },
        () => fetchAll()
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [computeStats]);

  const cards = [
    {
      label: 'Active Bots',
      value: data.activeBots,
      icon: Activity,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Messages (24h)',
      value: data.totalMessages24h,
      icon: MessageSquare,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Avg AI Latency',
      value: data.avgLatencyMs !== null ? `${data.avgLatencyMs}ms` : '—',
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      label: 'Error Rate',
      value: `${data.errorRate.toFixed(1)}%`,
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="glass rounded-xl p-5 transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {card.label}
            </span>
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.bgColor} ${card.color}`}>
              <card.icon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            {loading ? (
              <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
            ) : (
              <span className="text-2xl font-bold tabular-nums">
                {card.value}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
