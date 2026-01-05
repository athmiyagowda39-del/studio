import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LeadUploadForm from '@/components/leads/lead-upload-form';

export default function LeadsUploadPage() {
  return (
    <div className="flex flex-col gap-6">
       <Card>
        <CardHeader className="bg-primary/10">
          <CardTitle className="text-center text-primary">LEADS UPLOAD</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <LeadUploadForm />
        </CardContent>
      </Card>
    </div>
  );
}
