import React, { ReactNode } from 'react';
import { MonthContext, useMonthNavigation } from '@/hooks/useMonthNavigation';

interface MonthProviderProps {
  children: ReactNode;
}

export const MonthProvider: React.FC<MonthProviderProps> = ({ children }) => {
  const monthNavigation = useMonthNavigation();
  
  return (
    <MonthContext.Provider value={monthNavigation}>
      {children}
    </MonthContext.Provider>
  );
};