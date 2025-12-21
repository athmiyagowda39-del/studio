'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { indianStatesAndDistricts } from '@/lib/data';
import { cn } from '@/lib/utils';

const karnatakaDistricts = indianStatesAndDistricts['Karnataka'].map(
  (district) => ({
    value: district.toLowerCase(),
    label: district,
  })
);

export default function LeadPerformanceFilters() {
  const [period] = useState('November');
  const [state] = useState('Karnataka');
  const [city, setCity] = useState('All');
  const [open, setOpen] = useState(false);

  const handleCitySelect = (currentValue: string) => {
    const selectedDistrict = karnatakaDistricts.find(
      (d) => d.value === currentValue
    );
    setCity(selectedDistrict ? selectedDistrict.label : 'All');
    setOpen(false);
  };

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
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-[200px] justify-between"
            >
              {city}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search district..." />
              <CommandList>
                <CommandEmpty>No district found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    key="all"
                    value="all"
                    onSelect={() => {
                      setCity('All');
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        city === 'All' ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    All
                  </CommandItem>
                  {karnatakaDistricts.map((district) => (
                    <CommandItem
                      key={district.value}
                      value={district.value}
                      onSelect={handleCitySelect}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          city === district.label ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {district.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
