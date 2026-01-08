'use client';

import { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { LeadFormData } from '@/components/leads/lead-upload-form';

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

export default function LeadPerformanceFilters({
    allLeads,
    selectedPeriod,
    setSelectedPeriod,
    selectedState,
    setSelectedState,
    selectedCity,
    setSelectedCity,
}: LeadPerformanceFiltersProps) {
    
    const states = useMemo(() => {
        const stateSet = new Set(allLeads.map(lead => lead.state).filter(Boolean));
        return ['all', ...Array.from(stateSet)];
    }, [allLeads]);

    const cities = useMemo(() => {
        if (selectedState === 'all') {
            const citySet = new Set(allLeads.map(lead => lead.district).filter(Boolean));
            return ['all', ...Array.from(citySet)];
        }
        const citySet = new Set(allLeads.filter(lead => lead.state === selectedState).map(lead => lead.district).filter(Boolean));
        return ['all', ...Array.from(citySet)];
    }, [allLeads, selectedState]);

    const handleStateChange = (value: string) => {
        setSelectedState(value);
        setSelectedCity('all');
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
                <Select value={selectedState} onValueChange={handleStateChange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                        {states.map(state => (
                            <SelectItem key={state} value={state} className="capitalize">
                                {state === 'all' ? 'All States' : state}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium">City:</span>
                <Select value={selectedCity} onValueChange={setSelectedCity} disabled={selectedState === 'all' && cities.length <= 1}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select City" />
                    </SelectTrigger>
                    <SelectContent>
                        {cities.map(city => (
                            <SelectItem key={city} value={city} className="capitalize">
                                {city === 'all' ? 'All Cities' : city}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}