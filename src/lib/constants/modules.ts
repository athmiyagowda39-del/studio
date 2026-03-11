
export type ModuleOption = {
  name: string;
  category: string;
};

export const APP_MODULES: ModuleOption[] = [
  // HR Modules
  { name: 'Attendance Management', category: 'HR' },
  { name: 'Desktop Attendance Marking Only', category: 'HR' },
  { name: 'Employee Database Management', category: 'HR' },
  { name: 'Employee Movement / Transfer', category: 'HR' },
  { name: 'Employee Self Service', category: 'HR' },
  { name: 'Geo Fencing', category: 'HR' },
  { name: 'Geo Tracking', category: 'HR' },
  
  // Finance Modules
  { name: 'Payroll', category: 'Finance' },
  { name: 'Separation', category: 'Finance' },
  { name: 'Travel and Expense', category: 'Finance' },
  
  // General Modules
  { name: 'Asset Tracking', category: 'General' },
  { name: 'Broadcast | Survey', category: 'General' },
  { name: 'Declaration | Reprimands', category: 'General' },
  { name: 'Ex-Employee Portal', category: 'General' },
  { name: 'Organogram', category: 'General' },
  { name: 'Query Management', category: 'General' },
  { name: 'Rewards Recognition', category: 'General' },
];
