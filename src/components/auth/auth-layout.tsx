'use client';

import Link from 'next/link';
import { Bot, ArrowLeft } from 'lucide-react';
import { OAuthButtons } from '@/components/auth/oauth-buttons';

interface AuthLayoutProps {
  children: React.ReactNode;
  mode: 'signin' | 'signup';
}

export function AuthLayout({ children, mode }: AuthLayoutProps) {
  const isSignIn = mode === 'signin';

  return (
    <div className="relative flex min-h-screen flex-col bg-background lg:flex-row">
      {/* Left panel — branding */}
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-gradient-to-br from-primary to-primary/70 p-12 lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-dotted opacity-10" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-[100px]" />
        <div className="relative">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-foreground/20 text-primary-foreground backdrop-blur">
              <Bot className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-primary-foreground">
              ARJAN
            </span>
          </Link>
        </div>
        <div className="relative">
          <blockquote className="text-2xl font-medium leading-relaxed text-primary-foreground/90">
            &ldquo;ARJAN gave us a single pane of glass for every messaging
            bot we run. The AI responses just work.&rdquo;
          </blockquote>
          <p className="mt-4 text-sm text-primary-foreground/60">
            — Beta user, SaaS company
          </p>
        </div>
        <div className="relative" />
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          {/* Tabbed switcher */}
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-white/5 p-1">
            <Link
              href="/login"
              className={`rounded-md px-4 py-2 text-center text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                isSignIn
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className={`rounded-md px-4 py-2 text-center text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                !isSignIn
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </Link>
          </div>

          {/* OAuth buttons */}
          <OAuthButtons />

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border/60" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Or continue with email
            </span>
            <div className="h-px flex-1 bg-border/60" />
          </div>

          <div className="mb-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
