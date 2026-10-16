import { OverviewCards } from '@/components/dashboard/overview-cards';
import { RecentMessages } from '@/components/dashboard/recent-messages';

export default function DashboardOverviewPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Real-time metrics across all your bots. Updates live as messages flow in.
        </p>
      </div>

      <OverviewCards />

      <RecentMessages />
    </div>
  );
}
