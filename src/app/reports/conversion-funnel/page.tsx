
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo, useState, useEffect } from 'react';
import type { LeadFormData } from '@/components/leads/lead-upload-form';
import AppContent from '@/components/layout/app-content';
import { useApp } from '@/context/app-context';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

const ConversionFunnelChart = dynamic(
  () => import('@/components/reports/conversion-funnel-chart'),
  { ssr: false, loading: () => <div className="h-[400px] w-full flex items-center justify-center"><p>Loading Chart...</p></div> }
);

const funnelStages = [
  'Total Leads',
  'Attended',
  'Demo Given',
  'Pursuing to Purchase',
  'Order closed',
];

const getFunnelData = (leads: LeadFormData[]) => {
  const stageOrder: { [key: string]: number } = {
    'Not viewed': 0,
    'Unattended': 0,
    'Attended': 1,
    'Not interested': 1,
    'Do Not Contact': 1,
    'Demo Given': 2,
    'Quote Sent': 2,
    'Proposal Sent': 2,
    'Pursuing to Purchase': 3,
    'Order closed': 4,
  };

  const statusCounts = {
    'Total Leads': leads.length,
    'Attended': leads.filter(l => (stageOrder[l.status || ''] || 0) >= 1).length,
    'Demo Given': leads.filter(l => (stageOrder[l.status || ''] || 0) >= 2).length,
    'Pursuing to Purchase': leads.filter(l => (stageOrder[l.status || ''] || 0) >= 3).length,
    'Order closed': leads.filter(l => (stageOrder[l.status || ''] || 0) >= 4).length,
  };

  return funnelStages.map((stage) => ({
    name: stage,
    value: statusCounts[stage as keyof typeof statusCounts],
  }));
};

