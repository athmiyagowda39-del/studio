"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useMemo } from "react"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Info } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LeadFormData } from "./lead-upload-form"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { useApp } from "@/context/app-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getDisplayModule } from "@/lib/modules"
import { Calendar } from "@/components/ui/calendar"

type FollowUp = {
  id: number
  date: string
  remarks: string
  nextFollowUp: string
  enteredBy: string
}

export default function LeadUpdateForm({ leadId }: { leadId: string | null }) {
  const [leadDetails, setLeadDetails] = useState<Partial<LeadFormData>>({})
  const [remarks, setRemarks] = useState("")
  const [nextFollowUpDate, setNextFollowUpDate] = useState("")
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [currentStatus, setCurrentStatus] = useState("Initial")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [selectedSubStatus, setSelectedSubStatus] = useState("")
  const [monthlyContractValue, setMonthlyContractValue] = useState("")
  const [annualContractValue, setAnnualContractValue] = useState("")
  const [transferredTo, setTransferredTo] = useState("")
  const [isReadyToUpdate, setIsReadyToUpdate] = useState(false)

  const { toast } = useToast()
  const { users, user, isReadOnly, leads: allLeads, updateLead, leadStatuses, leadSubStatuses } = useApp()
  const filteredLeadStatuses = useMemo(() => leadStatuses.filter(status => status !== 'Quote Sent'), [leadStatuses]);
  const [executives, setExecutives] = useState<string[]>([])

  useEffect(() => {
    const executiveUsers = users.filter((user) => user.role === "Executive").map((user) => user.username)
    setExecutives(executiveUsers)
  }, [users])

  useEffect(() => {
    if (leadId) {
      findLeadAndSetDetails(leadId)
    } else {
      handleResetLeadDetails()
    }
  }, [leadId, allLeads])

  const findLeadAndSetDetails = (id: string) => {
    const foundLead = allLeads.find((lead) => lead.leadId === id)
    if (foundLead) {
      setLeadDetails(foundLead)
      setFollowUps(foundLead.followUps || [])
      setCurrentStatus(foundLead.status || "Initial")
      setSelectedStatus(foundLead.status || "")
      setSelectedSubStatus(foundLead.leadSubStatus || "")
      setMonthlyContractValue(foundLead.monthlyContractValue || "");
      setAnnualContractValue(foundLead.annualContractValue || "");
      setRemarks("")
      setNextFollowUpDate("")
      setIsReadyToUpdate(false)
    } else {
      handleResetLeadDetails()
    }
  }

  const handleLeadDetailChange = (field: keyof LeadFormData, value: any) => {
    setLeadDetails((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddFollowUp = async () => {
    if (!remarks || (!nextFollowUpDate && !remarks.toLowerCase().includes("order closed"))) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please provide remarks and next follow-up date." })
      return
    }

    const newFollowUp: FollowUp = {
      id: (followUps?.length || 0) + 1,
      date: new Date().toISOString(),
      remarks: remarks,
      nextFollowUp: nextFollowUpDate ? format(new Date(nextFollowUpDate + "T00:00:00"), "PPP") : "N/A",
      enteredBy: user?.username || "Demo User",
    }

    await updateLead(leadDetails.leadId!, {
      followUps: [...(followUps || []), newFollowUp],
      nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate + "T00:00:00").toISOString() : undefined,
    })

    setRemarks("")
    setNextFollowUpDate("")
    toast({ title: "Follow-up added" })
  }

  const handleUpdateStatus = async () => {
    if (!selectedStatus) return
    const payload: Partial<LeadFormData> = {
      status: selectedStatus,
      leadSubStatus: selectedStatus === "Not interested" ? selectedSubStatus : "",
      monthlyContractValue: selectedStatus === 'Proposal Sent' ? monthlyContractValue : '',
      annualContractValue: selectedStatus === 'Proposal Sent' ? annualContractValue : '',
    }

    await updateLead(leadDetails.leadId!, payload)
    toast({ title: "Status Updated" })
    setCurrentStatus(selectedStatus)
    setSelectedStatus("")
  }

  const handleResetLeadDetails = () => {
    setLeadDetails({})
    setFollowUps([])
    setCurrentStatus("Initial")
    setMonthlyContractValue("")
    setAnnualContractValue("")
    setIsReadyToUpdate(false)
  }

  const handleSaveLeadDetails = async () => {
    if (!leadDetails.leadId) return
    await updateLead(leadDetails.leadId, {
      contactPerson: leadDetails.contactPerson,
      contactNumber: leadDetails.contactNumber,
      email: leadDetails.email,
      headcount: leadDetails.headcount,
    })
    toast({ title: "Lead Updated" })
    setIsReadyToUpdate(false)
  }

  return (
    <div className="space-y-6">
      {isReadOnly && <Alert variant="default"><Info className="h-4 w-4" /><AlertTitle>Read-Only Mode</AlertTitle></Alert>}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Card>
          <CardHeader><CardTitle className="text-base">LEAD CONTACT CARD</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Lead ID</Label><Input value={leadDetails.leadId || ""} readOnly /></div>
              <div className="space-y-1"><Label>Company</Label><Input value={leadDetails.company || ""} readOnly /></div>
              <div className="space-y-1"><Label>Contact Person</Label><Input value={leadDetails.contactPerson || ""} onChange={e => handleLeadDetailChange('contactPerson', e.target.value)} readOnly={isReadOnly} /></div>
              <div className="space-y-1"><Label>Phone</Label><Input value={leadDetails.contactNumber || ""} onChange={e => handleLeadDetailChange('contactNumber', e.target.value)} readOnly={isReadOnly} /></div>
              <div className="space-y-1"><Label>Email</Label><Input value={leadDetails.email || ""} onChange={e => handleLeadDetailChange('email', e.target.value)} readOnly={isReadOnly} /></div>
              <div className="space-y-1"><Label>Headcount</Label><Input value={leadDetails.headcount || ""} onChange={e => handleLeadDetailChange('headcount', e.target.value)} readOnly={isReadOnly} /></div>
            </div>
            <div className="flex items-center gap-2 pt-4 border-t">
              <Checkbox id="ready" checked={isReadyToUpdate} onCheckedChange={(c) => setIsReadyToUpdate(!!c)} disabled={isReadOnly} />
              <Label htmlFor="ready">Yes, I am Ready to Update.</Label>
              <Button onClick={handleSaveLeadDetails} disabled={!isReadyToUpdate || isReadOnly} className="ml-auto">Save</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">LEAD TRACKER</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Follow Up Remarks</Label>
              <Textarea value={remarks} onChange={e => setRemarks(e.target.value)} readOnly={isReadOnly} />
            </div>
            <div className="space-y-2">
              <Label>Next Follow-up Date</Label>
              <Input type="date" value={nextFollowUpDate} onChange={e => setNextFollowUpDate(e.target.value)} disabled={isReadOnly} />
            </div>
            <div className="flex justify-end gap-2"><Button onClick={handleAddFollowUp} disabled={isReadOnly}>Add Follow-up</Button></div>
            <ScrollArea className="h-48 rounded-md border p-2">
                <Table>
                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Remarks</TableHead><TableHead>Next</TableHead></TableRow></TableHeader>
                    <TableBody>{followUps.map(fu => <TableRow key={fu.id}><TableCell>{format(new Date(fu.date), 'MMM d')}</TableCell><TableCell>{fu.remarks}</TableCell><TableCell>{fu.nextFollowUp}</TableCell></TableRow>)}</TableBody>
                </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Lead Status</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-muted-foreground">({currentStatus})</span>
            <Select value={selectedStatus} onValueChange={setSelectedStatus} disabled={isReadOnly}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Update Status..." /></SelectTrigger>
              <SelectContent>{filteredLeadStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            <Button onClick={handleUpdateStatus} disabled={!selectedStatus || isReadOnly}>Update</Button>
          </div>
          {selectedStatus === 'Proposal Sent' && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1"><Label>Monthly Value</Label><Input type="number" value={monthlyContractValue} onChange={e => setMonthlyContractValue(e.target.value)} disabled={isReadOnly} /></div>
              <div className="space-y-1"><Label>Annual Value</Label><Input type="number" value={annualContractValue} onChange={e => setAnnualContractValue(e.target.value)} disabled={isReadOnly} /></div>
            </div>
          )}
          {selectedStatus === 'Not interested' && (
            <Select value={selectedSubStatus} onValueChange={setSelectedSubStatus} disabled={isReadOnly}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select Reason..." /></SelectTrigger>
              <SelectContent>{leadSubStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>
    </div>
  )
}