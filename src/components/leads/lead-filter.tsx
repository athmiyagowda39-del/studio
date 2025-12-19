'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function LeadFilter() {
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  return (
    <div className="space-y-4">
      <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span>Filter</span>
            {isFilterOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="mt-2">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Label htmlFor="search">Search</Label>
                  <Input id="search" placeholder="Leave empty for all" />
                </div>
                <div className="flex items-center gap-4">
                  <Label>From:</Label>
                  <RadioGroup defaultValue="both" className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="web" id="web" />
                      <Label htmlFor="web">Web Downloads</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="manual" id="manual" />
                      <Label htmlFor="manual">Manual Uploads</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="both" id="both" />
                      <Label htmlFor="both">Both</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
              <div>
                <RadioGroup className="flex flex-wrap gap-4">
                  <Label>Search for:</Label>
                  {[
                    'Lead ID',
                    'Company',
                    'Contact Person',
                    'Phone',
                    'Cell',
                    'Email',
                    'District',
                    'State',
                    'Manager Name',
                  ].map((item) => (
                    <div className="flex items-center space-x-2" key={item}>
                      <RadioGroupItem
                        value={item.toLowerCase().replace(' ', '')}
                        id={item.toLowerCase().replace(' ', '')}
                      />
                      <Label htmlFor={item.toLowerCase().replace(' ', '')}>
                        {item}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="from-date">From Date</Label>
                  <Input id="from-date" type="date" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="to-date">To Date</Label>
                  <Input id="to-date" type="date" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="product-name">Product Name</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="--All--" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product1">Product 1</SelectItem>
                      <SelectItem value="product2">Product 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="executive-name">Executive Name</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="--All--" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exec1">Executive 1</SelectItem>
                      <SelectItem value="exec2">Executive 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="given-by">Given by</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="--All--" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="given1">Given by 1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="status-of-lead">Status of Lead</Label>
                   <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="--All--" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="status1">Status 1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                 <div className="space-y-1">
                  <Label htmlFor="sub-status-of-lead">Sub Status of Lead</Label>
                   <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="--All--" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="substatus1">Sub-Status 1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lead-source">Lead Source</Label>
                   <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="--All--" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="source1">Source 1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
               <div className="flex items-center space-x-2">
                <Checkbox id="do-not-consider" />
                <Label htmlFor="do-not-consider">
                  Do not consider Order Closed/Fake/Existing Users/Not Interested
                </Label>
              </div>
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center space-x-2 mb-4">
                    <Checkbox id="consider-follow-ups" />
                    <Label htmlFor="consider-follow-ups">consider Follow Ups</Label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-4">
                        <RadioGroup defaultValue="pending" className="flex gap-4">
                            <div className="flex items-center space-x-2">
                            <RadioGroupItem value="pending" id="pending" />
                            <Label htmlFor="pending">Follow Up Pending</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                            <RadioGroupItem value="made" id="made" />
                            <Label htmlFor="made">Follow Up Made</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <div></div>
                    <div></div>
                    <div></div>

                    <div className="space-y-1">
                        <Label htmlFor="follow-up-from-date">From Date</Label>
                        <Input id="follow-up-from-date" type="date" />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="follow-up-to-date">To Date</Label>
                        <Input id="follow-up-to-date" type="date" />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="enter-by">Enter by</Label>
                        <Select>
                            <SelectTrigger>
                            <SelectValue placeholder="--All--" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="user1">User 1</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="remarks">Remarks</Label>
                        <Input id="remarks" />
                    </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button>SHOW</Button>
                <Button variant="outline">TO EXCEL</Button>
                <Button variant="destructive">RESET</Button>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2 mb-4">
            <Button variant="secondary">Recent Leads</Button>
            <Button variant="secondary">Leads not Viewed</Button>
            <Button variant="secondary">Follow Ups Due</Button>
            <Button variant="secondary">Zero Follow Ups!</Button>
            <Button variant="secondary">Search Result</Button>
          </div>
          <p className="text-sm text-muted-foreground mb-2">List of Leads &gt;&gt; [ Leads of Last 2 Days (165 Records) ]</p>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sl No</TableHead>
                  <TableHead>Lead Id</TableHead>
                  <TableHead>Lead Date</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Cell</TableHead>
                  <TableHead>Email ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Add table rows here */}
                <TableRow>
                    <TableCell colSpan={8} className="text-center">No results</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <div className="text-center mt-4">
              <Button variant="link">Show more Records &gt;&gt; (Show All Record)</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