const allIndianStates = [
    "all", "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const stateDistrictMap: Record<string, string[]> = {
    "Andhra Pradesh": [ "Anantapur", "Chittoor", "East Godavari", "Guntur", "Krishna", "Kurnool", "Prakasam", "Srikakulam", "Sri Potti Sriramulu Nellore", "Visakhapatnam", "Vizianagaram", "West Godavari", "Y.S.R. Kadapa" ],
    "Arunachal Pradesh": [ "Anjaw", "Changlang", "Dibang Valley", "East Kameng", "East Siang", "Kamle", "Kra Daadi", "Kurung Kumey", "Lepa Rada", "Lohit", "Longding", "Lower Dibang Valley", "Lower Siang", "Lower Subansiri", "Namsai", "Pakke Kessang", "Papum Pare", "Shi Yomi", "Siang", "Tawang", "Tirap", "Upper Siang", "Upper Subansiri", "West Kameng", "West Siang" ],
    "Assam": [ "Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo", "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Dima Hasao", "Goalpara", "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup", "Kamrup Metropolitan", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon", "Nagaon", "Nalbari", "Sivasagar", "Sonitpur", "South Salmara-Mankachar", "Tinsukia", "Udalguri", "West Karbi Anglong" ],
    "Bihar": [ "Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar", "Darbhanga", "East Champaran", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur", "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur", "Nalanda", "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran" ],
    "Chhattisgarh": [ "Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur", "Dantewada", "Dhamtari", "Durg", "Gariaband", "Gaurela-Pendra-Marwahi", "Janjgir-Champa", "Jashpur", "Kabirdham", "Kanker", "Kondagaon", "Korba", "Koriya", "Mahasamund", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sukma", "Surajpur", "Surguja" ],
    "Goa": [ "North Goa", "South Goa" ],
    "Gujarat": [ "Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch", "Bhavnagar", "Botad", "Chhota Udaipur", "Dahod", "Dang", "Devbhoomi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kheda", "Kutch", "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar", "Tapi", "Vadodara", "Valsad" ],
    "Haryana": [ "Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurugram", "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh", "Nuh", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar" ],
    "Himachal Pradesh": [ "Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti", "Mandi", "Shimla", "Sirmaur", "Solan", "Una" ],
    "Jharkhand": [ "Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara", "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi", "Sahebganj", "Seraikela Kharsawan", "Simdega", "West Singhbhum" ],
    "Karnataka": [ "Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar", "Chamarajanagar", "Chikballapur", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayanagara", "Yadgir" ],
    "Kerala": [ "Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad" ],
    "Madhya Pradesh": [ "Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda", "Hoshangabad", "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Mandla", "Mandsaur", "Morena", "Narsinghpur", "Neemuch", "Panna", "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur", "Sheopur", "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Umaria", "Vidisha" ],
    "Maharashtra": [ "Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Osmanabad", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal" ],
    "Manipur": [ "Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", "Jiribam", "Kakching", "Kamjong", "Kangpokpi", "Noney", "Pherzawl", "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul" ],
    "Meghalaya": [ "East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "North Garo Hills", "Ri Bhoi", "South Garo Hills", "South West Garo Hills", "South West Khasi Hills", "West Garo Hills", "West Jaintia Hills", "West Khasi Hills" ],
    "Mizoram": [ "Aizawl", "Champhai", "Hnahthial", "Khawzawl", "Kolasib", "Lawngtlai", "Lunglei", "Mamit", "Saiha", "Saitual", "Serchhip" ],
    "Nagaland": [ "Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon", "Peren", "Phek", "Tuensang", "Wokha", "Zunheboto" ],
    "Odisha": [ "Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack", "Debagarh", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Kendujhar", "Khordha", "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada", "Puri", "Rayagada", "Sambalpur", "Subarnapur", "Sundergarh" ],
    "Punjab": [ "Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Mansa", "Moga", "Mohali", "Muktsar", "Pathankot", "Patiala", "Rupnagar", "Sangrur", "Shaheed Bhagat Singh Nagar", "Tarn Taran" ],
    "Rajasthan": [ "Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur", "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand", "Sawai Madhopur", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur" ],
    "Sikkim": [ "East Sikkim", "North Sikkim", "South Sikkim", "West Sikkim" ],
    "Tamil Nadu": [ "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar" ],
    "Telangana": [ "Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagitial", "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam", "Komaram Bheem", "Mahabubabad", "Mahbubnagar", "Mancherial", "Medak", "Medchal–Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda", "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Ranga Reddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal Rural", "Warangal Urban", "Yadadri Bhuvanagiri" ],
    "Tripura": [ "Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura", "Unakoti", "West Tripura" ],
    "Uttar Pradesh": [ "Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", "Ayodhya", "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", "Bhadohi", "Bijnor", "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kheri", "Kushinagar", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Prayagraj", "Raebareli", "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shravasti", "Siddharthnagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi" ],
    "Uttarakhand": [ "Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi" ],
    "West Bengal": [ "Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur", "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur", "Purba Bardhaman", "Purba Medinipur", "Purulia", "South 24 Parganas", "Uttar Dinajpur" ],
};

export default function ConversionFunnelReportPage() {
  const { user, users, isAuthenticated, isLoading, leads: allLeads } = useApp();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedExecutive, setSelectedExecutive] = useState('all');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');

  useEffect(() => {
    setIsClient(true);
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const visibleLeads = useMemo(() => {
    if (!user || !allLeads) return [];
    if (user.role === 'Executive') {
      return allLeads.filter(lead => lead.executive === user.username);
    }
    return allLeads;
  }, [allLeads, user]);

  const districts = useMemo(() => {
    if (selectedState === 'all') {
      const allDistricts = Object.values(stateDistrictMap).flat();
      const uniqueDistricts = Array.from(new Set(allDistricts));
      return ['all', ...uniqueDistricts.sort()];
    }
    return ['all', ...(stateDistrictMap[selectedState] || [])];
  }, [selectedState]);

  const handleStateChange = (value: string) => {
    setSelectedState(value);
    setSelectedDistrict('all');
  };

  const filteredLeads = useMemo(() => {
    if (!visibleLeads) return [];
    let leads = [...visibleLeads];

    if (fromDate) {
        const fromDateObj = new Date(fromDate);
        fromDateObj.setHours(0, 0, 0, 0);
        leads = leads.filter(lead => lead.creationDate && new Date(lead.creationDate) >= fromDateObj);
    }
    if (toDate) {
        const toDateObj = new Date(toDate);
        toDateObj.setHours(23, 59, 59, 999);
        leads = leads.filter(lead => lead.creationDate && new Date(lead.creationDate) <= toDateObj);
    }

    if (selectedExecutive !== 'all' && user && ['Super Admin', 'Admin', 'Manager'].includes(user.role)) {
      leads = leads.filter(lead => lead.executive === selectedExecutive);
    }

    if (selectedState !== 'all') {
        leads = leads.filter(lead => lead.state === selectedState);
    }

    if (selectedDistrict !== 'all') {
        leads = leads.filter(lead => lead.district === selectedDistrict);
    }
    
    return leads;
  }, [visibleLeads, fromDate, toDate, selectedExecutive, selectedState, selectedDistrict, user]);

  const funnelData = useMemo(() => {
    if (!filteredLeads) return [];
    return getFunnelData(filteredLeads);
  }, [filteredLeads]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <AppContent>
      <Card className="h-full flex flex-col">
        <CardHeader className="bg-primary/10">
          <CardTitle className="text-center text-primary">CONVERSION FUNNEL REPORT</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
           <div className="flex flex-wrap items-end gap-4 p-4 border rounded-lg bg-card">
              <div className="space-y-1">
                  <Label htmlFor="fromDate">From Date</Label>
                  <Input id="fromDate" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                  <Label htmlFor="toDate">To Date</Label>
                  <Input id="toDate" type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
              </div>

              {user && ['Super Admin', 'Admin', 'Manager'].includes(user.role) && (
                  <div className="space-y-1">
                      <Label htmlFor="executive">Executive</Label>
                      <Select value={selectedExecutive} onValueChange={setSelectedExecutive}>
                          <SelectTrigger id="executive" className="w-[180px]">
                              <SelectValue placeholder="All Executives" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">All Executives</SelectItem>
                              {users.filter(u => u.role === 'Executive').map(exec => (
                                  <SelectItem key={exec.id} value={exec.username}>{exec.username}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
              )}

              <div className="space-y-1">
                  <Label htmlFor="state">State</Label>
                  <Select value={selectedState} onValueChange={handleStateChange}>
                      <SelectTrigger id="state" className="w-[180px]">
                          <SelectValue placeholder="All States" />
                      </SelectTrigger>
                      <SelectContent>
                          <ScrollArea className="h-72">
                              {allIndianStates.map(state => (
                                  <SelectItem key={state} value={state}>{state === 'all' ? 'All States' : state}</SelectItem>
                              ))}
                          </ScrollArea>
                      </SelectContent>
                  </Select>
              </div>

              <div className="space-y-1">
                  <Label htmlFor="district">District</Label>
                  <Select value={selectedDistrict} onValueChange={setSelectedDistrict} disabled={selectedState === 'all'}>
                      <SelectTrigger id="district" className="w-[180px]">
                          <SelectValue placeholder="All Districts" />
                      </SelectTrigger>
                      <SelectContent>
                          <ScrollArea className="h-72">
                              {districts.map(district => (
                                  <SelectItem key={district} value={district}>{district === 'all' ? 'All Districts' : district}</SelectItem>
                              ))}
                          </ScrollArea>
                      </SelectContent>
                  </Select>
              </div>
          </div>
          <div className="w-full">
            <p className="text-center text-muted-foreground mb-4">
              Showing {filteredLeads.length} of {visibleLeads.length} total leads.
            </p>
            {isClient && <ConversionFunnelChart data={funnelData} />}
          </div>
        </CardContent>
      </Card>
    </AppContent>
  );
}
