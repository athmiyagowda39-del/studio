export type Lead = {
  date: string;
  state: string;
  city: string;
  leads: number;
};

const states = [
  { name: 'California', cities: ['Los Angeles', 'San Francisco', 'San Diego'] },
  { name: 'Texas', cities: ['Houston', 'Austin', 'Dallas'] },
  { name: 'Florida', cities: ['Miami', 'Orlando', 'Tampa'] },
  { name: 'New York', cities: ['New York City', 'Buffalo'] },
  { name: 'Karnataka', cities: ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi'] },
];

let cachedLeadData: Lead[] | null = null;
let todayLeads: number | null = null;

function generateLeadData(): Lead[] {
  if (cachedLeadData) {
    return cachedLeadData;
  }
  
  const data: Lead[] = [];
  const today = new Date('2025-11-15T12:00:00Z'); // Fixed date for consistency
  const daysInMonth = 30;

  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(today.getFullYear(), today.getMonth(), i);
    const dateString = date.toISOString().split('T')[0];

    for (const state of states) {
      for (const city of state.cities) {
        // Generate more leads on weekends
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const baseLeads = isWeekend ? 20 : 10;
        const leads = Math.floor(baseLeads + Math.random() * 30 + (i/2));
        data.push({
          date: dateString,
          state: state.name,
          city: city,
          leads: leads,
        });
      }
    }
  }
  cachedLeadData = data;
  return data;
}

export function getLeadData(): Lead[] {
  return generateLeadData();
}

export function getLeadsForToday(): number {
  if (todayLeads !== null) {
      return todayLeads;
  }

  const allLeads = getLeadData();
  const today = new Date('2025-11-15T12:00:00Z');
  const todayString = today.toISOString().split('T')[0];

  const total = allLeads
    .filter((lead) => lead.date === todayString)
    .reduce((sum, lead) => sum + lead.leads, 0);

  todayLeads = total;
  return total;
}
