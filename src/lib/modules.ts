
export const hrCoreModules = [
  'Manpower Resource Planning',
  'Recruitment and Requisition Management',
  'Onboarding',
  'Letter Generation',
  'Leave Management',
];

export const attendanceSubModules = [
  'Desktop Attendance Marking Only',
  'Integration with Attendance Machine',
  'Mobile Attendance Marking without Location',
  'Geo Fencing',
  'Geo Tracking',
];

export const hrExtendedModules = [
  'Shift Roaster Management',
  'Timesheet Management',
  'Performance Management',
  'Training Management',
  'Employee Movement / Transfer',
  'Probation to Confirmation',
  'Employee Database Management',
  'Mobile App',
  'Employee Self Service',
];

export const financeModules = ['Payroll', 'Separation', 'Travel and Expense'];

export const generalModules = [
  'Broadcast | Survey',
  'Query Management',
  'Asset Tracking',
  'Rewards Recognition',
  'Organogram',
  'Declaration | Reprimands',
  'Ex-Employee Portal',
];

export const allHrModules = [...hrCoreModules, 'Attendance Management', ...attendanceSubModules, ...hrExtendedModules];
export const allFinanceModules = [...financeModules];
export const allGeneralModules = [...generalModules];
export const allAttendanceModules = ['Attendance Management', ...attendanceSubModules];
export const allModules = [...new Set([...allHrModules, ...allFinanceModules, ...allGeneralModules])];

export const getDisplayModule = (selectedModuleString: string): string => {
  if (!selectedModuleString) return 'N/A';

  const selected = new Set(selectedModuleString.split(', ').filter(Boolean));
  const display = [];

  const hrSet = new Set(allHrModules);
  const financeSet = new Set(allFinanceModules);
  const generalSet = new Set(allGeneralModules);

  let hasAllHr = hrSet.size > 0 && [...hrSet].every(m => selected.has(m));
  let hasAllFinance = financeSet.size > 0 && [...financeSet].every(m => selected.has(m));
  let hasAllGeneral = generalSet.size > 0 && [...generalSet].every(m => selected.has(m));

  if (hasAllHr) {
    display.push('HR Module');
    [...hrSet].forEach(m => selected.delete(m));
  }
  if (hasAllFinance) {
    display.push('Finance Module');
    [...financeSet].forEach(m => selected.delete(m));
  }
  if (hasAllGeneral) {
    display.push('General Module');
    [...generalSet].forEach(m => selected.delete(m));
  }

  display.push(...Array.from(selected));
  
  return display.length > 0 ? display.join(', ') : 'N/A';
};
