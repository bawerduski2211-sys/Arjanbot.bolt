'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Bot,
  LayoutDashboard,
  CreditCard,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { getSupabaseBrowser } from '@/lib/supabase-client';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/theme-toggle';

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Bots', href: '/dashboard/bots', icon: Bot },
  { label: 'Billing', href: '/dashboard/billing', icon: CreditCard },
];

export function DashboardShell({
  children,
  active,
  userEmail,
  fullName,
}: {
  children: ReactNode;
  active: string;
  userEmail: string | null;
  fullName: string | null;
}) {
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/login');
    });
  }, [router]);

  async function handleLogout() {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    toast.success('Signed out successfully.');
    router.push('/');
    router.refresh();
  }

  const initials = (fullName || userEmail || 'U')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border/40 bg-card/80 backdrop-blur-xl lg:flex lg:flex-col">
        <div className="flex h-16 items-center justify-between border-b border-border/40 px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/30">
              <Bot className="h-4 w-4" />
            </div>
            <span className="font-bold tracking-tight">ARJAN</span>
          </div>
          <ThemeToggle className="h-8 w-8" />
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = active === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary/10 text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border/40 p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted/60">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium">
                    {fullName || 'User'}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {userEmail || ''}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/40 bg-card/80 px-4 backdrop-blur-xl lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/30">
            <Bot className="h-4 w-4" />
          </div>
          <span className="font-bold tracking-tight">ARJAN</span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/60 transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{fullName || 'User'}</p>
                <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
              </div>
              <DropdownMenuSeparator />
              {navItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
