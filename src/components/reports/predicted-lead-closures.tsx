'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, differenceInDays } from 'date-fns';
import { Target, CheckCircle2, Calendar, Clock, ArrowRight } from 'lucide-react';
import type { LeadFormData } from '@/components/leads/lead-upload-form';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

type PredictedLeadClosuresProps = {
  leads: LeadFormData[];
};

export default function PredictedLeadClosures({ leads }: PredictedLeadClosuresProps) {
  const predictedLeads = useMemo(() => {
    const targetStatuses = ["Demo Given", "Pursuing to Purchase", "Proposal Sent", "Quote Sent"];
    
    return leads
      .filter(lead => targetStatuses.includes(lead.status || ""))
      .map(lead => {
        let probability = 0;
        let milestones: string[] = [];
        let statusLabel = "";
        let colorClass = "";

        // Milestone Logic
        if (lead.status === "Demo Given") {
          probability = 65;
          milestones = ["Demo Done"];
        } else if (lead.status === "Proposal Sent" || lead.status === "Quote Sent") {
          probability = 85;
          milestones = ["Demo Done", "Proposal Viewed"];
        } else if (lead.status === "Pursuing to Purchase") {
          probability = 94;
          milestones = ["Demo Done", "Proposal Viewed", "Budget Confirmed"];
        }

        // Add small boost for recurring follow-ups
        const followUpCount = lead.followUps?.length || 0;
        probability = Math.min(98, probability + (followUpCount * 0.5));

        if (probability >= 90) {
          statusLabel = "Very Likely";
          colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
        } else if (probability >= 75) {
          statusLabel = "High Probability";
          colorClass = "bg-blue-50 text-blue-700 border-blue-200";
        } else {
          statusLabel = "Progressing";
          colorClass = "bg-amber-50 text-amber-700 border-amber-200";
        }

        const nextDate = lead.nextFollowUpDate ? new Date(lead.nextFollowUpDate) : null;
        const daysLeft = nextDate ? differenceInDays(nextDate, new Date()) : null;
        const lastFollowUp = lead.followUps && lead.followUps.length > 0 ? lead.followUps[lead.followUps.length - 1] : null;

        return {
          ...lead,
          probability,
          milestones,
          statusLabel,
          colorClass,
          daysLeft,
          lastActivity: lastFollowUp ? `${lastFollowUp.remarks.substring(0, 60)}${lastFollowUp.remarks.length > 60 ? '...' : ''}` : 'No recent activity',
          fullLastActivity: lastFollowUp ? lastFollowUp.remarks : null
        };
      })
      .sort((a, b) => b.probability - a.probability);
  }, [leads]);

  if (predictedLeads.length === 0) return null;

  return (
    <Card className="border-2 shadow-md">
      <CardHeader className="bg-muted/5 border-b py-4 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Sales Forecast
          </CardTitle>
          <p className="text-[11px] text-muted-foreground uppercase tracking-tight">AI-based probability analysis for high-value deals</p>
        </div>
        <Badge variant="outline" className="font-bold">{predictedLeads.length} Candidates</Badge>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[800px] w-full px-6 py-6">
          <div className="space-y-6">
            {predictedLeads.map((lead, index) => (
              <div key={lead.leadId} className="relative group p-5 rounded-2xl border bg-emerald-50/10 hover:bg-emerald-50/30 transition-all duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm shrink-0">
                      #{index + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground leading-none">{lead.contactPerson}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {lead.company} <span className="mx-1">•</span> {lead.selectedModule?.split(',')[0] || 'Solution Suite'}
                      </p>
                    </div>
                  </div>
                  <Badge className={cn("font-bold px-3 py-1 gap-1.5 rounded-full border shadow-none", lead.colorClass)}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {lead.statusLabel}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <span>Close Probability</span>
                    <span className="text-emerald-600 text-sm">{Math.round(lead.probability)}%</span>
                  </div>
                  <Progress value={lead.probability} className="h-2 bg-emerald-100" />
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <span className="font-bold">₹ {parseInt(lead.annualContractValue || lead.monthlyContractValue || "0").toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {lead.nextFollowUpDate ? format(new Date(lead.nextFollowUpDate), 'dd MMM yyyy') : 'TBD'}
                  </div>
                  {lead.daysLeft !== null && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {lead.daysLeft}d left
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    {lead.reference || 'Organic'}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {lead.milestones.map(m => (
                    <span key={m} className="px-3 py-1 rounded-full bg-white border text-[10px] font-bold uppercase tracking-tight shadow-sm">
                      {m}
                    </span>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-dashed">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs italic text-muted-foreground flex items-center gap-2 truncate flex-1">
                      <span className="font-bold not-italic shrink-0">Last activity:</span> 
                      <span className="truncate">{lead.lastActivity}</span>
                    </p>
                    {lead.fullLastActivity && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="text-[9px] font-bold bg-muted px-1.5 py-0.5 rounded-sm hover:bg-primary hover:text-primary-foreground transition-all shrink-0">
                            VIEW
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-4 shadow-2xl border-2 z-50">
                          <div className="space-y-2">
                            <h4 className="font-bold text-xs uppercase text-primary border-b pb-1 tracking-wider">Activity Details</h4>
                            <div className="text-sm leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                              {lead.fullLastActivity}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
