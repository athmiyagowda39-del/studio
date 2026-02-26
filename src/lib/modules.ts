export const getDisplayModule = (selectedModuleString: string, allModulesList: { name: string, category: string }[]): string => {
  if (!selectedModuleString || !allModulesList || allModulesList.length === 0) return 'N/A';

  const selected = new Set(selectedModuleString.split(', ').filter(Boolean));
  const display = [];

  const categories = ['HR', 'Finance', 'General'];

  for (const cat of categories) {
    const catModules = allModulesList.filter(m => m.category === cat).map(m => m.name);
    if (catModules.length > 0 && catModules.every(m => selected.has(m))) {
      display.push(`${cat} Module`);
      catModules.forEach(m => selected.delete(m));
    }
  }

  display.push(...Array.from(selected));
  
  return display.length > 0 ? display.join(', ') : 'N/A';
};
