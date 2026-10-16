'use client';

import { useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, ArrowRight } from 'lucide-react';

export function CTASection() {
  const [loading, setLoading] = useState(false);

  async function handleQuickStart() {
    setLoading(true);
    const supabase = getSupabaseBrowser();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      window.location.href = '/dashboard';
    } else {
      window.location.href = '/signup';
    }
  }

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/70 px-8 py-16 text-center shadow-2xl shadow-primary/20 sm:px-16">
          <div className="pointer-events-none absolute inset-0 bg-dotted opacity-10" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[400px] -translate-x-1/2 rounded-full bg-white/10 blur-[80px]" />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
              Ready to automate your messaging?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/80">
              Deploy your first AI-powered bot in minutes. No credit card
              required to start.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto"
                disabled={loading}
                onClick={handleQuickStart}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                Start building free
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground sm:w-auto"
                asChild
              >
                <a href="#pricing">View pricing</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
