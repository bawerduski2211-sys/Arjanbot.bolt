'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DemoModal } from '@/components/landing/demo-modal';
import { LiveStats } from '@/components/landing/live-stats';
import { FAQAccordion } from '@/components/landing/faq-accordion';
import { PricingSection } from '@/components/landing/pricing-section';
import { CTASection } from '@/components/landing/cta-section';
import { LandingNav } from '@/components/landing/landing-nav';
import {
  Bot,
  Zap,
  ShieldCheck,
  Brain,
  MessageSquare,
  Smartphone,
  Globe,
  ArrowRight,
} from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Built for Automation',
    description:
      'Deploy bots that handle thousands of conversations in parallel. ARJAN manages routing, queuing, and retries so you never miss a message.',
  },
  {
    icon: Globe,
    title: 'Multi-Platform WhatsApp & Telegram',
    description:
      'One dashboard for both platforms. Mix WhatsApp and Telegram bots under a single account with unified monitoring and logging.',
  },
  {
    icon: Brain,
    title: 'Powered by AI',
    description:
      'Every incoming message flows through an AI pipeline that generates contextual responses. Tune the behavior per bot without touching code.',
  },
];

const secondaryFeatures = [
  {
    icon: ShieldCheck,
    title: 'Encrypted by design',
    description: 'API tokens are encrypted before storage. The database never holds plaintext credentials.',
  },
  {
    icon: MessageSquare,
    title: 'Realtime message logs',
    description: 'Watch every conversation as it happens with live Supabase Realtime subscriptions.',
  },
  {
    icon: Smartphone,
    title: 'QR-based WhatsApp linking',
    description: 'No Baileys setup on your side. Scan a QR code from your dashboard and the bot connects.',
  },
  {
    icon: Bot,
    title: 'Bot limit enforcement',
    description: 'Plan-based limits enforced at the database level. Upgrade to add more bots instantly.',
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen bg-background">
      <LandingNav />

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20">
        <div className="absolute inset-0 bg-grid opacity-[0.04]" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
        <div className="pointer-events-none absolute right-0 top-40 h-[300px] w-[300px] rounded-full bg-violet-600/10 blur-[100px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-sm text-muted-foreground">
              <span className="flex h-2 w-2 rounded-full bg-success" />
              Now in public beta
            </div>
            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              AI-powered bot management for{' '}
              <span className="text-gradient-vibrant">
                WhatsApp & Telegram
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
              ARJAN lets you deploy, monitor, and scale messaging bots from a
              single dashboard. Connect your accounts, let AI handle the
              responses, and track everything in real time.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" className="w-full glow-primary sm:w-auto" asChild>
                <Link href="/signup">
                  Get started free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <DemoModal />
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              No credit card required. Starter plan is free forever.
            </p>
          </div>
        </div>
      </section>

      {/* Live Stats */}
      <LiveStats />

      {/* Primary Features */}
      <section id="features" className="relative py-24">
        <div className="pointer-events-none absolute left-0 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to run bots at scale
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From a single bot to a fleet across two platforms — ARJAN handles
              the infrastructure so you can focus on the conversation.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group glass relative rounded-2xl p-8 transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Secondary features */}
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {secondaryFeatures.map((feature) => (
              <div
                key={feature.title}
                className="glass rounded-xl p-6 transition-colors hover:border-primary/20"
              >
                <feature.icon className="mb-3 h-5 w-5 text-primary" />
                <h4 className="text-sm font-semibold">{feature.title}</h4>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border/40 bg-muted/10 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Start free, upgrade when you need more. Cancel anytime.
            </p>
          </div>
          <div className="mt-16">
            <PricingSection />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Frequently asked questions
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need to know about deploying and managing bots
              with ARJAN.
            </p>
          </div>
          <div className="mt-12">
            <FAQAccordion />
          </div>
        </div>
      </section>

      <CTASection />

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <span className="font-bold tracking-tight">ARJAN</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="#features" className="hover:text-foreground">
                Features
              </Link>
              <Link href="#pricing" className="hover:text-foreground">
                Pricing
              </Link>
              <Link href="#faq" className="hover:text-foreground">
                FAQ
              </Link>
              <Link href="/login" className="hover:text-foreground">
                Sign in
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} ARJAN. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
