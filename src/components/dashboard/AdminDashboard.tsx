import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { FastReceptionistModal } from "@/components/receptionist/FastReceptionistModal";
import StatsCards from "@/components/dashboard/StatsCards";
import { MonthSelector } from "@/components/dashboard/MonthSelector";
import { DateRangeFilter } from "@/components/dashboard/DateRangeFilter";
import { HallsGrid } from "@/components/dashboard/HallsGrid";
import { useAuth } from "@/hooks/useAuth";

import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/api/dashboard";

export function AdminDashboard() {
  const { profile } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [dateRange, setDateRange] = useState<{ startDate?: Date; endDate?: Date }>({});
  const [isFastReceptionistOpen, setIsFastReceptionistOpen] = useState(false);
  
  // Local permission helper to align with `can('create:registrations')`
  const can = (permission: string) => {
    if (permission === 'create:registrations') {
      // Allow all non-teacher roles (consistent with registrations page)
      return profile?.role !== 'user';
    }
    return false;
  };

  const handleMonthChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    // Clear date range when month changes
    setDateRange({});
  };

  const handleDateRangeChange = (startDate: Date | undefined, endDate: Date | undefined) => {
    setDateRange({ startDate, endDate });
  };

  // Fetch per-hall occupancy for the grid using the new API layer
  const { data: occupancyData } = useQuery({
    queryKey: ['hall-occupancy-dashboard'],
    queryFn: () => dashboardApi.getHallOccupancy(),
    staleTime: 30_000,
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">لوحة التحكم</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {can('create:registrations') && (
            <Button 
              onClick={() => setIsFastReceptionistOpen(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="ml-2 h-4 w-4" />
              تسجيل سريع
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <MonthSelector 
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={handleMonthChange}
        />
        <DateRangeFilter
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onDateRangeChange={handleDateRangeChange}
        />
      </div>

      <StatsCards 
        selectedMonth={selectedMonth} 
        selectedYear={selectedYear}
        dateRange={dateRange}
      />

      <HallsGrid occupancyData={occupancyData || []} />

      <FastReceptionistModal 
        isOpen={isFastReceptionistOpen} 
        onClose={() => setIsFastReceptionistOpen(false)} 
      />
    </div>
  );
}
