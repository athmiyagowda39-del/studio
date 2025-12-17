'use client';

import { detectAnomalies } from '@/ai/flows/anomaly-detection';
import { analyzeLeadGenerationTrends } from '@/ai/flows/lead-generation-trends';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getLeadData } from '@/lib/data';
import { Bot, Zap } from 'lucide-react';
import { useMemo, useState, useTransition } from 'react';
import { Skeleton } from '../ui/skeleton';

export default function AiAnalysis() {
  const [trends, setTrends] = useState<string | null>(null);
  const [anomalies, setAnomalies] = useState<string | null>(null);

  const [isTrendsPending, startTrendsTransition] = useTransition();
  const [isAnomaliesPending, startAnomaliesTransition] = useTransition();

  const leadDataJson = useMemo(() => JSON.stringify(getLeadData()), []);

  const handleTrendAnalysis = () => {
    startTrendsTransition(async () => {
      const result = await analyzeLeadGenerationTrends({ leadData: leadDataJson });
      setTrends(result.trends);
    });
  };

  const handleAnomalyDetection = () => {
    startAnomaliesTransition(async () => {
      const result = await detectAnomalies({ leadData: leadDataJson });
      setAnomalies(result.anomalies);
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-accent">
              <Zap className="size-5" />
            </div>
            <div>
              <CardTitle>Trend Identification</CardTitle>
              <CardDescription>
                Leverage AI to identify key trends in lead generation data.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="min-h-[100px]">
          {isTrendsPending ? (
             <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
             </div>
          ) : trends ? (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap font-mono">{trends}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Click the button to analyze lead generation trends.
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleTrendAnalysis} disabled={isTrendsPending}>
            <Bot className="mr-2 h-4 w-4" />
            {isTrendsPending ? 'Analyzing...' : 'Identify Trends'}
          </Button>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <Zap className="size-5" />
            </div>
            <div>
              <CardTitle>Anomaly Detection</CardTitle>
              <CardDescription>
                Use AI to flag unusual patterns in your lead data.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="min-h-[100px]">
          {isAnomaliesPending ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : anomalies ? (
             <p className="text-sm text-muted-foreground whitespace-pre-wrap font-mono">{anomalies}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Click the button to detect anomalies in your data.
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleAnomalyDetection} disabled={isAnomaliesPending} variant="secondary">
            <Bot className="mr-2 h-4 w-4" />
            {isAnomaliesPending ? 'Detecting...' : 'Detect Anomalies'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
