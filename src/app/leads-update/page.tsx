import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import LeadUpdateForm from '@/components/leads/lead-update-form';

export default function LeadsUpdatePage() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="bg-primary/10">
          <CardTitle className="text-center text-primary">UPDATE LEADS</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <LeadUpdateForm />
        </CardContent>
      </Card>
    </div>
  );
}
