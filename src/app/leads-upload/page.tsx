import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LeadUploadForm from '@/components/leads/lead-upload-form';

export default function LeadsUploadPage() {
  return (
    <div className="flex flex-col gap-6">
      <LeadUploadForm />
    </div>
  );
}
