import { useState, useCallback, createContext, useContext } from 'react';

export interface MonthContextType {
  selectedMonth: number;
  selectedYear: number;
  setMonth: (month: number, year: number) => void;
  resetToCurrentMonth: () => void;
  isCurrentMonth: boolean;
  getDateRange: () => { startDate: string; endDate: string; endDateExclusive: string };
  getEffectiveMonth: () => { month: number; year: number };
}

export const MonthContext = createContext<MonthContextType | undefined>(undefined);

export const useMonthNavigation = (): MonthContextType => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  
  const setMonth = useCallback((month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  }, []);
  
  const resetToCurrentMonth = useCallback(() => {
    setSelectedMonth(currentMonth);
    setSelectedYear(currentYear);
  }, [currentMonth, currentYear]);
  
  const isCurrentMonth = selectedMonth === currentMonth && selectedYear === currentYear;
  
  const getDateRange = useCallback(() => {
    const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
    const nextMonth = selectedMonth === 12 ? 1 : selectedMonth + 1;
    const nextYear = selectedMonth === 12 ? selectedYear + 1 : selectedYear;
    const endDateExclusive = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
    const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    
    return { startDate, endDate, endDateExclusive };
  }, [selectedMonth, selectedYear]);
  
  const getEffectiveMonth = useCallback(() => {
    return { month: selectedMonth, year: selectedYear };
  }, [selectedMonth, selectedYear]);
  
  return {
    selectedMonth,
    selectedYear,
    setMonth,
    resetToCurrentMonth,
    isCurrentMonth,
    getDateRange,
    getEffectiveMonth,
  };
};

export const useMonthContext = (): MonthContextType => {
  const context = useContext(MonthContext);
  if (!context) {
    throw new Error('useMonthContext must be used within a MonthProvider');
  }
  return context;
};