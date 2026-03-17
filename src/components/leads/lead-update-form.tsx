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
import { Card, CardContent, CardHeader, CardTitle } from "@/Card"
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
import { useApp, type AppUser } from "@/context/app-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info, Trash2 } from "lucide-react"
import { getDisplayModule } from "@/lib/modules"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type FollowUp = {
  id: number
  date: string
  remarks: string
  nextFollowUp: string
  enteredBy: string
}

function ExpandableCell({ content, title }: { content: string | null | undefined, title: string }) {
  if (!content || content === 'N/A') return <span className="text-muted-foreground">N/A</span>;
  
  const isShort = content.length < 35;

  if (isShort) {
    return <span>{content}</span>;
  }

  return (
    <Popover modal={false}>
      <PopoverTrigger asChild>
        <div 
          className="flex items-center gap-2 cursor-pointer group transition-colors hover:text-primary max-w-[200px]"
        >
          <span className="flex-1 truncate">{content}</span>
          <span className="shrink-0 text-[9px] font-bold bg-muted px-1.5 py-0.5 rounded-sm opacity-60 group-hover:opacity-100 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
            VIEW
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-4 shadow-2xl border-2 z-50 pointer-events-auto"
      >
        <div className="space-y-2">
          <h4 className="font-bold text-xs uppercase text-primary border-b pb-1 tracking-wider">{title}</h4>
          <div className="text-sm whitespace-normal break-words leading-relaxed max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {content}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function UserInfoPopover({ username, users }: { username: string | undefined, users: AppUser[] }) {
  const foundUser = users.find(u => u.username === username);
  
  if (!username || username === "N/A" || !foundUser) {
    return (
      <Popover modal={false}>
        <PopoverTrigger asChild>
          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
            <Info className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-4">
          <p className="text-sm font-medium text-muted-foreground">No user details available for "{username || 'N/A'}"</p>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover modal={false}>
      <PopoverTrigger asChild>
        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
          <Info className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-5 shadow-2xl border-2 animate-in fade-in zoom-in-95 duration-200">
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <Info className="h-4 w-4 text-primary" />
            <h4 className="font-bold text-xs uppercase text-primary tracking-widest">User Details</h4>
          </div>
          <div className="grid grid-cols-[70px_1fr] gap-x-4 gap-y-3 text-sm">
            <span className="font-semibold text-muted-foreground">Name:</span>
            <span className="text-foreground font-medium">{foundUser.username}</span>
            
            <span className="font-semibold text-muted-foreground">Email:</span>
            <span className="text-foreground break-all leading-tight">{foundUser.email}</span>
            
            <span className="font-semibold text-muted-foreground">Phone:</span>
            <span className="text-foreground font-medium">{foundUser.phoneNumber || 'N/A'}</span>
            
            <span className="font-semibold text-muted-foreground">Role:</span>
            <span className="text-foreground font-medium">{foundUser.role}</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function LeadUpdateForm({ leadId, onClearSelection }: { leadId: string | null, onClearSelection?: () => void }) {
  const [leadDetails, setLeadDetails] = useState<Partial<LeadFormData>>({})
  const [remarks, setRemarks] = useState("")
  const [followUpDate, setFollowUpDate] = useState("") 
  const [nextFollowUpDate, setNextFollowUpDate] = useState("")
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [currentStatus, setCurrentStatus] = useState("Initial")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [selectedSubStatus, setSelectedSubStatus] = useState("")
  const [monthlyContractValue, setMonthlyContractValue] = useState("")
  const [annualContractValue, setAnnualContractValue] = useState("")
  const [transferredTo, setTransferredTo] = useState("")
  const [isReadyToUpdate, setIsReadyToUpdate] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const { toast } = useToast()
  const { users, user, isReadOnly, leads: allLeads, updateLead, deleteLead, leadStatuses, leadSubStatuses, modules } = useApp()
  
  const filteredLeadStatuses = useMemo(() => {
    const base = leadStatuses.filter(status => status !== 'Quote Sent');
    const extra = ['Drop', 'Lost'].filter(s => !base.includes(s));
    return [...base, ...extra];
  }, [leadStatuses]);
  
  const isSuperAdmin = user?.role === 'Super Admin';

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
      setFollowUpDate("") 
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
    if (!leadDetails.leadId) return
    const isOrderClosed = remarks.toLowerCase().includes("order closed")
    
    if (!followUpDate) {
      toast({ variant: "destructive", title: "Missing Date", description: "Please select a Follow-up Date." })
      return
    }

    if (!remarks || (!nextFollowUpDate && !isOrderClosed)) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please provide remarks and next follow-up date." })
      return
    }

    const selectedIsoDate = new Date(followUpDate + "T00:00:00").toISOString();

    const newFollowUp: FollowUp = {
      id: (followUps?.length || 0) + 1,
      date: selectedIsoDate,
      remarks: remarks,
      nextFollowUp: nextFollowUpDate && !isOrderClosed ? format(new Date(nextFollowUpDate + "T00:00:00"), "PPP") : "N/A",
      enteredBy: user?.username || "System",
    }

    try {
      await updateLead(leadDetails.leadId, {
        followUps: [...(followUps || []), newFollowUp],
        nextFollowUpDate: nextFollowUpDate && !isOrderClosed ? new Date(nextFollowUpDate + "T00:00:00").toISOString() : undefined,
        creationDate: selectedIsoDate, // Set Lead Date to match the selected Follow-up Date
      })
      setRemarks("")
      setFollowUpDate("") 
      setNextFollowUpDate("")
      toast({ title: "Follow-up added & Lead Date updated" })
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

    if (!leadDetails.executiveViewDate) {
        payload.executiveViewDate = new Date().toISOString();
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
    setFollowUpDate("") 
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

  const handleDeleteLead = async () => {
    if (!leadDetails.leadId) return;
    setIsDeleting(true);
    try {
      await deleteLead(leadDetails.leadId);
      
      toast({ 
        title: "Lead Deleted", 
        description: `Lead ${leadDetails.leadId} has been successfully removed.` 
      });
      
      if (onClearSelection) onClearSelection();
      handleResetLeadDetails();
    } catch (error: any) {
      console.error("Delete Lead Error:", error);
      toast({ 
        variant: 'destructive', 
        title: 'Delete Failed', 
        description: error.message || 'Database error: Ensure the lead has no dependencies and you have sufficient permissions.' 
      });
    } finally {
      setIsDeleting(false);
    }
  };

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
                <div className="relative">
                  <Input value={leadDetails.executive || ""} readOnly className={`${inputBgClass} pr-10`} />
                  <UserInfoPopover username={leadDetails.executive} users={users} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="font-semibold">Manager</Label>
                <div className="relative">
                  <Input value={leadDetails.manager || ""} readOnly className={`${inputBgClass} pr-10`} />
                  <UserInfoPopover username={leadDetails.manager} users={users} />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="font-semibold">Headcount</Label>
                <Input value={leadDetails.headcount || ""} readOnly className={inputBgClass} />
              </div>
              <div className="space-y-1">
                <Label className="font-semibold">Module</Label>
                <div className={`h-10 px-3 py-2 text-sm border rounded-md overflow-x-auto whitespace-nowrap flex items-center no-scrollbar ${inputBgClass}`}>
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
                {isSuperAdmin && leadDetails.leadId && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="gap-2">
                        <Trash2 className="h-4 w-4" />
                        Delete Lead
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete lead <strong>{leadDetails.leadId}</strong> for <strong>{leadDetails.company}</strong>.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDeleteLead} 
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={isDeleting}
                        >
                          {isDeleting ? 'Deleting...' : 'Permanently Delete'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
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
                <Select value={transferredTo} onValueChange={setTransferredTo} disabled={isReadOnly} modal={false}>
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
                <Label className="text-xs font-semibold">Follow-up Date</Label>
                <Input 
                  type="date" 
                  value={followUpDate} 
                  onChange={e => setFollowUpDate(e.target.value)} 
                  disabled={isReadOnly} 
                />
              </div>
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
                <Button variant="outline" size="sm" onClick={() => { setRemarks(""); setNextFollowUpDate(""); setFollowUpDate(""); }}>New</Button>
                <Button onClick={handleAddFollowUp} disabled={isReadOnly} size="sm" className="bg-primary hover:bg-primary/90">Add &gt;&gt;</Button>
              </div>
            </div>

            <div className="border rounded-md overflow-hidden">
                <ScrollArea className="h-[200px]">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-16">Sl No</TableHead>
                                <TableHead>Follow up date</TableHead>
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
                                        <TableCell>
                                            <ExpandableCell content={fu.remarks} title="Follow-up Remarks" />
                                        </TableCell>
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
                  <Select value={selectedStatus} onValueChange={setSelectedStatus} disabled={isReadOnly} modal={false}>
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
                    <Select value={selectedSubStatus} onValueChange={setSelectedSubStatus} disabled={isReadOnly} modal={false}>
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
