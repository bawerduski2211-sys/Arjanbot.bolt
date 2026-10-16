'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase-client';
import type { Bot, Profile, BotStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addBotSchema, type AddBotInput } from '@/lib/validation';
import { toast } from 'sonner';
import {
  Plus,
  Loader2,
  MessageCircle,
  Send,
  QrCode,
  Trash2,
  ExternalLink,
  Lock,
  Wifi,
  WifiOff,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const statusConfig: Record<BotStatus, { label: string; className: string; icon: typeof Wifi }> = {
  connected: { label: 'Connected', className: 'bg-success/15 text-success border-success/30', icon: Wifi },
  qr_ready: { label: 'QR Ready', className: 'bg-warning/15 text-warning border-warning/30', icon: HelpCircle },
  disconnected: { label: 'Disconnected', className: 'bg-muted text-muted-foreground border-border', icon: WifiOff },
};

export function BotsManager() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [qrBotId, setQrBotId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrWaiting, setQrWaiting] = useState(false);

  const supabase = getSupabaseBrowser();

  const fetchData = useCallback(async () => {
    const [
      { data: botsData, error: botsError },
      { data: profileData, error: profileError },
    ] = await Promise.all([
      supabase.from('bots').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').maybeSingle(),
    ]);

    if (botsError || profileError) {
      setLoading(false);
      return;
    }

    setBots(botsData ?? []);
    setProfile(profileData as Profile | null);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('bots-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bots' },
        fetchData
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData, supabase]);

  // QR code realtime subscription
  useEffect(() => {
    if (!qrBotId) return;

    setQrWaiting(true);
    setQrCode(null);

    const channel = supabase
      .channel(`qr-${qrBotId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bots',
          filter: `id=eq.${qrBotId}`,
        },
        (payload) => {
          const updatedBot = payload.new as Bot;
          if (updatedBot.qr_code) {
            setQrCode(updatedBot.qr_code);
            setQrWaiting(false);
          }
          if (updatedBot.status === 'connected') {
            setQrBotId(null);
            setQrCode(null);
            setQrWaiting(false);
            toast.success('WhatsApp bot connected successfully!');
          }
        }
      )
      .subscribe();

    // Also check if QR already exists
    supabase
      .from('bots')
      .select('qr_code, status')
      .eq('id', qrBotId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.qr_code) {
          setQrCode(data.qr_code);
          setQrWaiting(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qrBotId, supabase]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AddBotInput>({
    resolver: zodResolver(addBotSchema),
    defaultValues: { platform: 'whatsapp' },
  });

  const selectedPlatform = watch('platform');

  const onAddBot = async (data: AddBotInput) => {
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        platform: data.platform,
        bot_name: data.botName,
        api_token: data.apiToken,
        webhook_url: data.webhookUrl || null,
      };

      const { data: bot, error } = await supabase
        .from('bots')
        .insert(payload)
        .select()
        .single();

      if (error) {
        if (error.message.includes('limit')) {
          toast.error('Bot limit reached. Upgrade your plan to add more bots.');
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success(`${data.platform === 'whatsapp' ? 'WhatsApp' : 'Telegram'} bot created.`);

      if (data.platform === 'whatsapp') {
        setQrBotId(bot.id);
      }

      reset();
      setAddOpen(false);
      fetchData();
    } catch {
      toast.error('Failed to create bot. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  async function handleDeleteBot(botId: string) {
    const { error } = await supabase.from('bots').delete().eq('id', botId);
    if (error) {
      toast.error('Failed to delete bot.');
      return;
    }
    toast.success('Bot deleted.');
    fetchData();
  }

  const botCount = bots.length;
  const botLimit = profile?.bot_limit ?? 1;
  const limitReached = botCount >= botLimit;

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/60" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bots</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your WhatsApp and Telegram bots. {botCount} of {botLimit === 999 ? 'unlimited' : botLimit} used.
          </p>
        </div>

        {limitReached ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button disabled className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Bot
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Bot limit reached. Upgrade your plan to add more bots.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Bot
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add a new bot</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onAddBot)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
                        selectedPlatform === 'whatsapp'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-border/80'
                      )}
                    >
                      <input
                        type="radio"
                        value="whatsapp"
                        className="sr-only"
                        {...register('platform')}
                      />
                      <MessageCircle className="h-5 w-5 text-success" />
                      <div>
                        <p className="text-sm font-medium">WhatsApp</p>
                        <p className="text-xs text-muted-foreground">QR-based linking</p>
                      </div>
                    </label>
                    <label
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
                        selectedPlatform === 'telegram'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-border/80'
                      )}
                    >
                      <input
                        type="radio"
                        value="telegram"
                        className="sr-only"
                        {...register('platform')}
                      />
                      <Send className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Telegram</p>
                        <p className="text-xs text-muted-foreground">Bot token</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="botName">Bot name</Label>
                  <Input
                    id="botName"
                    placeholder="My Customer Support Bot"
                    disabled={submitting}
                    {...register('botName')}
                  />
                  {errors.botName && (
                    <p className="text-xs text-destructive">{errors.botName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiToken" className="flex items-center gap-1.5">
                    <Lock className="h-3 w-3" />
                    API Token (encrypted before storage)
                  </Label>
                  <Input
                    id="apiToken"
                    type="password"
                    placeholder="Enter your bot API token"
                    disabled={submitting}
                    {...register('apiToken')}
                  />
                  {errors.apiToken && (
                    <p className="text-xs text-destructive">{errors.apiToken.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">Webhook URL (optional)</Label>
                  <Input
                    id="webhookUrl"
                    placeholder="https://your-app.com/webhook"
                    disabled={submitting}
                    {...register('webhookUrl')}
                  />
                  {errors.webhookUrl && (
                    <p className="text-xs text-destructive">{errors.webhookUrl.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating bot...
                    </>
                  ) : (
                    'Create bot'
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* QR Code Modal */}
      {qrBotId && (
        <Dialog open={!!qrBotId} onOpenChange={(open) => !open && setQrBotId(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Link WhatsApp
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              {qrWaiting ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Waiting for QR code from the worker service...
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    This usually takes a few seconds.
                  </p>
                </div>
              ) : qrCode ? (
                <div className="flex flex-col items-center gap-3">
                  <img
                    src={qrCode}
                    alt="WhatsApp QR Code"
                    className="h-56 w-56 rounded-lg border border-border"
                  />
                  <p className="text-sm text-muted-foreground">
                    Open WhatsApp on your phone, go to Settings &gt; Linked
                    Devices, and scan this QR code.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Unable to load QR code. Please try again.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Bots list */}
      {bots.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/60 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/60">
            <MessageCircle className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-base font-semibold">No bots yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first bot to start automating conversations.
            </p>
          </div>
          {!limitReached && (
            <Button onClick={() => setAddOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add your first bot
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bots.map((bot) => {
            const config = statusConfig[bot.status];
            return (
              <div
                key={bot.id}
                className="group glass rounded-xl p-5 transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        bot.platform === 'whatsapp'
                          ? 'bg-success/10 text-success'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {bot.platform === 'whatsapp' ? (
                        <MessageCircle className="h-5 w-5" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{bot.bot_name}</h3>
                      <p className="text-xs capitalize text-muted-foreground">
                        {bot.platform}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn('gap-1.5', config.className)}>
                    <config.icon className="h-3 w-3" />
                    {config.label}
                  </Badge>
                </div>

                {bot.webhook_url && (
                  <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ExternalLink className="h-3 w-3" />
                    <span className="truncate">{bot.webhook_url}</span>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
                  <span className="text-xs text-muted-foreground">
                    Created {new Date(bot.created_at).toLocaleDateString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteBot(bot.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
