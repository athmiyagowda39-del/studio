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
    selectedCity: string;
    setSelectedCity: (value: string) => void;
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

const stateCityMap: Record<string, string[]> = {
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
    selectedCity,
    setSelectedCity,
}: LeadPerformanceFiltersProps) {
    const [stateOpen, setStateOpen] = useState(false);
    const [cityOpen, setCityOpen] = useState(false);

    const cities = useMemo(() => {
        if (selectedState === 'all') {
            const allCities = Object.values(stateCityMap).flat();
            const uniqueCities = Array.from(new Set(allCities));
            return ['all', ...uniqueCities.sort()];
        }
        return ['all', ...(stateCityMap[selectedState] || [])];
    }, [selectedState]);

    const handleStateChange = (value: string) => {
        const state = allIndianStates.find(s => s.toLowerCase() === value) || 'all';
        setSelectedState(state);
        setSelectedCity('all');
        setStateOpen(false);
    }
    
    const handleCityChange = (value: string) => {
        const city = cities.find(c => c.toLowerCase() === value) || 'all';
        setSelectedCity(city);
        setCityOpen(false);
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
                <span className="text-sm font-medium">City:</span>
                <Popover open={cityOpen} onOpenChange={setCityOpen}>
                    <PopoverTrigger asChild>
                         <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={cityOpen}
                            className="w-[180px] justify-between font-normal"
                            disabled={cities.length <= 1}
                        >
                            {selectedCity === 'all' ? 'All Cities' : selectedCity}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[180px] p-0">
                        <Command>
                            <CommandInput placeholder="Search city..." />
                            <CommandList>
                                <CommandEmpty>No city found.</CommandEmpty>
                                <CommandGroup>
                                    <ScrollArea className="h-48">
                                        {cities.map((city) => (
                                            <CommandItem
                                                key={city}
                                                value={city.toLowerCase()}
                                                onSelect={handleCityChange}
                                            >
                                                <Check
                                                    className={cn(
                                                        'mr-2 h-4 w-4',
                                                        selectedCity === city ? 'opacity-100' : 'opacity-0'
                                                    )}
                                                />
                                                {city === 'all' ? 'All Cities' : city}
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
