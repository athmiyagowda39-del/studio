import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="bg-primary/10">
          <CardTitle className="text-center text-primary">Reports</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Reports page is under construction.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
