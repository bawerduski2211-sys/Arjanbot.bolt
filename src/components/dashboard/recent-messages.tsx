'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase-client';
import type { MessageLog } from '@/lib/types';

interface RecentMessage extends MessageLog {
  bot_name?: string;
}

export function RecentMessages() {
  const [messages, setMessages] = useState<RecentMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase
      .from('messages_log')
      .select('*, bots!inner(bot_name)')
      .order('request_timestamp', { ascending: false })
      .limit(20);

    if (error) {
      setLoading(false);
      return;
    }

    const mapped = (data ?? []).map((m: Record<string, unknown>) => ({
      ...(m as unknown as MessageLog),
      bot_name: (m.bots as Record<string, unknown> | undefined)?.bot_name as
        | string
        | undefined,
    })) as RecentMessage[];

    setMessages(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMessages();

    const supabase = getSupabaseBrowser();
    const channel = supabase
      .channel('recent-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages_log' },
        fetchMessages
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages_log' },
        fetchMessages
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMessages]);

  return (
    <div className="glass rounded-xl">
      <div className="border-b border-border/40 px-5 py-4">
        <h3 className="text-base font-semibold">Recent Messages</h3>
        <p className="text-sm text-muted-foreground">
          Live feed of incoming and outgoing messages across all your bots.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3 p-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/60" />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No messages yet. Once your bots are connected, incoming and
            outgoing messages will appear here in real time.
          </p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="flex items-start gap-3 border-b border-border/40 px-5 py-3 last:border-0"
            >
              <div
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                  msg.status === 'success' ? 'bg-success' : 'bg-destructive'
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">
                    {msg.sender || 'Unknown'}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {msg.bot_name || 'Unknown bot'}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {msg.message_text || '(no text)'}
                </p>
                {msg.ai_response && (
                  <p className="mt-1 truncate text-xs text-primary/80">
                    AI: {msg.ai_response}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {new Date(msg.request_timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
