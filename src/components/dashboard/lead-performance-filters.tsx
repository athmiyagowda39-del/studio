'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function LeadPerformanceFilters() {
    const [period] = useState('November');
    const [state] = useState('Karnataka');
    const [city] = useState('All');

  return (
    <div className="flex items-center justify-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Period:</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-[150px] justify-between">
              {period} <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>November</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">State:</span>
         <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-[150px] justify-between">
              {state} <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Karnataka</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">City:</span>
         <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-[150px] justify-between">
              {city} <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>All</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
