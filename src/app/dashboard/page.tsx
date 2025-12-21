import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getLeadsForToday } from '@/lib/data';
import LeadPerformanceChart from '@/components/dashboard/lead-performance-chart';
import LeadPerformanceFilters from '@/components/dashboard/lead-performance-filters';

export default function DashboardPage() {
  const totalLeadsToday = getLeadsForToday();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold tracking-tight font-headline">
          WELCOME ATHMIYA!
        </h1>
        <p className="text-muted-foreground">
          Here is your lead generation overview for today.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total number of leads generated today!!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">{totalLeadsToday}</p>
            <CardDescription>Total number of Leads: {totalLeadsToday}</CardDescription>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Lead volume Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <LeadPerformanceFilters />
          <LeadPerformanceChart />
        </CardContent>
      </Card>
    </div>
  );
}
