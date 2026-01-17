
'use client';

import { useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { LeadFormData } from '@/components/leads/lead-upload-form';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

type LeadPerformanceFiltersProps = {
    allLeads: LeadFormData[];
    selectedPeriod: string;
    setSelectedPeriod: (value: string) => void;
    selectedState: string;
    setSelectedState: (value: string) => void;
    selectedDistrict: string;
    setSelectedDistrict: (value: string) => void;
};

const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
];

const allIndianStates = ["all", "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"];

const stateDistrictMap: Record<string, string[]> = {
    "Karnataka": [
        "Bangalore GPO / MG Road", "Shivajinagar", "Malleshwaram", "Rajajinagar", "Jayanagar", "Basavanagudi", "BTM Layout", "JP Nagar", "Yelahanka", "Hebbal", "Whitefield", "Marathahalli", "Electronic City", "KR Puram", "Banashankari", "HSR Layout"
    ],
    "Andhra Pradesh": ["Vijayawada"], "Arunachal Pradesh": ["Itanagar"], "Assam": ["Guwahati"], "Bihar": ["Patna"], "Chhattisgarh": ["Raipur"], "Goa": ["Panaji"], "Gujarat": ["Ahmedabad"], "Haryana": ["Gurugram"], "Himachal Pradesh": ["Shimla"], "Jharkhand": ["Ranchi"], "Kerala": ["Thiruvananthapuram"], "Madhya Pradesh": ["Bhopal"], "Maharashtra": ["Mumbai"], "Manipur": ["Imphal"], "Meghalaya": ["Shillong"], "Mizoram": ["Aizawl"], "Nagaland": ["Kohima"], "Odisha": ["Bhubaneswar"], "Punjab": ["Chandigarh"], "Rajasthan": ["Jaipur"], "Sikkim": ["Gangtok"], "Tamil Nadu": ["Chennai"], "Telangana": ["Hyderabad"], "Tripura": ["Agartala"], "Uttar Pradesh": ["Lucknow"], "Uttarakhand": ["Dehradun"], "West Bengal": ["Kolkata"], "Andaman and Nicobar Islands": ["Port Blair"], "Chandigarh": ["Chandigarh"], "Dadra and Nagar Haveli and Daman and Diu": ["Daman"], "Delhi": ["New Delhi"], "Jammu and Kashmir": ["Srinagar"], "Ladakh": ["Leh"], "Lakshadweep": ["Kavaratti"], "Puducherry": ["Puducherry"],
};


export default function LeadPerformanceFilters({
    allLeads,
    selectedPeriod,
    setSelectedPeriod,
    selectedState,
    setSelectedState,
    selectedDistrict,
    setSelectedDistrict,
}: LeadPerformanceFiltersProps) {
    const [stateOpen, setStateOpen] = useState(false);
    const [districtOpen, setDistrictOpen] = useState(false);

    const districts = useMemo(() => {
        if (selectedState === 'all') {
            const allDistricts = Object.values(stateDistrictMap).flat();
            const uniqueDistricts = Array.from(new Set(allDistricts));
            return ['all', ...uniqueDistricts.sort()];
        }
        return ['all', ...(stateDistrictMap[selectedState] || [])];
    }, [selectedState]);

    const handleStateChange = (value: string) => {
        const state = allIndianStates.find(s => s.toLowerCase() === value) || 'all';
        setSelectedState(state);
        setSelectedDistrict('all');
        setStateOpen(false);
    }
    
    const handleDistrictChange = (value: string) => {
        const district = districts.find(c => c.toLowerCase() === value) || 'all';
        setSelectedDistrict(district);
        setDistrictOpen(false);
    }

    return (
        <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Period:</span>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Period" />
                    </SelectTrigger>
                    <SelectContent>
                        {months.map(month => (
                            <SelectItem key={month.value} value={month.value}>
                                {month.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium">State:</span>
                <Popover open={stateOpen} onOpenChange={setStateOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={stateOpen}
                            className="w-[180px] justify-between font-normal"
                        >
                            {selectedState === 'all' ? 'All States' : selectedState}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[180px] p-0">
                        <Command>
                            <CommandInput placeholder="Search state..." />
                            <CommandList>
                                <CommandEmpty>No state found.</CommandEmpty>
                                <CommandGroup>
                                    <ScrollArea className="h-48">
                                        {allIndianStates.map((state) => (
                                            <CommandItem
                                                key={state}
                                                value={state.toLowerCase()}
                                                onSelect={handleStateChange}
                                            >
                                                <Check
                                                    className={cn(
                                                        'mr-2 h-4 w-4',
                                                        selectedState === state ? 'opacity-100' : 'opacity-0'
                                                    )}
                                                />
                                                {state === 'all' ? 'All States' : state}
                                            </CommandItem>
                                        ))}
                                    </ScrollArea>
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium">District:</span>
                <Popover open={districtOpen} onOpenChange={setDistrictOpen}>
                    <PopoverTrigger asChild>
                         <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={districtOpen}
                            className="w-[180px] justify-between font-normal"
                            disabled={districts.length <= 1}
                        >
                            {selectedDistrict === 'all' ? 'All Districts' : selectedDistrict}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[180px] p-0">
                        <Command>
                            <CommandInput placeholder="Search district..." />
                            <CommandList>
                                <CommandEmpty>No district found.</CommandEmpty>
                                <CommandGroup>
                                    <ScrollArea className="h-48">
                                        {districts.map((district) => (
                                            <CommandItem
                                                key={district}
                                                value={district.toLowerCase()}
                                                onSelect={handleDistrictChange}
                                            >
                                                <Check
                                                    className={cn(
                                                        'mr-2 h-4 w-4',
                                                        selectedDistrict === district ? 'opacity-100' : 'opacity-0'
                                                    )}
                                                />
                                                {district === 'all' ? 'All Districts' : district}
                                            </CommandItem>
                                        ))}
                                    </ScrollArea>
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
}
