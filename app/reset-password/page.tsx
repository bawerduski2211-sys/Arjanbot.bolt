'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, MailCheck } from 'lucide-react';
import { getSupabaseBrowser } from '@/lib/supabase-client';
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validation';
import { AuthLayout } from '@/components/auth/auth-layout';

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setSent(true);
      toast.success('Reset link sent. Check your inbox.');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout mode="signin">
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
            <MailCheck className="h-7 w-7" />
          </div>
          <p className="text-sm text-muted-foreground">
            Click the link in the email we sent to reset your password. The
            link expires in 24 hours.
          </p>
          <Button variant="outline" onClick={() => setSent(false)} className="w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black">
            Send to a different email
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout mode="signin">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            disabled={loading}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending reset link...
            </>
          ) : (
            'Send reset link'
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
