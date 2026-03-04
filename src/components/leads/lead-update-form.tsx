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
import { format } from "date-fns"
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
import { Info } from "lucide-react"
import { getDisplayModule } from "@/lib/modules"

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
  const { users, user, isReadOnly, leads: allLeads, updateLead, leadStatuses, leadSubStatuses, modules } = useApp()
  const filteredLeadStatuses = useMemo(() => leadStatuses.filter(status => status !== 'Quote Sent'), [leadStatuses]);
  
  const executives = useMemo(() => 
    users.filter((u) => u.role === "Executive").map((u) => u.username), 
    [users]
  )

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
      setMonthlyContractValue(foundLead.monthlyContractValue || "")
      setAnnualContractValue(foundLead.annualContractValue || "")
      setRemarks("")
      setNextFollowUpDate("")
      setIsReadyToUpdate(false)
      
      if (user?.role === 'Executive' && !foundLead.executiveViewDate) {
        updateLead(id, { executiveViewDate: new Date().toISOString() });
      }
    } else {
      handleResetLeadDetails()
    }
  }

  const handleLeadDetailChange = (field: keyof LeadFormData, value: any) => {
    setLeadDetails((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddFollowUp = async () => {
    if (!leadDetails.leadId) return
    const isOrderClosed = remarks.toLowerCase().includes("order closed")
    
    if (!remarks || (!nextFollowUpDate && !isOrderClosed)) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please provide remarks and next follow-up date." })
      return
    }

    const newFollowUp: FollowUp = {
      id: (followUps?.length || 0) + 1,
      date: new Date().toISOString(),
      remarks: remarks,
      nextFollowUp: nextFollowUpDate && !isOrderClosed ? format(new Date(nextFollowUpDate + "T00:00:00"), "PPP") : "N/A",
      enteredBy: user?.username || "System",
    }

    try {
      await updateLead(leadDetails.leadId, {
        followUps: [...(followUps || []), newFollowUp],
        nextFollowUpDate: nextFollowUpDate && !isOrderClosed ? new Date(nextFollowUpDate + "T00:00:00").toISOString() : undefined,
      })
      setRemarks("")
      setNextFollowUpDate("")
      toast({ title: "Follow-up added" })
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed", description: "Failed to add follow-up." })
    }
  }

  const handleTransfer = async () => {
    if (!leadDetails.leadId || !transferredTo) {
        toast({ variant: 'destructive', title: 'Transfer Error', description: 'Please select an executive to transfer to.' });
        return;
    }

    try {
        await updateLead(leadDetails.leadId, {
            executive: transferredTo,
            toExecutive: true,
            executiveViewDate: undefined
        });
        toast({ title: 'Lead Transferred', description: `Lead successfully transferred to ${transferredTo}.` });
        setTransferredTo("");
    } catch (error) {
        toast({ variant: 'destructive', title: 'Transfer Failed', description: 'Failed to transfer lead.' });
    }
  }

  const handleUpdateStatus = async () => {
    if (!leadDetails.leadId || !selectedStatus) return
    
    const isValueStatus = selectedStatus === 'Proposal Sent' || selectedStatus === 'Order closed';
    
    const payload: Partial<LeadFormData> = {
      status: selectedStatus,
      leadSubStatus: selectedStatus === "Not interested" ? selectedSubStatus : "",
      monthlyContractValue: isValueStatus ? monthlyContractValue : leadDetails.monthlyContractValue,
      annualContractValue: isValueStatus ? annualContractValue : leadDetails.annualContractValue,
      initialRemarks: leadDetails.initialRemarks, 
    }

    try {
      await updateLead(leadDetails.leadId, payload)
      toast({ title: "Status Updated" })
      setCurrentStatus(selectedStatus)
      setSelectedStatus("")
    } catch (error) {
        toast({ variant: 'destructive', title: 'Update Failed', description: 'Failed to update status.' });
    }
  }

  const handleResetLeadDetails = () => {
    setLeadDetails({})
    setFollowUps([])
    setCurrentStatus("Initial")
    setMonthlyContractValue("")
    setAnnualContractValue("")
    setIsReadyToUpdate(false)
    setRemarks("")
    setNextFollowUpDate("")
    setTransferredTo("")
  }

  const handleSaveLeadDetails = async () => {
    if (!leadDetails.leadId) return
    try {
        await updateLead(leadDetails.leadId, {
            contactPerson: leadDetails.contactPerson,
            contactNumber: leadDetails.contactNumber,
            email: leadDetails.email,
            address: leadDetails.address,
            district: leadDetails.district,
            state: leadDetails.state,
            initialRemarks: leadDetails.initialRemarks
        })
        toast({ title: "Lead Updated" })
        setIsReadyToUpdate(false)
    } catch (error) {
        toast({ variant: 'destructive', title: 'Update Failed', description: 'Failed to save lead details.' });
    }
  }

  const inputBgClass = "bg-muted/50";
  const isOrderClosedInRemarks = remarks.toLowerCase().includes("order closed");

  return (
    <div className="space-y-6">
      {isReadOnly && <Alert variant="default"><Info className="h-4 w-4" /><AlertTitle>Read-Only Mode</AlertTitle></Alert>}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* LEAD CONTACT CARD */}
        <Card>
          <CardHeader><CardTitle className="text-base font-bold uppercase">Lead Contact Card</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="font-semibold">Lead(id)</Label>
                <Input value={leadDetails.leadId || ""} placeholder="Select a lead" readOnly className={inputBgClass} />
              </div>
              <div className="space-y-1">
                <Label className="font-semibold">Company</Label>
                <Input value={leadDetails.company || ""} readOnly className={inputBgClass} />
              </div>
              
              <div className="space-y-1">
                <Label className="font-semibold">Contact person</Label>
                <Input value={leadDetails.contactPerson || ""} onChange={e => handleLeadDetailChange('contactPerson', e.target.value)} readOnly={isReadOnly} className={inputBgClass} />
              </div>
              <div className="space-y-1">
                <Label className="font-semibold">Contact Number</Label>
                <Input value={leadDetails.contactNumber || ""} onChange={e => handleLeadDetailChange('contactNumber', e.target.value)} readOnly={isReadOnly} className={inputBgClass} />
              </div>

              <div className="space-y-1">
                <Label className="font-semibold">Address</Label>
                <Input value={leadDetails.address || ""} onChange={e => handleLeadDetailChange('address', e.target.value)} readOnly={isReadOnly} className={inputBgClass} />
              </div>
              <div className="space-y-1">
                <Label className="font-semibold">Email ID</Label>
                <Input value={leadDetails.email || ""} onChange={e => handleLeadDetailChange('email', e.target.value)} readOnly={isReadOnly} className={inputBgClass} />
              </div>

              <div className="space-y-1">
                <Label className="font-semibold">District</Label>
                <Input value={leadDetails.district || ""} onChange={e => handleLeadDetailChange('district', e.target.value)} readOnly={isReadOnly} className={inputBgClass} />
              </div>
              <div className="space-y-1">
                <Label className="font-semibold">State</Label>
                <Input value={leadDetails.state || ""} onChange={e => handleLeadDetailChange('state', e.target.value)} readOnly={isReadOnly} className={inputBgClass} />
              </div>

              <div className="space-y-1">
                <Label className="font-semibold">Date of lead</Label>
                <Input value={leadDetails.creationDate ? format(new Date(leadDetails.creationDate), 'PPP') : ""} readOnly className={inputBgClass} />
              </div>
              <div className="space-y-1">
                <Label className="font-semibold">Executive viewed date</Label>
                <Input value={leadDetails.executiveViewDate ? format(new Date(leadDetails.executiveViewDate), 'PPP p') : "Not yet seen"} readOnly className={inputBgClass} />
              </div>

              <div className="space-y-1">
                <Label className="font-semibold">Reference</Label>
                <Input value={leadDetails.reference || ""} readOnly className={inputBgClass} />
              </div>
              <div className="space-y-1">
                <Label className="font-semibold">Given By</Label>
                <Input value={leadDetails.givenBy || ""} readOnly className={inputBgClass} />
              </div>

              <div className="space-y-1">
                <Label className="font-semibold">Executive</Label>
                <Input value={leadDetails.executive || ""} readOnly className={inputBgClass} />
              </div>
              <div className="space-y-1">
                <Label className="font-semibold">Manager</Label>
                <Input value={leadDetails.manager || ""} readOnly className={inputBgClass} />
              </div>

              <div className="space-y-1">
                <Label className="font-semibold">Headcount</Label>
                <Input value={leadDetails.headcount || ""} readOnly className={inputBgClass} />
              </div>
              <div className="space-y-1">
                <Label className="font-semibold">Module</Label>
                <div className={`h-10 px-3 py-2 text-sm border rounded-md overflow-x-auto whitespace-nowrap flex items-center ${inputBgClass}`}>
                  {getDisplayModule(leadDetails.selectedModule || "", modules)}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Checkbox id="ready" checked={isReadyToUpdate} onCheckedChange={(c) => setIsReadyToUpdate(!!c)} disabled={isReadOnly} />
                <Label htmlFor="ready" className="font-semibold text-sm">Yes, I am Ready to Update.</Label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveLeadDetails} disabled={!isReadyToUpdate || isReadOnly} className="bg-primary hover:bg-primary/90">Save</Button>
                <Button variant="outline" onClick={handleResetLeadDetails}>Reset</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* LEAD TRACKER */}
        <Card>
          <CardHeader><CardTitle className="text-base font-bold uppercase">Lead Tracker</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2 p-3 bg-muted/20 rounded-lg border">
              <Label className="font-bold uppercase text-xs text-muted-foreground">Transferred Lead</Label>
              <div className="flex gap-2">
                <Select value={transferredTo} onValueChange={setTransferredTo} disabled={isReadOnly}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select Executive to transfer to..." />
                  </SelectTrigger>
                  <SelectContent>
                    {executives.map(exec => (
                        <SelectItem key={exec} value={exec}>{exec}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleTransfer} disabled={!transferredTo || isReadOnly} size="sm" className="bg-primary hover:bg-primary/90">Transfer</Button>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="font-bold uppercase text-xs text-muted-foreground">Follow Up</Label>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Remarks</Label>
                <Textarea value={remarks} onChange={e => setRemarks(e.target.value)} readOnly={isReadOnly} className="min-h-[100px]" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Next Follow-up Date</Label>
                <Input 
                  type="date" 
                  value={isOrderClosedInRemarks ? "" : nextFollowUpDate} 
                  onChange={e => setNextFollowUpDate(e.target.value)} 
                  disabled={isReadOnly || isOrderClosedInRemarks} 
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => { setRemarks(""); setNextFollowUpDate(""); }}>New</Button>
                <Button onClick={handleAddFollowUp} disabled={isReadOnly} size="sm" className="bg-primary hover:bg-primary/90">Add &gt;&gt;</Button>
              </div>
            </div>

            <div className="border rounded-md overflow-hidden">
                <ScrollArea className="h-[200px]">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-16">Sl No</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Remarks</TableHead>
                                <TableHead>Next Follow-up</TableHead>
                                <TableHead>Entered by</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {followUps.length > 0 ? (
                                followUps.map((fu, idx) => (
                                    <TableRow key={fu.id}>
                                        <TableCell>{idx + 1}</TableCell>
                                        <TableCell>{format(new Date(fu.date), 'MM/dd/yyyy')}</TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={fu.remarks}>{fu.remarks}</TableCell>
                                        <TableCell>{fu.nextFollowUp}</TableCell>
                                        <TableCell>{fu.enteredBy}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        No follow-ups added yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* LEAD STATUS SECTION */}
      <Card>
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-base font-bold text-primary">Lead Status</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-2">
              <Label className="font-bold text-sm">Initial Remarks</Label>
              <Textarea 
                placeholder="Enter initial remarks for the lead..." 
                value={leadDetails.initialRemarks || ""} 
                onChange={e => handleLeadDetailChange('initialRemarks', e.target.value)}
                readOnly={isReadOnly}
                className="min-h-[120px] bg-muted/5"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-sm">Current Status</Label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <span className="text-sm font-semibold text-muted-foreground min-w-[60px]">({currentStatus})</span>
                <div className="flex w-full items-center gap-2">
                  <Select value={selectedStatus} onValueChange={setSelectedStatus} disabled={isReadOnly}>
                    <SelectTrigger className="flex-1 bg-muted/5">
                      <SelectValue placeholder="-- Select --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      {filteredLeadStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleUpdateStatus} disabled={!selectedStatus || isReadOnly} className="bg-primary hover:bg-primary/90 px-6">
                    Update
                  </Button>
                </div>
              </div>
              
              {(selectedStatus === 'Proposal Sent' || selectedStatus === 'Order closed') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 p-4 bg-muted/10 rounded-lg border">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Monthly Value (INR)</Label>
                    <Input type="number" value={monthlyContractValue} onChange={e => setMonthlyContractValue(e.target.value)} disabled={isReadOnly} placeholder="0.00" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Annual Value (INR)</Label>
                    <Input type="number" value={annualContractValue} onChange={e => setAnnualContractValue(e.target.value)} disabled={isReadOnly} placeholder="0.00" />
                  </div>
                </div>
              )}
              
              {selectedStatus === 'Not interested' && (
                <div className="mt-4 p-4 bg-muted/10 rounded-lg border">
                    <Label className="text-xs font-semibold mb-2 block">Reason for Not Interested</Label>
                    <Select value={selectedSubStatus} onValueChange={setSelectedSubStatus} disabled={isReadOnly}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Reason..." />
                    </SelectTrigger>
                    <SelectContent>
                        {leadSubStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                    </Select>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
